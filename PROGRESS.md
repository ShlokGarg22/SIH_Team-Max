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
- `[ ]` Setup ChromaDB connection and initialization.
- `[ ]` Create PDF ingestion pipeline (PyPDF2 + Chunking).
- `[ ]` Implement Hybrid Search (BM25 + Vector).
- `[ ]` Build Admin Dashboard UI for document uploads.

## Phase 3: Core Agents Implementation
- `[ ]` Implement Orchestrator Agent (Intent classification & routing).
- `[ ]` Implement RAG Agent (Ollama + ChromaDB).
- `[ ]` Implement Data Analysis Agent (Native Python `exec` execution).
- `[ ]` Implement Visual Agent (LLaVA multimodal integration).

## Phase 4: Deep Research & Self-Improvement
- `[ ]` Build LangGraph State Machine for Deep Research.
- `[ ]` Implement frontend UI for real-time Deep Research streaming.
- `[ ]` Create `rules.md` file and parsing logic for agents.
- `[ ]` Build Admin Dashboard UI for rule editing and approval.

---

*Note: Update this file as components are built to keep the whole team (and AI assistants) in sync.*
