# System Architecture & Implementation Design
**Project:** Sovereign On-Premise Agentic AI Workbench
**Target Use Case:** Confidential Industrial Work (e.g., MRPL)
**Hardware Target:** Local Laptops (CPU fallback supported)

---

## 1. System Overview
The AI Workbench is a secure, completely on-premise, multi-agent system designed to assist industrial personnel with document retrieval, data analysis, image inspection, and deep research. It does not rely on any external APIs (OpenAI, Anthropic), ensuring absolute data confidentiality.

The system is broken down into three main layers:
1.  **Frontend (UI):** Next.js / React application.
2.  **Backend (Orchestration):** Python FastAPI application managing agent routing and logic.
3.  **Inference & Storage Layer:** Local models via Ollama, local databases (SQLite/ChromaDB), and Markdown files.

---

## 2. Inference & Model Strategy
Because the system must run on standard laptops without assuming the presence of high-end GPUs, we are optimizing for CPU/entry-level GPU execution.

*   **Inference Engine:** **Ollama**
    *   *Why:* Ollama uses `llama.cpp`, which aggressively optimizes models for CPU RAM and Apple Silicon, making it possible to run LLMs on standard laptops.
*   **Selected Models:**
    *   *Orchestrator & Reasoning:* **Llama-3-8B-Instruct (Q4_K_M)** or **Phi-3-Mini**. These are small, heavily quantized models that perform exceptionally well on reasoning tasks without crashing laptops.
    *   **Context Window Management (Summarization):** To prevent local LLMs from slowing down or crashing due to massive chat histories, the Orchestrator will maintain a sliding window. Recent messages (e.g., the last 5 turns) are passed directly. Older messages will be periodically summarized by the LLM and saved as a single "Summary Context" string in the database, ensuring the prompt size remains small and fast.
    *   *Visual Agent:* **LLaVA** (small parameter variant) or **Moondream2** (extremely lightweight 1.8B vision-language model).
    *   *Embedding Model (for RAG):* **all-MiniLM-L6-v2** (very fast on CPUs).

---

## 3. Storage & Database Architecture
To adhere to the "zero complex setup" requirement for laptops (no Docker needed for databases):

### 3.1. Relational Database (Normal DB)
*   **Technology:** **SQLite** (`sqlite3`)
*   **Implementation:** A single `workbench.db` file stored locally in the backend directory.
*   **Purpose:** 
    *   Storing chat history and sessions.
    *   Managing user states and Deep Research checkpoints.
    *   Tracking which documents have been ingested.

### 3.2. Vector Database (RAG)
*   **Technology:** **ChromaDB**
*   **Implementation:** Runs in-memory or persisted to a local `.chroma/` directory on the hard drive via the Python library.
*   **Purpose:** Storing document chunks and their vector embeddings.
*   **Search Strategy:** Hybrid Search. We will use BM25 (keyword search) alongside Vector semantic search to guarantee we don't miss exact industrial part numbers (e.g., "Valve V-405").

### 3.3. Self-Improvement Rules Store
*   **Technology:** **Markdown File (`rules.md`)**
*   **Implementation:** A structured text file located in the backend directory. 
*   **Format:**
    ```markdown
    ## RAG Agent Rules
    - Always prioritize the latest approved SOP for procedure-related questions.
    
    ## Visual Agent Rules
    - Never make safety-critical conclusions about structural integrity from images alone.
    ```
*   **Workflow:** The frontend Admin Portal edits this text file. Before an agent generates a response, it reads the relevant section of `rules.md` and appends it to its system prompt.

### 3.4. Physical File Storage
*   **Location:** `backend/data/uploads/`
*   **Purpose:** While ChromaDB stores the mathematical vector embeddings of the text, the actual raw `.pdf`, `.csv`, and image files uploaded by users/admins must be securely saved to the local file system. This allows the Next.js frontend to provide a direct download link to the original document if an engineer needs to read it.

---

## 4. Agent Implementations & Contracts

### 4.1. Orchestrator Agent
*   **Role:** The router. It receives the user's chat input and decides whether to respond directly, or route to a specialized agent (RAG, Data, Visual).
*   **Implementation:** Uses a zero-shot classification prompt to return a structured JSON decision.

### 4.2. RAG Agent
*   **Workflow:** 
    1. Receives query. 
    2. Queries ChromaDB (Hybrid Search). 
    3. Retrieves top-k chunks. 
    4. Passes context + query to Ollama.
    5. Returns grounded answer with exact citations mapped to the chunk metadata.

### 4.3. Data Analysis Agent
*   **Role:** Generates and executes Python code to analyze CSV/Excel files.Create bar-graphs , pie-charts and more.
*   **Implementation (No Sandbox):** To keep the laptop setup simple, the backend will use native Python `exec()` to run pandas scripts. 
*   *Security Note:* This is acceptable because it is an entirely internal, on-premise tool used by trusted employees.

