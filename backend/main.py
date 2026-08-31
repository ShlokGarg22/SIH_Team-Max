from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.api.routers.visual import router as visual_router
    from backend.api.routers.report import router as report_router
    from backend.api.routers.rules import router as rules_router
    from backend.api.agent import router as agent_router
except ImportError:
    from api.routers.visual import router as visual_router
    from api.routers.report import router as report_router
    from api.routers.rules import router as rules_router
    from api.agent import router as agent_router

app = FastAPI(
    title="Sovereign On-Premise Agentic AI Workbench API",
    version="0.1.0",
    description="Backend API for local agent routing, multimodal inspection, report synthesis, rules governance, and data analysis."
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


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "Sovereign AI Workbench Backend",
        "active_modules": ["visual_agent", "report_agent", "rules_engine", "data_agent", "orchestrator"]
    }

