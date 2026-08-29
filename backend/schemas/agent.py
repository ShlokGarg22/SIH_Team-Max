from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

# -----------------------------------------------------------------------------
# Base Communication Contracts
# -----------------------------------------------------------------------------

class AgentRequest(BaseModel):
    task_id: str
    session_id: str
    agent_target: str
    payload: Dict[str, Any]
    applied_rules: Optional[List[Dict[str, str]]] = Field(default_factory=list)

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

# -----------------------------------------------------------------------------
# Specific Agent Payloads (Examples)
# -----------------------------------------------------------------------------

class RAGRequestPayload(BaseModel):
    query: str
    context_files: Optional[List[str]] = Field(default_factory=list)
    hybrid_search: bool = True

class DeepResearchAction(BaseModel):
    action: str = Field(..., description="ASK_USER, CALL_AGENT, ANALYZE, CONTINUE, FINALIZE")
    reason: str
    agent_target: Optional[str] = None
    task_description: Optional[str] = None
    question_for_user: Optional[str] = None

class RuleSchema(BaseModel):
    id: str
    agent: str
    category: str
    rule: str
    status: str = "approved"
    priority: str = "high"
