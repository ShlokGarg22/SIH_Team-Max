# Sovereign On-Premise Agentic AI Workbench — Master Project Context & Specification
**Target Industry:** Confidential Heavy Industrial Operations (e.g., Mangalore Refinery and Petrochemicals Limited - MRPL)  
**Hackathon Target:** Smart India Hackathon (SIH)  
**Primary Deployment Constraint:** 100% On-Premise, Air-Gapped, Zero External LLM APIs, Runs on Standard Laptops (CPU / Entry GPU Fallback)

---

## 1. Executive Summary & Vision
The **Sovereign On-Premise Agentic AI Workbench** is an enterprise-grade multi-agent AI system designed for confidential, safety-critical industrial operations. Unlike basic consumer chatbots or simple wrapper tools, this workbench is an end-to-end operational platform where specialized agents autonomously collaborate to:
1. Retrieve internal organizational knowledge from SOPs, technical manuals, and equipment specs (**RAG Agent**).
2. Inspect physical equipment photographs, P&ID diagrams, and gauge dials locally (**Visual Agent**).
3. Safely calculate telemetry statistics, detect data anomalies, and render plots from CSV/Excel sheets locally (**Data Analysis Agent**).
4. Synthesize multi-agent outputs into ISO-compliant diagnostic reports (**Report Generation Agent**).
5. Conduct autonomous, multi-step investigations with mid-loop human clarification (**Deep Research Agent**).
6. Dynamically learn from user corrections without expensive model fine-tuning (**Shared Self-Improvement Rules Engine**).

---

## 2. Core Architectural Principles & Hard Constraints

### A. Zero External API Dependency (Strict Air-Gap)
* **No OpenAI, Anthropic, or Cloud LLM APIs.** All inference runs locally via **Ollama** (`llama.cpp` backend).
* **Rationale:** Industrial plants cannot leak proprietary schematics, SOPs, chemical formulations, or incident logs outside the internal corporate firewall.

### B. Hardware Pragmatism & CPU Optimization
* **Hardware Target:** Standard-issue engineer laptops (8GB–16GB RAM, standard CPUs, entry-level GPUs or Apple Silicon).
* **Models Selected:**
  * **Text Reasoning & Orchestration:** `Llama-3-8B-Instruct (Q4_K_M)` or `Phi-3-Mini (3.8B)`.
  * **Multimodal Vision:** `LLaVA-v1.6-7B` or `Moondream2 (1.8B)` / `Llama-3.2-Vision-11B`.
  * **Embedding Model for RAG:** `all-MiniLM-L6-v2` (fast, low memory footprint on CPU).
* **Context Window Management:** Sliding window for recent 5 chat turns + periodic automated LLM context summarization stored in SQLite to prevent CPU RAM overflow.

### C. Zero Complex Infrastructure Setup
* No mandatory Docker requirement for running databases.
* **Relational DB:** SQLite (`workbench.db`) via SQLAlchemy.
* **Vector DB:** ChromaDB (persisted locally to `.chroma/` directory).
* **Code Execution:** Native Python execution for data analysis (trusted internal environment).
* **Rules Base:** Markdown file (`rules.md`) + structured Pydantic parser.

---

## 3. System Architecture & Tech Stack