### 4.4. Deep Research Agent (Synchronous)
*   **Role:** Handles complex, multi-step investigations.
*   **Implementation:** Powered by a directed graph (LangGraph).
*   **State Machine:**
    1. User clicks `[🔬 Deep Research]`.
    2. Agent analyzes goal -> Calls RAG agent.
    3. Streams findings to frontend UI.
    4. Analyzes findings -> Decides it needs clarification -> Pauses execution and asks user.
    5. User replies -> Agent resumes graph execution.
    6. Agent calls Data Analysis Agent -> Synthesizes final report.
    *Crucially, this happens synchronously in the active UI session.*

### 4.5. Visual Agent
*   **Role:** Handles visual information (equipment photos, diagrams, scanned docs).
*   **Implementation:** Connects to a local multimodal model (e.g., LLaVA) via Ollama. It receives the image and returns structured findings detailing what is visible, inferred, and what cannot be determined.
*   **Safety Constraints:** explicitly constrained to avoid making unsupported safety-critical conclusions (e.g., structural integrity).

### 4.6. Report Generation Agent
*   **Role:** Converts findings from other agents (RAG, Data, Visual, Deep Research) into structured, professional reports.
*   **Implementation:** Receives structured JSON findings and synthesizes them into a markdown/HTML report with Title, Executive Summary, Problem, Findings, Evidence, Analysis, Conclusion, Recommendations, and Sources. It clearly distinguishes between confirmed info, analysis, and recommendations.

---

## 5. Main Chat Interface
A dedicated route in the Next.js frontend (`/chat`).
*   **Session Management:** Sidebar UI to create a "New Chat" (generating a fresh `session_id`) or view past historical chats stored in SQLite.
*   **Deep Research Toggle:** A physical UI switch allowing the user to explicitly trigger the Deep Research state machine instead of a standard one-shot RAG answer.
*   **Traceability Log & Streaming Protocol:** A real-time visual streaming component that shows the user exactly which agents are being routed to. The frontend consumes this data using **Server-Sent Events (SSE)** via FastAPI's `StreamingResponse`, eliminating perceived latency.
*   **Multimodal File Uploads:** The chat input box supports `multipart/form-data` drag-and-drop file uploads (e.g., images of broken equipment or CSVs). The Next.js frontend sends the physical files to the backend for secure temporary storage before passing them to the Visual or Data agents.

---

## 6. Admin Dashboard
A dedicated route in the Next.js frontend (`/admin`). Protected by a hardcoded `.env` password (Basic Auth) to prevent unauthorized access by non-managers.
*   **Document Ingestion:** UI to upload PDFs. The backend parses them (PyPDF2), chunks them (LangChain RecursiveCharacterTextSplitter), embeds them, and saves to ChromaDB.
*   **Document Management:** UI to list all actively ingested PDFs and a "Delete" function. Deleting a document securely purges its specific vector embeddings from ChromaDB so the AI "forgets" the outdated SOP.
*   **Rules Management:** A simple text editor UI to read, update, and temporarily toggle (on/off) rules in the `rules.md` file.

---

## 7. Folder Structure
```text
workbench/
├── frontend/                  # Next.js UI
│   ├── components/            # UI components (chat, research toggle)
│   ├── app/                   # Pages and routes
│   └── lib/                   # API clients
├── backend/
│   ├── api/                   # FastAPI endpoints (chat, rules, upload, report)
│   ├── agents/
│   │   ├── orchestrator/
│   │   ├── visual_agent/
│   │   ├── rag_agent/
│   │   ├── data_agent/
│   │   ├── report_agent/
│   │   └── deep_research/
│   ├── services/              # External interfaces (Ollama, ChromaDB)
│   ├── models/                # DB Models & Pydantic schemas
│   ├── schemas/               # API Request/Response schemas
│   ├── rules/                 # Rules extraction logic & rules.md
│   ├── knowledge_base/        # RAG document ingestion pipelines
│   ├── storage/               # SQLite DB connections and File handling
│   └── utils/                 # Helpers
└── data/                      # Local storage for uploaded files and ChromaDB index
```

---

## 8. Development Phasing
*   **Phase 1: Foundation:** Setup FastAPI, SQLite, Next.js. Create the `rules.md` file. 
*   **Phase 2: RAG & Ingestion:** Integrate ChromaDB, build the Admin upload portal, and implement the RAG agent.
*   **Phase 3: Tools & Execution:** Build the Data Analysis code executor and connect the Visual Agent to LLaVA via Ollama.
*   **Phase 4: Deep Research:** Implement the LangGraph state machine for the looping research mode.
