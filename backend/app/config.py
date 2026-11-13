import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    # App
    APP_NAME: str = "DocuRAG API"
    DEBUG: bool = True
    
    # Storage Paths
    BASE_DIR: Path = BASE_DIR
    UPLOAD_DIR: Path = BASE_DIR / "data" / "uploads"
    CHROMA_PERSIST_DIR: Path = BASE_DIR / "data" / "chroma_db"
    
    # Embeddings (Sentence Transformers)
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"
    EMBEDDING_DEVICE: str = "cpu"  # or 'cuda' if available
    
    # Chunking
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 150
    
    # Google Gemini API
    GEMINI_API_KEY: str = ""
    DEFAULT_GEMINI_MODEL: str = "gemini-3.8-flash"
    DEFAULT_TEMPERATURE: float = 0.2
    
    # Retrieval
    DEFAULT_TOP_K: int = 4
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]

    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.CHROMA_PERSIST_DIR.mkdir(parents=True, exist_ok=True)