```
                                  +-------------------------------------------------------+
                                  |                    FRONTEND (UI)                      |
                                  |     Next.js 15 (App Router) + TypeScript + Tailwind   |
                                  |   - /chat (Main Workbench, Streaming SSE, Deep Toggle)|
                                  |   - /admin (Doc Ingestion, Rules Manager, Logs)       |
                                  +---------------------------+---------------------------+
                                                              | HTTP / SSE
                                                              v
+-------------------------------------------------------------------------------------------------------------------------+
|                                                  BACKEND (FastAPI)                                                      |
|                                                                                                                         |
|  +-------------------------------------------------------------------------------------------------------------------+  |
|  |                                                 ORCHESTRATOR AGENT                                                |  |
|  |                              (Zero-Shot Intent Classifier -> Dynamic Agent Router)                                |  |
|  +-----------------------+-----------------------+-----------------------+--------------------+----------------------+  |
|                          |                       |                       |                    |                         |
|                          v                       v                       v                    v                         |
|                 +-----------------+     +-----------------+     +-----------------+  +-----------------+                |
|                 |   VISUAL AGENT  |     |    RAG AGENT    |     |   DATA AGENT    |  |  REPORT AGENT   |                |
|                 | (LLaVA/Moondream|     |  (ChromaDB +    |     | (Pandas + Local |  | (ISO Synthesizer|                |
|                 |  Categorization)|     |  Hybrid Search) |     |  Python Exec)   |  |  Markdown/HTML) |                |
|                 +--------+--------+     +--------+--------+     +--------+--------+  +--------+--------+                |
|                          |                       |                       |                    |                         |
|                          +-----------------------+-----------------------+--------------------+                         |
|                                                  |                                                                      |
|                                                  v                                                                      |
|                                     +---------------------------+                                                       |
|                                     |    DEEP RESEARCH AGENT    |                                                       |
|                                     | (LangGraph State Machine, |                                                       |
|                                     |  Persistent Looping Loop) |                                                       |
|                                     +---------------------------+                                                       |
|                                                                                                                         |
|  +-------------------------------------------------------------------------------------------------------------------+  |
|  |                                        SHARED RULES & GOVERNANCE ENGINE                                           |  |
|  |                   (Rules Injection into Prompts + Feedback Extraction + Admin Approval Flow)                     |  |
|  +-------------------------------------------------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------------------------------------------------+
                                                              |
                                                              v
                                  +-------------------------------------------------------+
                                  |               LOCAL STORAGE & INFERENCE               |
                                  | - Ollama (Llama-3, LLaVA, Phi-3)                      |
                                  | - SQLite (workbench.db - Sessions, Messages, States)  |
                                  | - ChromaDB (.chroma/ - Vectors & Metadata)            |
                                  | - File System (backend/data/uploads/ - Raw PDFs/JPGs) |
                                  | - rules.md (Human-Readable Dynamic Rule Store)        |
                                  +-------------------------------------------------------+
```

### Complete Technology Stack Matrix
| Layer | Technology | Purpose & Rationale |
| :--- | :--- | :--- |
| **Frontend UI** | Next.js 15, React 19, TypeScript, TailwindCSS, Lucide Icons | Responsive chat workbench, deep research progress tracker, document uploaders. |
| **API Layer** | FastAPI, Uvicorn, Pydantic v2, Python-Multipart | Asynchronous high-performance REST & SSE endpoints. |
| **Orchestration** | LangGraph, LangChain 0.2 | Stateful multi-step agent loops, research state checkpoints. |
| **Local LLM Server** | Ollama (`http://localhost:11434`) | Open-weight GGUF model execution with CPU thread optimization. |
| **Vector DB** | ChromaDB (`chromadb==0.5.0`) | Local embedded vector store with persistence and metadata filtering. |
| **Relational DB** | SQLite3 + SQLAlchemy 2.0 | Session history, research checkpoints, uploaded document metadata. |
| **Document Ingestion** | PyPDF2, LangChain RecursiveCharacterTextSplitter | Extracting, chunking, and embedding PDF SOPs and technical manuals. |
| **Data Engine** | Pandas, Matplotlib / Seaborn | CSV/Excel data manipulation, statistical profiling, and anomaly plots. |
| **Multimodal Vision** | LLaVA-1.6 / Moondream2 / Llama-3.2-Vision | Air-gapped local visual inspection and diagram parsing. |

---

## 4. Complete Agent Specifications

### 1. Orchestrator Agent
* **Folder:** `backend/agents/orchestrator/`
* **Role:** The primary entry point for chat interactions. Analyzes incoming queries and routes them to specialized agents.
* **Routing Logic:** Zero-shot JSON classification prompt:
  * Image provided / visual query $\rightarrow$ **Visual Agent**
  * Internal documentation / SOP query $\rightarrow$ **RAG Agent**
  * CSV / Excel / numerical tabular data $\rightarrow$ **Data Analysis Agent**
  * Report compilation request $\rightarrow$ **Report Agent**
  * Multi-step complex query with toggle $\rightarrow$ **Deep Research Agent**
