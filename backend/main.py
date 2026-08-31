from fastapi import FastAPI
from api.agent import router as agent_router

app = FastAPI(
    title="Sovereign On-Premise Agentic AI Workbench API",
    version="0.1.0",
    description="Backend API for local agent routing, execution, and data analysis."
)

app.include_router(agent_router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Sovereign AI Workbench Backend"}
