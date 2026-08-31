import os
import uuid
from typing import List, Optional
try:
    from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, Depends  # type: ignore
except ImportError:
    pass

try:
    from backend.schemas.agent import AgentResponse, RAGRequestPayload, Evidence
    from backend.agents.rag_agent.rag_agent import RAGAgent
    from backend.services.vector_store import LocalVectorStore
    from backend.services.ollama_service import OllamaService
    from backend.rules.engine import RulesEngine
    from backend.knowledge_base.ingest import ingest_pdf_document, delete_ingested_document
    from backend.storage.db import list_document_records
except ImportError:
    from schemas.agent import AgentResponse, RAGRequestPayload, Evidence  # type: ignore
    from agents.rag_agent.rag_agent import RAGAgent  # type: ignore
    from services.vector_store import LocalVectorStore  # type: ignore
    from services.ollama_service import OllamaService  # type: ignore
    from rules.engine import RulesEngine  # type: ignore
    from knowledge_base.ingest import ingest_pdf_document, delete_ingested_document  # type: ignore
    from storage.db import list_document_records  # type: ignore


router = APIRouter(tags=["RAG & Knowledge Base"])

# Dependency Injection for RAG Agent
def get_rag_agent() -> RAGAgent:
    return RAGAgent(
        rules_engine=RulesEngine(),
        vector_store=LocalVectorStore(),
        ollama_service=OllamaService(),
    )


# -----------------------------------------------------------------------------
# RAG Agent Endpoints
# -----------------------------------------------------------------------------

@router.get("/api/agents/rag/health")
async def rag_agent_health(agent: RAGAgent = Depends(get_rag_agent)):
    """Checks the health, indexed statistics, and local LLM connectivity for RAG."""
    is_ollama_online = agent.ollama_service.is_available()
    vstats = agent.vector_store.get_stats()
    
    return {
        "status": "ready" if is_ollama_online else "degraded_ollama_offline",
        "ollama_available": is_ollama_online,
        "default_text_model": agent.default_model,
        "vector_store": vstats,
    }


@router.post("/api/agents/rag/query", response_model=AgentResponse)
async def query_rag_agent(
    payload: RAGRequestPayload,
    agent: RAGAgent = Depends(get_rag_agent),
):
    """
    Direct endpoint for querying the RAG Agent with hybrid vector + BM25 keyword search.
    """
    task_id = f"task_rag_{uuid.uuid4().hex[:8]}"
    filter_file = payload.context_files[0] if payload.context_files else None
    alpha = 0.5 if payload.hybrid_search else 1.0

    response = agent.query(
        query_text=payload.query,
        task_id=task_id,
        top_k=5,
        alpha=alpha,
        filter_filename=filter_file,
    )
    return response


# -----------------------------------------------------------------------------
# Admin Document Management & Ingestion Endpoints
# -----------------------------------------------------------------------------

@router.post("/api/admin/documents/upload")
@router.post("/api/admin/upload")
async def upload_and_ingest_document(
    file: UploadFile = File(...),
    vector_store: LocalVectorStore = Depends(LocalVectorStore),
):
    """
    Receives an industrial PDF, saves it locally, extracts text, chunks with page tracking,
    and indexes vectors into ChromaDB + BM25 index.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF documents are supported for RAG vector store ingestion."
        )

    try:
        file_bytes = await file.read()
        if len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        ingest_result = ingest_pdf_document(
            file_bytes=file_bytes,
            filename=file.filename,
            vector_store=vector_store,
        )

        if not ingest_result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=f"Document ingestion failed: {ingest_result.get('error')}"
            )

        return ingest_result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error during PDF ingestion: {str(e)}")


@router.get("/api/admin/documents")
async def get_all_documents():
    """
    Lists all tracked documents and their indexing status from the SQLite relational store.
    """
    try:
        return list_document_records()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch documents: {str(e)}")


@router.delete("/api/admin/documents/{filename}")
async def delete_document(
    filename: str,
    vector_store: LocalVectorStore = Depends(LocalVectorStore),
):
    """
    Purges a document from SQLite, deletes its vector embeddings from ChromaDB,
    and removes the physical file from the uploads directory.
    """
    try:
        result = delete_ingested_document(filename=filename, vector_store=vector_store)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete document '{filename}': {str(e)}")
