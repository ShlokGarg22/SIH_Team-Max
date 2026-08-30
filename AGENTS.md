# AGENT RULES

* Always read the existing code and relevant files before making changes.
* The repository is the source of truth; do not rely on assumptions or previous chat context.
* Do not guess. Inspect the codebase when information is unclear.
* Stay within the requested task scope. Do not change unrelated code.
* Follow existing architecture and coding patterns.
* For complex changes, understand and plan before implementing.
* Make small, focused changes instead of unnecessary rewrites.
* Never assume code works just because it was written.
* Always run appropriate tests or verification after making changes.
* Do not claim a task is complete without evidence that it works.
* Do not hide failures or weaken tests just to make them pass.
* Preserve existing functionality when making changes.
* Update relevant documentation when architecture or important behavior changes.
* Leave the codebase clean and understandable for the next agent.
* If something is uncertain or blocked, investigate and clearly report it instead of guessing.

## Core Workflow

**Understand → Plan → Implement → Verify → Fix → Verify Again**

## Project Context (SIH AI Workbench)
* **Stack:** Next.js (Frontend), FastAPI (Backend), SQLite (Relational DB), ChromaDB (Vector DB).
* **AI Constraints:** NO external APIs (OpenAI/Anthropic). All inference must use local **Ollama** (Llama 3 8B, Phi-3). CPU fallback is required.
* **Agent Communication:** Agents must return structured JSON matching the defined Pydantic schemas in `backend/schemas/agent.py`.
* **Deep Research:** Must be synchronous in the session.
* **Sandboxing:** Native Python execution is allowed for data analysis (no Docker required for the prototype).

* **Architecture:** Always read `ARCHITECTURE_DESIGN.md` if you need to understand the detailed system design, folder structure, or database strategy before writing new code.
