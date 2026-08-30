# Project Status & Roadmap

This file tracks the implementation progress of the Sovereign On-Premise Agentic AI Workbench. 
**Status Legend:**
- `[x]` Done
- `[/]` In Progress
- `[ ]` To Do
- `[!]` Failed / Blocked

---

## Phase 1: Foundation & Scaffolding
- `[x]` Define system architecture and tech stack (`ARCHITECTURE_DESIGN.md`).
- `[x]` Append AI rules to `AGENTS.md`.
- `[x]` Create developer setup instructions (`README.md`).
- `[x]` Scaffold Next.js frontend (`/frontend`).
- `[x]` Scaffold FastAPI backend requirements (`/backend/requirements.txt`).
- `[x]` Define core Pydantic agent schemas (`/backend/schemas/agent.py`).

## Phase 2: RAG & Document Ingestion
- `[ ]` **Database Initialization:** Setup `backend/services/vector_store.py` to initialize ChromaDB connection.
- `[ ]` **PDF Parsing:** Implement PyPDF2 extraction logic in `backend/knowledge_base/parser.py`.
- `[ ]` **Text Chunking:** Implement LangChain `RecursiveCharacterTextSplitter` for semantic chunking.
- `[ ]` **Embedding Generation:** Setup CPU-optimized embeddings (e.g., `all-MiniLM-L6-v2`).
- `[ ]` **Hybrid Search Logic:** Implement BM25 (keyword search) alongside Vector semantic search.
- `[ ]` **API Endpoints (Upload & Delete):** Create FastAPI `POST /upload`, `GET /documents`, and `DELETE /documents/{id}` endpoints. Ensure uploaded PDFs are securely saved to `backend/data/uploads/` before vectorizing.
- `[ ]` **Admin UI (Document Manager):** Build Next.js Admin Dashboard to upload PDFs, view a list of all active PDFs, and a "Delete" button that securely removes the file and purges its embeddings from ChromaDB.
- `[ ]` **Admin Route Protection:** Add a simple `.env` hardcoded password (Basic Auth) to the `/admin` route to prevent unauthorized access during the demo.

## Phase 3: Core Agents Implementation
- `[ ]` **Ollama Connection:** Build `backend/services/llm_provider.py` to communicate with local Ollama API.
- `[ ]` **Orchestrator Agent:** Implement intent classification to route user queries to the correct specialized agent.
- `[ ]` **RAG Agent:** Implement prompt templates to feed retrieved ChromaDB chunks into Llama 3 for grounded answers.
- `[ ]` **Data Analysis Agent:** Setup local Python `exec()` logic to securely load and analyze CSV/Excel data.
- `[ ]` **Visual Agent:** Integrate LLaVA model for image processing and extract structured findings from equipment photos.
- `[ ]` **Report Generation Agent:** Build logic to synthesize JSON findings from other agents into a professional markdown report.
- `[ ]` **Chat API Endpoints:** Create FastAPI endpoints for `POST /chat`, `POST /session` (New Chat), and `GET /sessions`. Implement **Server-Sent Events (SSE)** via `StreamingResponse` for real-time output.
- `[ ]` **Chat UI:** Build Next.js Chat interface with message history rendering, a **"New Chat" sidebar**, and a **"Deep Research Mode" toggle switch**. Ensure input box supports `multipart/form-data` drag-and-drop file uploads.
- `[ ]` **Traceability Log UI:** Build a visual component in the chat interface to display the step-by-step agent routing process (Explainable AI).

## Phase 4: Deep Research & Self-Improvement
- `[ ]` **State Database:** Create SQLAlchemy models for persistent `ResearchState`.
- `[ ]` **LangGraph Setup:** Build the state machine workflow for Deep Research loops in `backend/agents/deep_research/`.
- `[ ]` **Agent Tool Calling:** Give the Deep Research agent the ability to programmatically call the RAG, Visual, and Data agents.
- `[ ]` **User Clarification Loops:** Implement logic for the AI to pause and ask the user clarifying questions.
- `[ ]` **Streaming UI:** Upgrade Next.js frontend to support real-time Deep Research state visualization.
- `[ ]` **Rules Engine:** Build parser in `backend/rules/` to read `rules.md` and inject it into system prompts.
- `[ ]` **Feedback System:** Add Thumbs Up/Down UI to chat and logic to extract new rules from user feedback.
- `[ ]` **Rules Dashboard:** Expand Admin Dashboard to allow editing, approving, rejecting, and **temporarily toggling (on/off)** AI rules.


*Note: Update this file as components are built to keep the whole team (and AI assistants) in sync.*
