import logging
from typing import List, Optional
try:
    from fastapi import APIRouter, HTTPException, Query, Body, Depends  # type: ignore
except ImportError:
    pass


from backend.schemas.agent import (
    RuleSchema,
    FeedbackExtractionRequest,
    FeedbackExtractionResponse,
)
from backend.rules.engine import RulesEngine
from backend.services.ollama_service import OllamaService

logger = logging.getLogger("RulesRouter")
router = APIRouter(prefix="/api/rules", tags=["Rules Engine"])


def get_rules_engine() -> RulesEngine:
    return RulesEngine(ollama_service=OllamaService())


@router.get("", response_model=List[RuleSchema])
async def list_rules(
    agent: Optional[str] = Query(None, description="Filter rules by agent (visual, report, rag, data, global)"),
    status: Optional[str] = Query(None, description="Filter by status (approved, pending, disabled)"),
    category: Optional[str] = Query(None, description="Filter by category (safety, source_priority, procedural_guardrail, formatting)"),
    engine: RulesEngine = Depends(get_rules_engine),
):
    """
    Lists all persistent organizational rules with optional filtering.
    """
    rules = engine.get_all_rules(agent=agent, status=status, category=category)
    return rules


@router.get("/{rule_id}", response_model=RuleSchema)
async def get_rule(
    rule_id: str,
    engine: RulesEngine = Depends(get_rules_engine),
):
    """
    Fetches a single rule by its unique ID.
    """
    rule = engine.get_rule_by_id(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rule with ID '{rule_id}' not found.")
    return rule


@router.post("", response_model=RuleSchema)
async def create_rule(
    payload: RuleSchema,
    engine: RulesEngine = Depends(get_rules_engine),
):
    """
    Creates a new rule and persists it into rules.md (Admin Portal).
    """
    try:
        new_rule = engine.add_rule(
            agent_name=payload.agent,
            rule=payload.rule,
            category=payload.category,
            priority=payload.priority,
            status=payload.status,
        )
        return new_rule
    except Exception as e:
        logger.error(f"Failed to create rule: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create rule: {str(e)}")


@router.put("/{rule_id}", response_model=RuleSchema)
async def update_rule(
    rule_id: str,
    payload: RuleSchema,
    engine: RulesEngine = Depends(get_rules_engine),
):
    """
    Updates an existing rule text, category, priority, or status in rules.md.
    """
    updated = engine.update_rule(
        rule_id=rule_id,
        rule=payload.rule,
        category=payload.category,
        priority=payload.priority,
        status=payload.status,
        agent=payload.agent,
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Rule with ID '{rule_id}' not found or update failed.")
    return updated


@router.patch("/{rule_id}/toggle", response_model=RuleSchema)
async def toggle_rule_status(
    rule_id: str,
    active: bool = Query(..., description="True to activate (approved), False to disable (disabled)"),
    engine: RulesEngine = Depends(get_rules_engine),
):
    """
    Toggles a rule between 'approved' and 'disabled'.
    """
    toggled = engine.toggle_rule(rule_id=rule_id, active=active)
    if not toggled:
        raise HTTPException(status_code=404, detail=f"Rule with ID '{rule_id}' not found.")
    return toggled


@router.delete("/{rule_id}")
async def delete_rule(
    rule_id: str,
    engine: RulesEngine = Depends(get_rules_engine),
):
    """
    Permanently deletes a rule from rules.md.
    """
    deleted = engine.delete_rule(rule_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Rule with ID '{rule_id}' not found.")
    return {"success": True, "message": f"Rule '{rule_id}' was successfully deleted."}


@router.post("/extract-from-feedback", response_model=FeedbackExtractionResponse)
async def extract_rule_from_user_feedback(
    payload: FeedbackExtractionRequest,
    engine: RulesEngine = Depends(get_rules_engine),
):
    """
    Ingests conversational user feedback / thumbs-down correction, extracts an actionable
    invariant rule via local LLM, and proposes it for the Rules Store.
    """
    try:
        extraction_res = engine.extract_rule_from_feedback(
            user_feedback=payload.user_feedback,
            agent_name=payload.agent_name or "global",
            context=payload.context,
            auto_save=True,
            auto_approve=payload.auto_approve,
        )
        return extraction_res
    except Exception as e:
        logger.error(f"Feedback rule extraction error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to extract rule: {str(e)}")
