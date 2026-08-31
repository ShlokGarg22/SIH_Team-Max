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
# Specific Agent Payloads
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

# -----------------------------------------------------------------------------
# Rules & Self-Improvement Schemas
# -----------------------------------------------------------------------------

class RuleSchema(BaseModel):
    id: str = Field(..., description="Unique rule identifier (e.g. rule_vis_001)")
    agent: str = Field(..., description="Target agent: visual, report, rag, data, global")
    category: str = Field(default="operational_guardrail", description="Rule category: safety, source_priority, procedural_guardrail, formatting, calculation")
    rule: str = Field(..., description="The actual constraint or instructional rule text")
    status: str = Field(default="approved", description="Status: approved, pending, disabled")
    priority: str = Field(default="high", description="Priority: high, medium, low")
    created_at: Optional[str] = Field(None, description="ISO timestamp of creation")

class FeedbackExtractionRequest(BaseModel):
    user_feedback: str = Field(..., description="User correction or thumbs-down feedback comment")
    agent_name: Optional[str] = Field(default="global", description="Agent that produced the output being corrected")
    context: Optional[str] = Field(None, description="The original agent query and response being corrected")
    auto_approve: bool = Field(default=False, description="If True, marks the extracted rule as approved immediately")

class FeedbackExtractionResponse(BaseModel):
    extracted_rule: RuleSchema
    extraction_reasoning: str
    auto_saved: bool = False
    message: str

# -----------------------------------------------------------------------------
# Visual Agent Schemas
# -----------------------------------------------------------------------------

class VisualRequestPayload(BaseModel):
    prompt: str = Field(..., description="User question or inspection instruction for the image")
    image_paths: Optional[List[str]] = Field(default_factory=list, description="File paths to images on disk")
    image_base64: Optional[str] = Field(None, description="Base64-encoded image string")
    model: Optional[str] = Field(None, description="Optional vision model override (e.g., llava, moondream)")

class VisualAnalysisResult(BaseModel):
    direct_observations: List[str] = Field(default_factory=list, description="What is clearly and directly visible in the image")
    inferred_observations: List[str] = Field(default_factory=list, description="Logical inferences based on visible indicators")
    undetermined_factors: List[str] = Field(default_factory=list, description="Factors that cannot be confirmed from the image alone")
    equipment_type: Optional[str] = Field(None, description="Identified equipment or component type")
    safety_advisory: Optional[str] = Field(
        default="Notice: Visual analysis provides observation assistance only and cannot certify structural integrity or operational safety.",
        description="Mandatory industrial safety disclaimer"
    )

# -----------------------------------------------------------------------------
# Report Agent Schemas
# -----------------------------------------------------------------------------

class ReportRequestPayload(BaseModel):
    title: str = Field(..., description="Title of the incident or diagnostic report")
    equipment_id: Optional[str] = Field(None, description="Equipment tag or identifier (e.g. Pump P-101)")
    plant_area: Optional[str] = Field(None, description="Plant unit or facility area (e.g. FCCU Unit 3)")
    severity: str = Field(default="MEDIUM", description="Incident severity: CRITICAL, HIGH, MEDIUM, LOW, INFO")
    report_type: str = Field(default="incident_investigation", description="Type: incident_investigation, equipment_health_check, diagnostic_report, sop_compliance")
    agent_responses: Optional[List[AgentResponse]] = Field(default_factory=list, description="Structured responses from Visual, RAG, and Data agents")
    raw_findings: Optional[List[str]] = Field(default_factory=list, description="Direct text findings to include in synthesis")
    evidence: Optional[List[Evidence]] = Field(default_factory=list, description="Explicit source evidence citations")
    additional_context: Optional[str] = Field(None, description="Extra background notes or operator comments")
    model: Optional[str] = Field(None, description="Optional text reasoning model override (e.g. llama3, phi3)")

class ReportResult(BaseModel):
    report_id: str = Field(..., description="Unique generated report ID")
    title: str
    equipment_id: Optional[str] = None
    plant_area: Optional[str] = None
    severity: str
    report_type: str
    markdown_content: str = Field(..., description="Full formatted ISO-compliant Markdown report")
    executive_summary: str = Field(..., description="Brief executive summary")
    root_cause_analysis: List[str] = Field(default_factory=list, description="5-Whys or key causal chain factors")
    recommendations: List[str] = Field(default_factory=list, description="Actionable recommendations")
    sources: List[Evidence] = Field(default_factory=list, description="Consolidated source evidence list")
    generated_by: str = "report_agent"
    status: str = "completed"
