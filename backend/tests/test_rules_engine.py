import os
import json
import pytest
from unittest.mock import MagicMock

from backend.rules.engine import RulesEngine
from backend.services.ollama_service import OllamaService
from backend.schemas.agent import RuleSchema, FeedbackExtractionResponse


@pytest.fixture
def temp_rules_file(tmp_path):
    """Creates an isolated temporary rules.md file for testing mutations."""
    file_path = tmp_path / "test_rules.md"
    initial_content = (
        "## Global Rules\n"
        "- [id: rule_glob_001 | category: safety | priority: high | status: approved] Do not make unsupported claims.\n"
        "- [id: rule_glob_002 | category: security | priority: high | status: disabled] Disabled global test rule.\n\n"
        "## Visual Agent Rules\n"
        "- [id: rule_vis_001 | category: safety | priority: high | status: approved] Never make safety-critical structural integrity guarantees from images alone.\n"
        "- [id: rule_vis_002 | category: procedural_guardrail | priority: medium | status: approved] Always classify findings into 3 categories.\n"
    )
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(initial_content)
    return str(file_path)


def test_parse_and_load_all_rules(temp_rules_file):
    """Verify structured parsing and filtering from rules.md."""
    engine = RulesEngine(filepath=temp_rules_file)
    all_rules = engine.get_all_rules()

    assert len(all_rules) == 4
    
    # Filter by agent
    visual_rules = engine.get_all_rules(agent="visual")
    assert len(visual_rules) == 2
    assert visual_rules[0].id == "rule_vis_001"

    # Filter by status
    approved_rules = engine.get_all_rules(status="approved")
    assert len(approved_rules) == 3
    disabled_rules = engine.get_all_rules(status="disabled")
    assert len(disabled_rules) == 1
    assert disabled_rules[0].id == "rule_glob_002"


def test_dynamic_prompt_injection(temp_rules_file):
    """Verify that disabled rules are omitted and clean text is generated for prompts."""
    engine = RulesEngine(filepath=temp_rules_file)
    injected_str = engine.get_rules_for_agent("Visual Agent", include_global=True)

    assert "Do not make unsupported claims." in injected_str
    assert "Never make safety-critical structural integrity guarantees" in injected_str
    assert "Disabled global test rule" not in injected_str  # Excluded because disabled
    assert "[id:" not in injected_str  # Clean text without raw tags


def test_add_and_persist_new_rule(temp_rules_file):
    """Verify rule creation and file persistence."""
    engine = RulesEngine(filepath=temp_rules_file)
    new_rule = engine.add_rule(
        agent_name="report",
        rule="Always include an emergency contacts appendix in critical failure reports.",
        category="safety",
        priority="high",
    )

    assert new_rule.id.startswith("rule_rep_")
    assert new_rule.status == "approved"

    # Verify reload from file
    reloaded = engine.get_rule_by_id(new_rule.id)
    assert reloaded is not None
    assert reloaded.rule == "Always include an emergency contacts appendix in critical failure reports."
    assert reloaded.category == "safety"


def test_update_rule_in_file(temp_rules_file):
    """Verify updating rule text and priority."""
    engine = RulesEngine(filepath=temp_rules_file)
    updated = engine.update_rule(
        rule_id="rule_vis_001",
        rule="Updated: Never certify pressure vessels from photos.",
        priority="low",
    )

    assert updated is not None
    assert updated.rule == "Updated: Never certify pressure vessels from photos."
    assert updated.priority == "low"

    # Confirm in fresh instance reading file
    fresh_engine = RulesEngine(filepath=temp_rules_file)
    rule_check = fresh_engine.get_rule_by_id("rule_vis_001")
    assert rule_check.rule == "Updated: Never certify pressure vessels from photos."
    assert rule_check.priority == "low"


def test_toggle_rule(temp_rules_file):
    """Verify toggling active status on and off."""
    engine = RulesEngine(filepath=temp_rules_file)
    
    # Disable rule_vis_001
    toggled_off = engine.toggle_rule("rule_vis_001", active=False)
    assert toggled_off.status == "disabled"

    # Injected prompt should no longer contain rule_vis_001
    injected = engine.get_rules_for_agent("Visual Agent")
    assert "Never make safety-critical" not in injected

    # Re-enable
    toggled_on = engine.toggle_rule("rule_vis_001", active=True)
    assert toggled_on.status == "approved"
    injected_again = engine.get_rules_for_agent("Visual Agent")
    assert "Never make safety-critical" in injected_again


def test_delete_rule(temp_rules_file):
    """Verify deleting a rule removes it permanently from disk."""
    engine = RulesEngine(filepath=temp_rules_file)
    deleted = engine.delete_rule("rule_vis_002")
    assert deleted is True

    # Rule should no longer exist
    assert engine.get_rule_by_id("rule_vis_002") is None
    assert len(engine.get_all_rules()) == 3


def test_extract_rule_from_feedback_heuristic():
    """Test fallback heuristic rule extraction from user feedback."""
    mock_ollama = MagicMock(spec=OllamaService)
    mock_ollama.generate_text.return_value = {"success": False, "error": "Offline"}

    engine = RulesEngine(ollama_service=mock_ollama)
    feedback_text = "Always prioritize the 2024 SOP for turbine startup over older versions."
    
    res = engine.extract_rule_from_feedback(
        user_feedback=feedback_text,
        agent_name="rag",
        auto_save=False,
    )

    assert isinstance(res, FeedbackExtractionResponse)
    assert "SOP" in res.extracted_rule.rule
    assert res.extracted_rule.agent == "rag"
    assert res.extracted_rule.status == "pending"


def test_extract_rule_from_feedback_mock_llm(temp_rules_file):
    """Test LLM-driven rule extraction with auto-save."""
    mock_ollama = MagicMock(spec=OllamaService)
    mock_llm_json = {
        "rule": "Always verify calibration baseline before generating anomaly charts.",
        "agent": "data",
        "category": "calculation",
        "priority": "high",
        "reasoning": "User noticed false anomaly alert due to missing calibration baseline."
    }

    mock_ollama.generate_text.return_value = {
        "success": True,
        "response": json.dumps(mock_llm_json),
    }

    engine = RulesEngine(filepath=temp_rules_file, ollama_service=mock_ollama)
    feedback_text = "Your chart showed an anomaly but you didn't check the calibration baseline first!"

    res = engine.extract_rule_from_feedback(
        user_feedback=feedback_text,
        agent_name="data",
        auto_save=True,
        auto_approve=True,
    )

    assert res.auto_saved is True
    assert res.extracted_rule.status == "approved"
    assert res.extracted_rule.category == "calculation"
    assert "calibration baseline" in res.extracted_rule.rule

    # Verify it was saved to the temp rules file
    all_rules = engine.get_all_rules(agent="data")
    assert len(all_rules) >= 1
    assert "calibration baseline" in all_rules[0].rule