* **Safety Rule:** Never activates Deep Research automatically; Deep Research requires explicit user toggle.

---

### 2. Visual Agent
* **Folder:** `backend/agents/visual_agent/`
* **Role:** The "Eyes" of the system. Analyzes photographs of physical equipment, rust, cracks, valve levers, gauge dials, and P&ID diagrams.
* **Multimodal Engine:** Connects to local Ollama vision endpoint via `backend/services/ollama_service.py`.
* **3-Tier Categorization Contract:**
  1. `direct_observations`: Concrete, undeniable physical facts visible in the image (e.g. rust color, missing bolt, pressure gauge value at 1.5 bar).
  2. `inferred_observations`: Deductions or hypotheses based on visible indicators (e.g. possible past fluid leak from discoloration).
  3. `undetermined_factors`: Factors that CANNOT be determined visually (e.g. internal impeller wear, seal integrity, metallurgy).
* **Safety Constraint:** Explicitly forbidden from issuing safety-critical structural integrity certifications from photos alone.
* **Mandatory Advisory:** *"Notice: Visual analysis provides observation assistance only and cannot certify structural integrity or operational safety."*

---

### 3. RAG Agent (Retrieval-Augmented Generation) with Citations
* **Folder:** `backend/agents/rag_agent/`
* **Role:** Answers technical and procedural questions using internal plant documents (SOPs, OEM manuals, maintenance history).
* **Pipeline:**
  1. User Query $\rightarrow$ Query decomposition.
  2. **Hybrid Search:** Combines BM25 (exact keyword match for part numbers like "Valve V-405", "Pump P-101") + Dense Vector Semantic Search in ChromaDB.
  3. Context Assembly with exact page & chunk metadata.
  4. Grounded answer generation using `Llama-3-8B-Instruct`.
* **Zero Hallucination Rule:** If sufficient context is not found, the agent must explicitly reply: *"Insufficient information found in the available knowledge base."* Every substantive claim must cite `[Document Name, Page X, Chunk Y]`.

---

### 4. Data Analysis Agent
* **Folder:** `backend/agents/data_agent/`
* **Role:** Analyzes structured CSV, Excel, and tabular telemetry data.
* **Capabilities:**
  1. Inspects schemas, columns, null counts, and data distributions.
  2. Generates and executes Python/Pandas code locally.
  3. Computes statistical anomalies, failure rate correlations, and KPI summaries.
  4. Generates visual charts (bar, line, scatter) saved locally and returned as metadata.
* **Sandboxing Decision:** Native Python `exec()` inside an internal controlled environment (no Docker required for prototype).

---

### 5. Report Generation Agent
* **Folder:** `backend/agents/report_agent/`
* **Role:** Synthesizes raw JSON findings from RAG, Visual, Data, and Deep Research agents into structured, executive-ready, ISO-style industrial inspection reports.
* **Standard Report Sections:**
  * **Header:** Incident ID, Equipment Tag, Facility Area, Timestamp, Severity (High/Medium/Low).
  * **1. Executive Summary:** Non-technical briefing for superintendents.
  * **2. Problem Statement & Scope:** Incident triggers or inquiry goals.
  * **3. Confirmed Findings & Evidence:** Visual direct observations, sensor metrics, and SOP citations.
  * **4. Root Cause Analysis (5-Whys / Ishikawa):** Deductive analysis clearly separating confirmed facts from hypotheses.
  * **5. Actionable Recommendations:** Immediate corrective steps, preventive maintenance schedule, safety precautions.
  * **6. Traceability Appendix:** All cited source files, chunk IDs, and confidence scores.

---

