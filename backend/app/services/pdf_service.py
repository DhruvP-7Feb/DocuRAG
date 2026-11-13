import io
import logging
from typing import List, Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)

try:
    import pymupdf as fitz
    USE_PYMUPDF = True
except Exception:
    import pypdf
    USE_PYMUPDF = False

class PDFService:
    @staticmethod
    def extract_text_from_file(file_path: Path | str) -> Dict[str, Any]:
        """
        Extracts text and metadata from a PDF file using PyMuPDF (fitz) or pypdf fallback.
        Returns a dictionary with total_pages, pages content, and character counts.
        """
        if USE_PYMUPDF:
            file_path_str = str(file_path)
            doc = fitz.open(file_path_str)
            
            pages_data: List[Dict[str, Any]] = []
            total_chars = 0
            total_words = 0
            
            for page_idx in range(len(doc)):
                page = doc[page_idx]
                page_num = page_idx + 1
                text = page.get_text("text").strip()
                
                char_count = len(text)
                word_count = len(text.split()) if text else 0
                
                total_chars += char_count
                total_words += word_count
                
                pages_data.append({
                    "page_number": page_num,
                    "text": text,
                    "char_count": char_count,
                    "word_count": word_count
                })
                
            doc_metadata = doc.metadata or {}
            total_pages = len(doc)
            doc.close()
            
            return {
                "title": doc_metadata.get("title") or Path(file_path).name,
                "author": doc_metadata.get("author") or "Unknown",
                "total_pages": total_pages,
                "total_chars": total_chars,
                "total_words": total_words,
                "pages": pages_data
            }
        else:
            reader = pypdf.PdfReader(str(file_path))
            pages_data: List[Dict[str, Any]] = []
            total_chars = 0
            total_words = 0
            
            for page_idx, page in enumerate(reader.pages):
                page_num = page_idx + 1
                text = (page.extract_text() or "").strip()
                
                char_count = len(text)
                word_count = len(text.split()) if text else 0
                
                total_chars += char_count
                total_words += word_count
                
                pages_data.append({
                    "page_number": page_num,
                    "text": text,
                    "char_count": char_count,
                    "word_count": word_count
                })
                
            metadata = reader.metadata or {}
            title = None
            author = None
            if metadata:
                title = metadata.get("/Title")
                author = metadata.get("/Author")
                
            return {
                "title": title or Path(file_path).name,
                "author": author or "Unknown",
                "total_pages": len(reader.pages),
                "total_chars": total_chars,
                "total_words": total_words,
                "pages": pages_data
            }

    @staticmethod
    def extract_text_from_bytes(pdf_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Extracts text and metadata directly from in-memory PDF bytes.
        """
        if USE_PYMUPDF:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            
            pages_data: List[Dict[str, Any]] = []
            total_chars = 0
            total_words = 0
            
            for page_idx in range(len(doc)):
                page = doc[page_idx]
                page_num = page_idx + 1
                text = page.get_text("text").strip()
                
                char_count = len(text)
                word_count = len(text.split()) if text else 0
                
                total_chars += char_count
                total_words += word_count
                
                pages_data.append({
                    "page_number": page_num,
                    "text": text,
                    "char_count": char_count,
                    "word_count": word_count
                })
                
            doc_metadata = doc.metadata or {}
            total_pages = len(doc)
            doc.close()
            
            return {
                "title": doc_metadata.get("title") or filename,
                "author": doc_metadata.get("author") or "Unknown",
                "total_pages": total_pages,
                "total_chars": total_chars,
                "total_words": total_words,
                "pages": pages_data
            }
        else:
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            pages_data: List[Dict[str, Any]] = []
            total_chars = 0
            total_words = 0
            
            for page_idx, page in enumerate(reader.pages):
                page_num = page_idx + 1
                text = (page.extract_text() or "").strip()
                
                char_count = len(text)
                word_count = len(text.split()) if text else 0
                
                total_chars += char_count
                total_words += word_count
                
                pages_data.append({
                    "page_number": page_num,
                    "text": text,
                    "char_count": char_count,
                    "word_count": word_count
                })
                
            metadata = reader.metadata or {}
            title = None
            author = None
            if metadata:
                title = metadata.get("/Title")
                author = metadata.get("/Author")
                
            return {
                "title": title or filename,
                "author": author or "Unknown",
                "total_pages": len(reader.pages),
                "total_chars": total_chars,
                "total_words": total_words,
                "pages": pages_data
            }
