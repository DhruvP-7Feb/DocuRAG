from typing import Optional, List
from pydantic import BaseModel, Field

class DocumentMetadata(BaseModel):
    id: str
    filename: str
    filesize: int
    page_count: int
    chunk_count: int
    uploaded_at: str
    status: str  # "idle", "processing", "ready", "error"
    error_message: Optional[str] = None

class ChunkMetadata(BaseModel):
    chunk_id: str
    page_number: int
    chunk_index: int
    char_count: int
    content_preview: str

class ChunkDetail(BaseModel):
    chunk_id: str
    page_number: int
    chunk_index: int
    content: str

class SourceCitation(BaseModel):
    source_id: str
    page_number: int
    snippet: str
    relevance_score: Optional[float] = None

class QueryRequest(BaseModel):
    query: str
    api_key: Optional[str] = None
    model_name: Optional[str] = None
    top_k: Optional[int] = 4
    temperature: Optional[float] = 0.2

class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceCitation]
    query: str
    model_used: str
    retrieval_latency_ms: float
    generation_latency_ms: float

class AppSettings(BaseModel):
    has_api_key: bool
    gemini_api_key_masked: str
    model_name: str
    top_k: int
    chunk_size: int
    chunk_overlap: int
    embedding_model: str

class SettingsUpdateRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    model_name: Optional[str] = None
    top_k: Optional[int] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None

class PipelineStepStatus(BaseModel):
    step: str
    status: str  # "pending", "in_progress", "completed", "error"
    message: str
    details: Optional[dict] = None
