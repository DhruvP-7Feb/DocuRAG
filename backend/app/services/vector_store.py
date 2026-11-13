import os
import shutil
import logging
from typing import List, Tuple, Dict, Any, Optional
from langchain_core.documents import Document
from langchain_chroma import Chroma
from app.config import settings
from app.services.embedding_service import EmbeddingService

logger = logging.getLogger(__name__)

COLLECTION_NAME = "docurag_single_pdf"

class VectorStoreService:
    def __init__(self):
        self.persist_directory = str(settings.CHROMA_PERSIST_DIR)
        self.embeddings = EmbeddingService.get_embeddings()
        self.vector_store = Chroma(
            collection_name=COLLECTION_NAME,
            embedding_function=self.embeddings,
            persist_directory=self.persist_directory,
            collection_metadata={"hnsw:space": "cosine"}
        )

    def reset_collection(self):
        """
        Clears the collection to ensure single-document focus (ready to extend to multi-doc later).
        """
        try:
            self.vector_store.delete_collection()
        except Exception as e:
            logger.warning(f"Note on resetting collection: {e}")
            
        self.vector_store = Chroma(
            collection_name=COLLECTION_NAME,
            embedding_function=self.embeddings,
            persist_directory=self.persist_directory,
            collection_metadata={"hnsw:space": "cosine"}
        )

    def add_documents(self, documents: List[Document]) -> List[str]:
        """
        Adds chunked LangChain Documents to ChromaDB.
        """
        if not documents:
            return []
        ids = [doc.metadata.get("chunk_id") for doc in documents]
        added_ids = self.vector_store.add_documents(documents=documents, ids=ids)
        return added_ids

    def similarity_search_with_scores(
        self, query: str, k: int = 4
    ) -> List[Tuple[Document, float]]:
        """
        Searches ChromaDB for chunks similar to query and returns (Document, normalized_similarity_score).
        Cosine distance 'dist' is in [0, 2], normalized similarity = 1.0 - (dist / 2.0).
        """
        try:
            docs_and_scores = self.vector_store.similarity_search_with_score(query=query, k=k)
            converted = []
            for doc, dist in docs_and_scores:
                # Cosine distance to similarity percentage score in [0.0, 1.0]
                norm_score = max(0.0, min(1.0, 1.0 - (float(dist) / 2.0)))
                converted.append((doc, round(norm_score, 4)))
            return converted
        except Exception as e:
            logger.error(f"Error in similarity search: {e}")
            docs = self.vector_store.similarity_search(query=query, k=k)
            return [(doc, 0.5) for doc in docs]

    def get_all_chunks(self) -> List[Dict[str, Any]]:
        """
        Returns all chunks currently in the vector store for preview / inspection.
        """
        try:
            data = self.vector_store.get()
            chunks = []
            if data and "documents" in data and data["documents"]:
                docs = data["documents"]
                metadatas = data.get("metadatas") or []
                ids = data.get("ids") or []
                for i in range(len(docs)):
                    meta = metadatas[i] if i < len(metadatas) else {}
                    chunks.append({
                        "chunk_id": ids[i] if i < len(ids) else f"chunk_{i}",
                        "page_number": meta.get("page_number", 1) if meta else 1,
                        "chunk_index": meta.get("chunk_index", i) if meta else i,
                        "char_count": len(docs[i]),
                        "content": docs[i],
                        "content_preview": docs[i][:150] + ("..." if len(docs[i]) > 150 else "")
                    })
            # Sort by chunk_index
            chunks.sort(key=lambda x: x["chunk_index"])
            return chunks
        except Exception as e:
            logger.error(f"Error fetching chunks from Chroma: {e}")
            return []

    def get_chunk_count(self) -> int:
        """
        Returns total number of chunks stored.
        """
        try:
            data = self.vector_store.get()
            return len(data.get("ids", [])) if data else 0
        except Exception:
            return 0
