import os
import re
import uuid
import logging
from typing import List, Optional, Dict, Any, Union

try:
    from backend.schemas.agent import (
        AgentRequest,
        AgentResponse,
        Evidence,
        RAGRequestPayload,
    )
    from backend.services.ollama_service import OllamaService
    from backend.services.vector_store import LocalVectorStore
    from backend.rules.engine import RulesEngine
except ImportError:
    from schemas.agent import (
        AgentRequest,
        AgentResponse,
        Evidence,
        RAGRequestPayload,
    )
    from services.ollama_service import OllamaService
    from services.vector_store import LocalVectorStore
    from rules.engine import RulesEngine

logger = logging.getLogger("RAGAgent")
logger.setLevel(logging.INFO)

INSUFFICIENT_INFO_MESSAGE = "Insufficient information found in the available knowledge base."


class RAGAgent:
    """
    The RAG (Retrieval-Augmented Generation) Agent for the Sovereign AI Workbench.
    Acts as the 'Librarian', querying local confidential documents with Hybrid Search
    (ChromaDB vector + BM25 keyword) and returning grounded answers with page-level citations.
    """

    def __init__(
        self,
        rules_engine: Optional[RulesEngine] = None,
        vector_store: Optional[LocalVectorStore] = None,
        ollama_service: Optional[OllamaService] = None,
        default_model: str = "llama3:8b",
    ):
        self.rules_engine = rules_engine or RulesEngine()
        self.vector_store = vector_store or LocalVectorStore()
        self.ollama_service = ollama_service or OllamaService()
        self.default_model = os.getenv("OLLAMA_MODEL", default_model)

    def build_system_prompt(self, agent_rules: str) -> str:
        """
        Constructs the system prompt for the RAG Agent, enforcing grounded answers,
        strict citations, and injected governance rules.
        """
        return (
            "You are the specialized RAG (Retrieval-Augmented Generation) Agent for a confidential industrial facility (e.g. MRPL Refinery).\n"
            "Your role is the 'Librarian'—providing accurate, grounded answers from standard operating procedures (SOPs), manuals, and reports.\n\n"
            "CRITICAL OPERATIONAL RULES & CONSTRAINTS:\n"
            "1. GROUNDED REASONING: Base your answer EXCLUSIVELY on the provided context passages below.\n"
            "2. ANTI-HALLUCINATION GUARDRAIL: If the provided passages do not contain sufficient facts to answer the question accurately, "
            f'you MUST state explicitly: "{INSUFFICIENT_INFO_MESSAGE}" Do not guess, fabricate procedures, or invent tolerances.\n'
            "3. STRICT CITATIONS: Cite the exact source document name and page number for each claim (e.g., '[Source: SOP-Pump-01.pdf | Page: 4]').\n"
            "4. INDUSTRIAL PRECISION: Keep technical values, temperatures, pressure ratings, and valve identifiers exact.\n\n"
            f"GOVERNANCE & DYNAMIC RULES INJECTED:\n{agent_rules}\n\n"
            "Format your answer clearly with direct technical steps, citations, and any safety warnings mentioned in the context."
        )

    def format_context_prompt(self, query: str, retrieved_chunks: List[Dict[str, Any]]) -> str:
        """Formats query and retrieved chunks into an explicit context block."""
        context_blocks = []
        for i, chunk in enumerate(retrieved_chunks, start=1):
            src = chunk.get("source", "Unknown")
            page = chunk.get("page", "Unknown")
            text = chunk.get("text", "").strip()
            score = chunk.get("score", 0.0)
            context_blocks.append(f"--- [PASSAGE {i}] Source: {src} (Page {page}) [Match Score: {score}] ---\n{text}\n")

        joined_context = "\n".join(context_blocks)

        return (
            f"CONTEXT PASSAGES FROM INDUSTRIAL KNOWLEDGE BASE:\n"
            f"{joined_context}\n"
            f"USER QUERY: {query}\n\n"
            f"GROUNDED TECHNICAL ANSWER WITH CITATIONS:"
        )

    def query(
        self,
        query_text: str,
        task_id: Optional[str] = None,
        top_k: int = 5,
        alpha: float = 0.5,
        filter_filename: Optional[str] = None,
        model: Optional[str] = None,
    ) -> AgentResponse:
        """
        Executes a RAG query through Hybrid Search and local LLM synthesis.
        """
        task_id = task_id or f"task_rag_{uuid.uuid4().hex[:8]}"

        # 1. Retrieve dynamic rules
        injected_rules = self.rules_engine.get_rules_for_agent("RAG Agent", include_global=True)
        system_prompt = self.build_system_prompt(injected_rules)

        # 2. Perform Hybrid Search
        try:
            chunks = self.vector_store.hybrid_search(
                query=query_text,
                top_k=top_k,
                alpha=alpha,
                filter_filename=filter_filename,
            )
        except Exception as e:
            logger.error(f"Hybrid search failed: {e}")
            return AgentResponse(
                task_id=task_id,
                agent_name="rag_agent",
                status="failed",
                findings=[],
                evidence=[],
                confidence=0.0,
                errors=[f"Vector store search failure: {str(e)}"]
            )

        # 3. Handle empty knowledge base or zero matches
        if not chunks:
            logger.info("No matching documents found in knowledge base.")
            return AgentResponse(
                task_id=task_id,
                agent_name="rag_agent",
                status="completed",
                findings=[INSUFFICIENT_INFO_MESSAGE],
                evidence=[],
                confidence=0.0,
                errors=[]
            )

        # 4. Construct Evidence items from retrieved chunks
        evidence_list: List[Evidence] = []
        for chunk in chunks:
            src = chunk.get("source", "Unknown Document")
            page_val = chunk.get("page")
            page_num = int(page_val) if (page_val and str(page_val).isdigit()) else None
            snippet = chunk.get("text", "")[:250] + "..." if len(chunk.get("text", "")) > 250 else chunk.get("text", "")
            conf = float(chunk.get("score", 0.8))

            evidence_list.append(Evidence(
                source=src,
                page=page_num,
                chunk=snippet,
                confidence=round(conf, 3),
            ))

        # 5. Build user prompt and query Ollama
        prompt_with_context = self.format_context_prompt(query_text, chunks)
        target_model = model or self.default_model

        llm_result = self.ollama_service.generate_text(
            prompt=prompt_with_context,
            system_prompt=system_prompt,
            model=target_model,
            temperature=0.1,  # Low temperature for deterministic grounded answers
        )

        if not llm_result.get("success"):
            err = llm_result.get("error", "Local LLM service error")
            logger.warning(f"Ollama generation failed ({err}). Falling back to retrieved chunk excerpts.")
            # Graceful degraded output: provide retrieved snippets
            fallback_findings = [
                f"[Local LLM Offline Notice - Direct Passages Retrieved]",
                *[f"• ({e.source}, Page {e.page}): {e.chunk}" for e in evidence_list[:3]]
            ]
            return AgentResponse(
                task_id=task_id,
                agent_name="rag_agent",
                status="completed",
                findings=fallback_findings,
                evidence=evidence_list,
                confidence=0.7,
                errors=[err]
            )

        raw_answer = llm_result.get("response", "").strip()
        if not raw_answer:
            raw_answer = INSUFFICIENT_INFO_MESSAGE

        # Average confidence from top retrieved chunks
        avg_confidence = round(
            sum(c.get("score", 0.5) for c in chunks) / len(chunks), 2
        ) if chunks else 0.5

        return AgentResponse(
            task_id=task_id,
            agent_name="rag_agent",
            status="completed",
            findings=[raw_answer],
            evidence=evidence_list,
            confidence=avg_confidence,
            errors=[]
        )

    def process_request(self, request: AgentRequest) -> AgentResponse:
        """
        Adapter method conforming to the standardized AgentRequest contract.
        """
        payload = request.payload or {}
        query_text = payload.get("query") or payload.get("prompt") or ""
        top_k = payload.get("top_k", 5)
        alpha = 0.5 if payload.get("hybrid_search", True) else 1.0
        filter_file = payload.get("context_files", [None])[0] if payload.get("context_files") else None
        model = payload.get("model")

        if not query_text:
            return AgentResponse(
                task_id=request.task_id,
                agent_name="rag_agent",
                status="failed",
                findings=[],
                evidence=[],
                confidence=0.0,
                errors=["Payload must contain 'query' or 'prompt' text."]
            )

        return self.query(
            query_text=query_text,
            task_id=request.task_id,
            top_k=top_k,
            alpha=alpha,
            filter_filename=filter_file,
            model=model,
        )
