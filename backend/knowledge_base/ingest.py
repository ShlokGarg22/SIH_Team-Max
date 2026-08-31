import os
import io
import logging
from typing import List, Dict, Any, Optional, Union, Tuple

try:
    import PyPDF2  # type: ignore
except ImportError:
    PyPDF2 = None  # type: ignore

try:
    from langchain.text_splitter import RecursiveCharacterTextSplitter  # type: ignore
except ImportError:
    # Fallback character text splitter if langchain is unavailable
    class RecursiveCharacterTextSplitter:  # type: ignore
        def __init__(self, chunk_size: int = 800, chunk_overlap: int = 100, separators: Optional[List[str]] = None):
            self.chunk_size = chunk_size
            self.chunk_overlap = chunk_overlap

        def split_text(self, text: str) -> List[str]:
            chunks = []
            start = 0
            while start < len(text):
                end = start + self.chunk_size
                chunk = text[start:end]
                if chunk:
                    chunks.append(chunk)
                start += self.chunk_size - self.chunk_overlap
            return chunks

try:
    from backend.services.vector_store import LocalVectorStore
    from backend.storage.db import (
        add_document_record,
        update_document_status,
        delete_document_record,
        UPLOADS_DIR,
    )
except ImportError:
    from services.vector_store import LocalVectorStore  # type: ignore
    from storage.db import (  # type: ignore
        add_document_record,
        update_document_status,
        delete_document_record,
        UPLOADS_DIR,
    )


logger = logging.getLogger("DocumentIngest")
logger.setLevel(logging.INFO)


def extract_pdf_pages(file_input: Union[bytes, str]) -> List[Dict[str, Any]]:
    """
    Extracts text page by page from raw PDF bytes or a file path using PyPDF2.
    Returns a list of dicts: [{"page": 1, "text": "..."}, ...]
    """
    pages_data = []
    
    if isinstance(file_input, bytes):
        stream = io.BytesIO(file_input)
    else:
        stream = open(file_input, "rb")

    try:
        reader = PyPDF2.PdfReader(stream)
        for page_num, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            cleaned_text = text.strip()
            if cleaned_text:
                pages_data.append({
                    "page": page_num,
                    "text": cleaned_text
                })
    except Exception as e:
        logger.error(f"Error parsing PDF: {e}")
        raise ValueError(f"Failed to read PDF file: {str(e)}")
    finally:
        if not isinstance(file_input, bytes):
            stream.close()

    return pages_data


def chunk_document_pages(
    pages_data: List[Dict[str, Any]],
    filename: str,
    chunk_size: int = 800,
    chunk_overlap: int = 100,
) -> Tuple[List[str], List[Dict[str, Any]]]:

    """
    Splits page text into overlapping chunks, embedding strict page metadata.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", "; ", " ", ""]
    )

    chunks: List[str] = []
    metadatas: List[Dict[str, Any]] = []
    chunk_ids: List[str] = []

    global_chunk_idx = 0
    for page_item in pages_data:
        page_num = page_item["page"]
        page_text = page_item["text"]

        page_chunks = splitter.split_text(page_text)
        for sub_idx, chunk_text in enumerate(page_chunks):
            chunk_id = f"{filename}_p{page_num}_c{sub_idx}_{global_chunk_idx}"
            chunks.append(chunk_text)
            metadatas.append({
                "filename": filename,
                "page": page_num,
                "chunk_index": global_chunk_idx,
                "char_length": len(chunk_text),
                "source_type": "pdf",
            })
            chunk_ids.append(chunk_id)
            global_chunk_idx += 1

    return chunks, metadatas, chunk_ids

# Type alias helper
Tuple_Chunks = tuple[List[str], List[Dict[str, Any]], List[str]]


def ingest_pdf_document(
    file_bytes: bytes,
    filename: str,
    vector_store: Optional[LocalVectorStore] = None,
    chunk_size: int = 800,
    chunk_overlap: int = 100,
) -> Dict[str, Any]:
    """
    End-to-end ingestion pipeline:
    1. Saves physical PDF to uploads directory.
    2. Records document in SQLite with 'pending' status.
    3. Extracts pages using PyPDF2.
    4. Chunks text with page attribution.
    5. Indexes chunks into local ChromaDB + BM25 keyword index.
    6. Updates SQLite status to 'indexed'.
    """
    vstore = vector_store or LocalVectorStore()
    
    # Save file to uploads directory
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    file_path = os.path.join(UPLOADS_DIR, filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Record in DB
    add_document_record(filename=filename, file_path=file_path, status="pending")

    try:
        # Extract text page-by-page
        pages_data = extract_pdf_pages(file_bytes)
        if not pages_data:
            update_document_status(filename, "failed")
            return {
                "success": False,
                "filename": filename,
                "error": "No extractable text found in PDF.",
                "total_pages": 0,
                "total_chunks": 0
            }

        # Chunk with page metadata
        chunks, metadatas, chunk_ids = chunk_document_pages(
            pages_data=pages_data,
            filename=filename,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )

        # Index in Vector Store + BM25
        indexed_count = vstore.add_chunks(chunks=chunks, metadatas=metadatas, ids=chunk_ids)

        # Mark as indexed in SQLite
        update_document_status(filename, "indexed")

        logger.info(f"Successfully ingested '{filename}': {len(pages_data)} pages, {indexed_count} chunks.")

        return {
            "success": True,
            "filename": filename,
            "file_path": file_path,
            "total_pages": len(pages_data),
            "total_chunks": indexed_count,
            "status": "indexed",
            "error": None
        }
    except Exception as e:
        logger.error(f"Ingestion failed for '{filename}': {e}")
        update_document_status(filename, "failed")
        return {
            "success": False,
            "filename": filename,
            "error": str(e),
            "total_pages": 0,
            "total_chunks": 0
        }


def delete_ingested_document(
    filename: str,
    vector_store: Optional[LocalVectorStore] = None,
) -> Dict[str, Any]:
    """
    Purges document chunks from ChromaDB & BM25 index,
    removes the database record, and deletes the local uploaded file.
    """
    vstore = vector_store or LocalVectorStore()

    # 1. Purge vector store
    purged_chunks = vstore.delete_by_filename(filename)

    # 2. Delete database record
    db_deleted = delete_document_record(filename)

    # 3. Delete physical file if present
    file_path = os.path.join(UPLOADS_DIR, filename)
    file_removed = False
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            file_removed = True
        except Exception as e:
            logger.warning(f"Could not delete physical file {file_path}: {e}")

    return {
        "success": True,
        "filename": filename,
        "purged_chunks": purged_chunks,
        "db_deleted": db_deleted,
        "file_removed": file_removed
    }
