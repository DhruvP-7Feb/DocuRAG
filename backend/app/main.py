import os
import uuid
import time
import shutil
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.models.schemas import (
    DocumentMetadata,
    QueryRequest,
    QueryResponse,
    AppSettings,
    SettingsUpdateRequest,
    ChunkDetail
)
from app.services.pdf_service import PDFService
from app.services.chunking_service import ChunkingService
from app.services.vector_store import VectorStoreService
from app.services.rag_service import RAGService

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DocuRAG")

app = FastAPI(
    title=settings.APP_NAME,
    description="Single-PDF Retrieval-Augmented Generation (RAG) System using PyMuPDF, Sentence Transformers, ChromaDB, and Google Gemini API.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all during development for ease of use
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory document tracking for current single PDF
current_document: Optional[DocumentMetadata] = None
vector_store_service: Optional[VectorStoreService] = None
rag_service: Optional[RAGService] = None

def get_vector_store() -> VectorStoreService:
    global vector_store_service
    if vector_store_service is None:
        vector_store_service = VectorStoreService()
    return vector_store_service

def get_rag_service() -> RAGService:
    global rag_service
    if rag_service is None:
        rag_service = RAGService(get_vector_store())
    return rag_service

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing DocuRAG API services...")
    # Pre-warm vector store and embeddings
    try:
        get_vector_store()
        get_rag_service()
        logger.info("DocuRAG API initialized successfully.")
    except Exception as e:
        logger.error(f"Error during startup pre-warming: {e}")

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "embedding_model": settings.EMBEDDING_MODEL_NAME,
        "default_gemini_model": settings.DEFAULT_GEMINI_MODEL,
        "has_active_document": current_document is not None and current_document.status == "ready"
    }

@app.get("/api/document/status", response_model=Optional[DocumentMetadata])
def get_document_status():
    global current_document
    return current_document

@app.get("/api/document/chunks")
def get_document_chunks():
    vstore = get_vector_store()
    chunks = vstore.get_all_chunks()
    return {
        "total_chunks": len(chunks),
        "chunks": chunks
    }

@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    global current_document
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    doc_id = str(uuid.uuid4())[:8]
    filename = file.filename
    save_path = settings.UPLOAD_DIR / f"{doc_id}_{filename}"

    # Record initial state
    current_document = DocumentMetadata(
        id=doc_id,
        filename=filename,
        filesize=0,
        page_count=0,
        chunk_count=0,
        uploaded_at=datetime.utcnow().isoformat(),
        status="processing"
    )

    try:
        # Step 1: Save uploaded file
        t0 = time.perf_counter()
        content = await file.read()
        filesize = len(content)
        current_document.filesize = filesize

        with open(save_path, "wb") as f:
            f.write(content)

        # Step 2: PyMuPDF Page-aware Text Extraction
        logger.info(f"Extracting text from {filename} with PyMuPDF...")
        pdf_data = PDFService.extract_text_from_file(save_path)
        page_count = pdf_data.get("total_pages", 0)
        pages = pdf_data.get("pages", [])

        if page_count == 0 or pdf_data.get("total_chars", 0) == 0:
            raise ValueError("The uploaded PDF has no extractable text. Scanned PDFs without OCR are not supported.")

        current_document.page_count = page_count

        # Step 3: LangChain Chunking with Metadata
        logger.info(f"Chunking {len(pages)} pages with RecursiveCharacterTextSplitter...")
        chunker = ChunkingService(chunk_size=settings.CHUNK_SIZE, chunk_overlap=settings.CHUNK_OVERLAP)
        chunks = chunker.create_chunks_from_pages(pages, document_id=doc_id, filename=filename)
        current_document.chunk_count = len(chunks)

        # Step 4 & 5: Dense Embeddings (Sentence Transformers) & ChromaDB Storage
        logger.info(f"Generating embeddings and indexing {len(chunks)} chunks into ChromaDB...")
        vstore = get_vector_store()
        # Reset collection to maintain single-document focus
        vstore.reset_collection()
        vstore.add_documents(chunks)

        # Mark document as ready
        current_document.status = "ready"
        processing_time_ms = round((time.perf_counter() - t0) * 1000, 2)

        return {
            "success": True,
            "message": f"Document '{filename}' successfully processed and indexed.",
            "document": current_document,
            "pipeline_metrics": {
                "pages_extracted": page_count,
                "total_chars": pdf_data.get("total_chars", 0),
                "total_words": pdf_data.get("total_words", 0),
                "chunks_created": len(chunks),
                "processing_time_ms": processing_time_ms
            }
        }

    except Exception as e:
        logger.error(f"Error processing PDF upload: {e}")
        if current_document:
            current_document.status = "error"
            current_document.error_message = str(e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/query", response_model=QueryResponse)
def query_document(request: QueryRequest):
    global current_document
    if not current_document or current_document.status != "ready":
        # Check if vector store has chunks even if in-memory document was reset
        vstore = get_vector_store()
        if vstore.get_chunk_count() == 0:
            raise HTTPException(
                status_code=400,
                detail="No PDF document is currently indexed. Please upload a PDF first."
            )

    try:
        rag = get_rag_service()
        response = rag.query(
            query_text=request.query,
            api_key=request.api_key,
            model_name=request.model_name,
            top_k=request.top_k or settings.DEFAULT_TOP_K,
            temperature=request.temperature if request.temperature is not None else settings.DEFAULT_TEMPERATURE
        )
        return response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error executing RAG query: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate answer: {str(e)}")

@app.get("/api/settings", response_model=AppSettings)
def get_settings():
    has_key = bool(
        settings.GEMINI_API_KEY
        or os.environ.get("GEMINI_API_KEY")
        or os.environ.get("GOOGLE_API_KEY")
    )
    raw_key = (
        settings.GEMINI_API_KEY
        or os.environ.get("GEMINI_API_KEY")
        or os.environ.get("GOOGLE_API_KEY")
        or ""
    )
    masked_key = ""
    if raw_key:
        masked_key = f"{raw_key[:4]}...{raw_key[-4:]}" if len(raw_key) > 8 else "****"

    return AppSettings(
        has_api_key=has_key,
        gemini_api_key_masked=masked_key,
        model_name=settings.DEFAULT_GEMINI_MODEL,
        top_k=settings.DEFAULT_TOP_K,
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        embedding_model=settings.EMBEDDING_MODEL_NAME
    )

@app.post("/api/settings")
def update_settings(update: SettingsUpdateRequest):
    if update.gemini_api_key is not None:
        settings.GEMINI_API_KEY = update.gemini_api_key.strip()
        os.environ["GEMINI_API_KEY"] = update.gemini_api_key.strip()
    if update.model_name is not None and update.model_name.strip():
        settings.DEFAULT_GEMINI_MODEL = update.model_name.strip()
    if update.top_k is not None and update.top_k > 0:
        settings.DEFAULT_TOP_K = update.top_k
    if update.chunk_size is not None and update.chunk_size > 50:
        settings.CHUNK_SIZE = update.chunk_size
    if update.chunk_overlap is not None and update.chunk_overlap >= 0:
        settings.CHUNK_OVERLAP = update.chunk_overlap

    return {"success": True, "message": "Settings updated successfully."}

@app.post("/api/document/reset")
def reset_document():
    global current_document
    vstore = get_vector_store()
    vstore.reset_collection()
    current_document = None
    return {"success": True, "message": "Document index cleared."}
