try:
    from backend.schemas.agent import AgentRequest, AgentResponse
    from backend.agents.data_agent.agent import DataAnalysisAgent
    from backend.agents.rag_agent.rag_agent import RAGAgent
    from backend.agents.visual_agent.visual_agent import VisualAgent
    from backend.agents.report_agent.report_agent import ReportAgent
except ImportError:
    from schemas.agent import AgentRequest, AgentResponse
    from agents.data_agent.agent import DataAnalysisAgent
    from agents.rag_agent.rag_agent import RAGAgent
    from agents.visual_agent.visual_agent import VisualAgent
    from agents.report_agent.report_agent import ReportAgent


class Orchestrator:
    """
    Central Orchestrator that receives AgentRequests from the API layer
    and routes them to the appropriate specialized agent (RAG, Visual, Data, Report).
    """

    def __init__(self):
        self.data_agent = DataAnalysisAgent()
        self.rag_agent = RAGAgent()
        self.visual_agent = VisualAgent()
        self.report_agent = ReportAgent()

    def route_request(self, request: AgentRequest) -> AgentResponse:
        """
        Routes an incoming AgentRequest to the designated target agent based on agent_target.

        Args:
            request (AgentRequest): Standardized agent request.

        Returns:
            AgentResponse: Standardized response returned from the specialized target agent.
        """
        target = (request.agent_target or "").lower().strip()

        if target in ["data_agent", "data_analysis_agent", "data"]:
            return self.data_agent.process_request(request)

        if target in ["rag_agent", "rag", "rag_with_citations", "librarian"]:
            return self.rag_agent.process_request(request)

        if target in ["visual_agent", "visual", "vision", "image"]:
            prompt = request.payload.get("prompt") or request.payload.get("query") or ""
            return self.visual_agent.analyze(
                prompt=prompt,
                task_id=request.task_id,
                image_paths=request.payload.get("image_paths"),
                image_base64=request.payload.get("image_base64"),
                model=request.payload.get("model"),
            )

        if target in ["report_agent", "report", "report_generation"]:
            try:
                from backend.schemas.agent import ReportRequestPayload
            except ImportError:
                from schemas.agent import ReportRequestPayload
            payload_dict = request.payload or {}
            payload_obj = ReportRequestPayload(**payload_dict) if not isinstance(payload_dict, ReportRequestPayload) else payload_dict
            report_result = self.report_agent.generate_report(payload=payload_obj)
            return AgentResponse(
                task_id=request.task_id,
                agent_name="report_agent",
                status=report_result.status or "completed",
                findings=[report_result.markdown_content],
                evidence=report_result.sources,
                confidence=1.0,
                errors=[]
            )


        return AgentResponse(
            task_id=request.task_id,
            agent_name="orchestrator",
            status="failed",
            findings=[],
            evidence=[],
            confidence=0.0,
            errors=[f"Agent target '{request.agent_target}' is not yet registered with the Orchestrator."]
        )