### 6. Deep Research Agent (Synchronous LangGraph Loop)
* **Folder:** `backend/agents/deep_research/`
* **Role:** Autonomous, multi-step investigation engine designed for complex failure investigations (e.g. *"Investigate why Boiler B-202 tripped during high throughput"*).
* **Key Innovations:**
  1. **Persistent State Machine:** Maintains `ResearchState` (`research_id`, `goal`, `known_info`, `missing_info`, `questions_asked`, `findings`, `evidence`, `status`).
  2. **Mid-Loop Clarification:** Can pause the loop to ask the user a clarifying question (e.g. *"I found two failure incidents in March and August. Which should I focus on?"*), wait for input, and resume without losing context.
  3. **Multi-Agent Orchestration:** Autonomously calls RAG, Data, and Visual agents within its research loop.
* **Execution Actions:** `ASK_USER`, `CALL_AGENT`, `ANALYZE_FINDINGS`, `CONTINUE_RESEARCH`, `FINALIZE`.
* **Session Scope:** Operates synchronously within the active UI session.

---

### 7. Shared Rules Engine & Self-Improvement System
* **Folder:** `backend/rules/`
* **Role:** Enables continuous organizational learning without LLM fine-tuning.
* **Workflow:**
  1. **User Feedback:** Plant engineer gives a Thumbs Down or types a correction (e.g. *"For steam turbines, always follow the 2024 revised SOP"*).
  2. **Rule Extraction:** Local LLM parses the feedback into a structured `RuleSchema` (`id`, `agent`, `category`, `rule`, `priority`, `status`).
  3. **Storage & Moderation:** Rule is saved into `rules.md` (and SQLite for auditing) as "pending" or "approved".
  4. **Dynamic Prompt Injection:** Before *any* agent executes, `RulesEngine.get_rules_for_agent(agent_name)` fetches relevant rules (agent-specific + global) and appends them to the system prompt.

---

## 5. Universal Data Contracts & Communication Schemas

All agents communicate via standardized Pydantic schemas defined in `backend/schemas/agent.py`.

### A. Universal Agent Response Contract
```python
class Evidence(BaseModel):
    source: str
    page: Optional[int] = None
    chunk: Optional[str] = None
    confidence: Optional[float] = None

class AgentResponse(BaseModel):
    task_id: str
    agent_name: str
    status: str = Field(..., description="completed, failed, or requires_user_input")
    findings: List[str] = Field(default_factory=list)
    evidence: List[Evidence] = Field(default_factory=list)
    confidence: float = 1.0
    errors: List[str] = Field(default_factory=list)
```

### B. Visual Agent Contract
```python
class VisualRequestPayload(BaseModel):
    prompt: str
    image_paths: Optional[List[str]] = Field(default_factory=list)
    image_base64: Optional[str] = None
    model: Optional[str] = None

class VisualAnalysisResult(BaseModel):
    direct_observations: List[str]
    inferred_observations: List[str]
    undetermined_factors: List[str]
    equipment_type: Optional[str] = None
    safety_advisory: Optional[str]
```

### C. Deep Research State Contract
```python
class DeepResearchAction(BaseModel):
    action: str = Field(..., description="ASK_USER, CALL_AGENT, ANALYZE, CONTINUE, FINALIZE")
    reason: str
    agent_target: Optional[str] = None
    task_description: Optional[str] = None
    question_for_user: Optional[str] = None
```

### D. Rules Schema
```python
class RuleSchema(BaseModel):
    id: str
    agent: str
    category: str
    rule: str
    status: str = "approved"
    priority: str = "high"
```

---

## 6. Database Models (SQLite / SQLAlchemy)

Defined in `backend/models/database.py`:
* **`User`**: `id`, `username`, `role` (`user` / `admin`).
* **`Session`**: `id` (UUID), `user_id`, `session_type` (`normal` / `deep_research`), `status`, `created_at`.
* **`Message`**: `id`, `session_id`, `sender` (`user`, `orchestrator`, `rag_agent`, etc.), `content`, `metadata_json` (citations, charts), `created_at`.
* **`Document`**: `id`, `filename`, `file_path`, `status` (`pending`, `indexed`, `failed`), `uploaded_at`.
* **`ResearchState`**: `id`, `session_id`, `state_data` (JSON dict), `last_updated`.

