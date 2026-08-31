from schemas.agent import AgentRequest, AgentResponse
from agents.data_agent.agent import DataAnalysisAgent


class Orchestrator:
    """
    Central Orchestrator that receives AgentRequests from the API layer
    and routes them to the appropriate specialized agent (e.g., Data Analysis Agent).
    """

    def __init__(self):
        self.data_agent = DataAnalysisAgent()

    def route_request(self, request: AgentRequest) -> AgentResponse:
        """
        Routes an incoming AgentRequest to the designated target agent based on agent_target.

        Args:
            request (AgentRequest): Standardized agent request.

        Returns:
            AgentResponse: Standardized response returned from the specialized target agent.
        """
        target = (request.agent_target or "").lower()

        if target in ["data_agent", "data_analysis_agent", "data"]:
            return self.data_agent.process_request(request)

        return AgentResponse(
            task_id=request.task_id,
            agent_name="orchestrator",
            status="failed",
            findings=[],
            evidence=[],
            confidence=0.0,
            errors=[f"Agent target '{request.agent_target}' is not yet registered with the Orchestrator."]
        )
