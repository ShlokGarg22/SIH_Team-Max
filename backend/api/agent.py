from fastapi import APIRouter, HTTPException
from schemas.agent import AgentRequest, AgentResponse
from agents.orchestrator.router import Orchestrator

router = APIRouter(prefix="/api/agent", tags=["agent"])
orchestrator = Orchestrator()


@router.post("/run", response_model=AgentResponse)
def run_agent_task(request: AgentRequest) -> AgentResponse:
    """
    HTTP POST endpoint for executing agent requests.
    Receives an AgentRequest, passes it through the Orchestrator, and returns the AgentResponse.
    """
    try:
        response = orchestrator.route_request(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal agent execution error: {str(e)}")