---

## 7. SIH Novelty & Pitch Highlights

1. **Air-Gapped Sovereign AI:** Complete enterprise intelligence on confidential data without cloud exposure.
2. **CPU Optimization:** Runs on everyday enterprise laptops using quantized Llama-3 and Moondream/LLaVA.
3. **Mid-Loop Clarification Deep Research:** Unlike one-shot bots, it pauses mid-investigation to ask questions and resumes statefully.
4. **Self-Improvement Without Retraining:** Immediate behavior correction via dynamic Rules Engine.
5. **Explainable AI Traceability Log:** Visual thought process breakdown streamed via SSE in real time.
6. **Future Pitches:** Autonomous IoT alert triggers, multilingual Indic support for floor workers, and automated SAP/ERP procurement integration.

---

## 8. Current Implementation Status & File Map

### Repository Structure
```text
SIH_Team-Max/
├── AGENTS.md                  # Project rules & constraints
├── ARCHITECTURE_DESIGN.md     # Core system design document
├── NOVELTY.md                 # Hackathon novelty & pitch deck points
├── PROMPT.md                  # Master prompt & functional specifications
├── README.md                  # Quickstart documentation
├── backend/
│   ├── requirements.txt       # Python dependencies
│   ├── models/
│   │   └── database.py        # SQLAlchemy SQLite models
│   ├── schemas/
│   │   └── agent.py           # Pydantic schemas (AgentResponse, Evidence, etc.)
│   ├── services/
│   │   └── ollama_service.py  # Local Ollama client (Vision & Text inference)
│   ├── rules/
│   │   ├── engine.py          # RulesEngine parser & prompt injector
│   │   └── rules.md           # Persistent human-readable rules store
│   ├── agents/
│   │   ├── visual_agent/
│   │   │   └── visual_agent.py# Visual inspection engine + CLI runner
│   │   ├── report_agent/      # Report generation synthesizer (In Progress)
│   │   ├── rag_agent/         # ChromaDB RAG pipeline
│   │   ├── data_agent/        # Local Pandas data executor
│   │   ├── orchestrator/      # Router agent
│   │   └── deep_research/     # LangGraph looping research engine
│   ├── api/
│   │   └── routers/
│   │       └── visual.py      # FastAPI visual endpoints (/analyze, /health)
│   ├── tests/
│   │   └── test_visual_agent.py # Pytest suite (5/5 passing)
│   ├── knowledge_base/        # Ingestion scripts
│   └── storage/               # File upload managers
└── frontend/                  # Next.js 15 App Router interface
```

### Component Status Tracker
| Component | Status | Owner | Notes |
| :--- | :--- | :--- | :--- |
| **Visual Agent** | **Completed & Verified** | **You** | Fully operational with 3-tier categorization, rules injection, and 100% test coverage. |
| **Report Agent** | **Completed & Verified** | **You** | ISO 55001/OSHA synthesizer, 5-Whys root cause generator, dual-engine LLM + offline fallback. |
| **Rules Engine** | **Completed & Verified** | **You** | Structured CRUD, dynamic prompt injection, AI feedback extraction, admin router. |
| **Ollama Service** | **Completed & Verified** | **You** | Supports `generate_vision`, `generate_text`, base64 encoding, model discovery. |

| **RAG Agent** | Planned / Parallel | Teammate | ChromaDB hybrid search & document citation pipeline. |
| **Data Agent** | Planned / Parallel | Teammate | Local Pandas execution & chart generator. |
| **Orchestrator** | Planned / Parallel | Teammate | Intent classification & dynamic routing. |
| **Deep Research** | Planned / Parallel | Teammate | LangGraph state machine with mid-loop clarification. |
| **Frontend UI** | Scaffolded | Teammate | Next.js 15 chat UI, streaming SSE, admin portal. |
