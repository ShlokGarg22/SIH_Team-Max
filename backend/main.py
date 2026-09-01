import sys
import os

# Ensure both backend directory and parent root are in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(backend_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    from fastapi import FastAPI  # type: ignore
    from fastapi.middleware.cors import CORSMiddleware  # type: ignore
except ImportError:
    pass

try:
    from backend.api.routers.visual import router as visual_router
    from backend.api.routers.report import router as report_router
    from backend.api.routers.rules import router as rules_router
    from backend.api.routers.rag import router as rag_router
    from backend.api.agent import router as agent_router
    from backend.storage.db import init_db
except ImportError:
    from api.routers.visual import router as visual_router  # type: ignore
    from api.routers.report import router as report_router  # type: ignore
    from api.routers.rules import router as rules_router  # type: ignore
    from api.routers.rag import router as rag_router  # type: ignore
    from api.agent import router as agent_router  # type: ignore
    from storage.db import init_db  # type: ignore


# Initialize database schema on backend startup
init_db()

app = FastAPI(
    title="Sovereign On-Premise Agentic AI Workbench API",
    version="0.1.0",
    description="Backend API for local agent routing, multimodal inspection, report synthesis, rules governance, data analysis, and RAG knowledge retrieval."
)

# Allow CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Agent and Governance Routers
app.include_router(agent_router)
app.include_router(visual_router)
app.include_router(report_router)
app.include_router(rules_router)
app.include_router(rag_router)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "Sovereign AI Workbench Backend",
        "active_modules": ["visual_agent", "report_agent", "rules_engine", "data_agent", "rag_agent", "orchestrator"]
    }


