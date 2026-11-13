import time
import os
import logging
from typing import List, Dict, Any, Optional
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from app.config import settings
from app.services.vector_store import VectorStoreService
from app.models.schemas import SourceCitation, QueryResponse

logger = logging.getLogger(__name__)

RAG_SYSTEM_PROMPT = """You are DocuRAG, an expert AI document research assistant.
Your task is to answer the user's question accurately and objectively, grounded STRICTLY in the provided document context passages below.

Context Passages:
{context}

Guidelines:
1. Answer the question thoroughly based ONLY on the facts present in the context passages.
2. If the context does not contain enough information to answer the question, explicitly state: "Based on the provided document, there is insufficient information to answer this question." Do not make assumptions or fabricate information.
3. Reference the relevant page numbers in your answer whenever making specific claims (for example: "[Page 3]").
4. Format your answer with clear markdown (bullet points, bold text, or sections where appropriate).
"""

class RAGService:
    def __init__(self, vector_store: Optional[VectorStoreService] = None):
        self.vector_store = vector_store or VectorStoreService()

    def _get_llm(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        temperature: float = 0.2
    ) -> ChatGoogleGenerativeAI:
        resolved_key = (
            api_key
            or settings.GEMINI_API_KEY
            or os.environ.get("GEMINI_API_KEY")
            or os.environ.get("GOOGLE_API_KEY")
        )

        if not resolved_key or resolved_key.strip() == "":
            raise ValueError(
                "Google Gemini API Key is not set. Please provide it in the UI Settings dialog or set GEMINI_API_KEY in your backend .env file."
            )

        resolved_model = model_name or settings.DEFAULT_GEMINI_MODEL
        # Normalization if user enters short name
        if not resolved_model.startswith("gemini-"):
            resolved_model = f"gemini-{resolved_model}"

        return ChatGoogleGenerativeAI(
            model=resolved_model,
            google_api_key=resolved_key,
            temperature=temperature,
            max_output_tokens=2048,
        )

    def query(
        self,
        query_text: str,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        top_k: int = 4,
        temperature: float = 0.2
    ) -> QueryResponse:
        # Step 1: Similarity Search in ChromaDB
        t0 = time.perf_counter()
        retrieved_results = self.vector_store.similarity_search_with_scores(
            query=query_text, k=top_k
        )
        t_retrieval = (time.perf_counter() - t0) * 1000  # ms

        if not retrieved_results:
            return QueryResponse(
                answer="No relevant content found in the document. Please ensure a document is uploaded and indexed.",
                sources=[],
                query=query_text,
                model_used="None",
                retrieval_latency_ms=round(t_retrieval, 2),
                generation_latency_ms=0.0
            )

        # Build context string and source citations
        context_blocks = []
        sources: List[SourceCitation] = []

        for idx, (doc, score) in enumerate(retrieved_results):
            page_num = doc.metadata.get("page_number", 1)
            chunk_id = doc.metadata.get("chunk_id", f"chunk_{idx}")
            clean_content = doc.page_content.strip()

            context_blocks.append(
                f"--- [Passage {idx + 1} | Page {page_num}] ---\n{clean_content}"
            )

            # Build source citation
            # Take a readable snippet
            snippet = clean_content[:280] + ("..." if len(clean_content) > 280 else "")
            
            # Format score: ensure bounded float
            bounded_score = None
            if score is not None:
                try:
                    bounded_score = round(float(score), 4)
                except Exception:
                    bounded_score = None

            sources.append(
                SourceCitation(
                    source_id=chunk_id,
                    page_number=page_num,
                    snippet=snippet,
                    relevance_score=bounded_score
                )
            )

        full_context = "\n\n".join(context_blocks)
        system_prompt = RAG_SYSTEM_PROMPT.format(context=full_context)

        # Step 2: Generation with Gemini LLM
        t_gen_start = time.perf_counter()
        llm = self._get_llm(
            api_key=api_key,
            model_name=model_name,
            temperature=temperature
        )

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=query_text)
        ]

        response = llm.invoke(messages)
        t_generation = (time.perf_counter() - t_gen_start) * 1000  # ms

        used_model_name = model_name or settings.DEFAULT_GEMINI_MODEL

        return QueryResponse(
            answer=response.content,
            sources=sources,
            query=query_text,
            model_used=used_model_name,
            retrieval_latency_ms=round(t_retrieval, 2),
            generation_latency_ms=round(t_generation, 2)
        )
