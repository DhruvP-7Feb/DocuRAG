import os
import logging
from typing import Optional
from langchain_huggingface import HuggingFaceEmbeddings
from app.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    _instance: Optional["EmbeddingService"] = None
    _embeddings: Optional[HuggingFaceEmbeddings] = None

    def __init__(self):
        if EmbeddingService._embeddings is None:
            logger.info(f"Loading SentenceTransformers embedding model: {settings.EMBEDDING_MODEL_NAME}")
            # Try loading from local cached weights first to prevent slow network requests/timeouts
            try:
                EmbeddingService._embeddings = HuggingFaceEmbeddings(
                    model_name=settings.EMBEDDING_MODEL_NAME,
                    model_kwargs={"device": settings.EMBEDDING_DEVICE, "local_files_only": True},
                    encode_kwargs={"normalize_embeddings": True, "batch_size": 32}
                )
            except Exception:
                EmbeddingService._embeddings = HuggingFaceEmbeddings(
                    model_name=settings.EMBEDDING_MODEL_NAME,
                    model_kwargs={"device": settings.EMBEDDING_DEVICE},
                    encode_kwargs={"normalize_embeddings": True, "batch_size": 32}
                )
            logger.info("SentenceTransformers embedding model loaded successfully.")

    @classmethod
    def get_embeddings(cls) -> HuggingFaceEmbeddings:
        if cls._embeddings is None:
            cls()
        return cls._embeddings

    @classmethod
    def get_dimension(cls) -> int:
        # all-MiniLM-L6-v2 has 384 dimensions
        return 384
