from typing import List, Dict, Any
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.config import settings

class ChunkingService:
    def __init__(self, chunk_size: int = None, chunk_overlap: int = None):
        self.chunk_size = chunk_size or settings.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=["\n\n", "\n", ". ", "! ", "? ", "; ", " ", ""],
            length_function=len
        )

    def create_chunks_from_pages(
        self,
        pages: List[Dict[str, Any]],
        document_id: str,
        filename: str
    ) -> List[Document]:
        """
        Takes page-level text data and splits into LangChain Document chunks,
        preserving page numbers and attaching structured metadata.
        """
        all_chunks: List[Document] = []
        global_chunk_idx = 0

        for page in pages:
            page_text = page.get("text", "").strip()
            page_num = page.get("page_number", 1)

            if not page_text:
                continue

            # Split text of this page
            splits = self.splitter.split_text(page_text)

            for split_idx, split_text in enumerate(splits):
                chunk_id = f"{document_id}_p{page_num}_c{global_chunk_idx}"
                metadata = {
                    "document_id": document_id,
                    "filename": filename,
                    "page_number": page_num,
                    "chunk_index": global_chunk_idx,
                    "page_chunk_index": split_idx,
                    "chunk_id": chunk_id,
                    "char_count": len(split_text)
                }

                all_chunks.append(Document(page_content=split_text, metadata=metadata))
                global_chunk_idx += 1

        return all_chunks
