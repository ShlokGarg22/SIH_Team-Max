import os
import json
import base64
# pyrefly: ignore [missing-import]
import pytest
from unittest.mock import MagicMock, patch

from backend.rules.engine import RulesEngine
from backend.services.ollama_service import OllamaService
from backend.agents.visual_agent.visual_agent import VisualAgent
from backend.schemas.agent import AgentResponse, Evidence, VisualRequestPayload


@pytest.fixture
def sample_image_bytes():
    # 1x1 transparent PNG bytes
    return base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    )


def test_rules_engine_injection():
    """Verify that Visual Agent and Global rules are extracted from rules.md correctly."""
    engine = RulesEngine()
    rules = engine.get_rules_for_agent("Visual Agent", include_global=True)
    
    assert "Global Rules" in rules
    assert "Visual Agent Rules" in rules
    assert "structural integrity" in rules.lower()


def test_system_prompt_builder():
    """Verify system prompt enforces industrial safety constraints and rule injection."""
    agent = VisualAgent()
    rules_text = "Rule 1: Inspect flanges carefully."
    prompt = agent.build_system_prompt(rules_text)
    
    assert "Visual Inspection Agent" in prompt
    assert "direct_observations" in prompt
    assert "inferred_observations" in prompt
    assert "undetermined_factors" in prompt
    assert "Rule 1: Inspect flanges carefully." in prompt


def test_visual_agent_successful_analysis(sample_image_bytes):
    """Test full analysis flow with mock Ollama response matching the expected JSON contract."""
    mock_ollama = MagicMock(spec=OllamaService)
    mock_ollama.encode_image_bytes_to_base64.return_value = "dummy_base64_string"
    
    mock_json_response = {
        "equipment_type": "Centrifugal Pump P-101",
        "direct_observations": [
            "Heavy surface oxidation and rust on casing flange bolts.",
            "Pressure gauge dial shows needle positioned at 1.5 bar."
        ],
        "inferred_observations": [
            "Discoloration on pipe junction indicates possible past fluid leakage."
        ],
        "undetermined_factors": [
            "Internal impeller condition and mechanical seal wear cannot be determined visually."
        ],
        "safety_advisory": "Visual analysis only. Hydrostatic testing required before returning to service.",
        "confidence": 0.90
    }
    
    mock_ollama.generate_vision.return_value = {
        "success": True,
        "response": json.dumps(mock_json_response),
        "model": "llava",
    }
    
    agent = VisualAgent(ollama_service=mock_ollama)
    
    result = agent.analyze(
        prompt="Inspect this pump flange for defects",
        image_bytes=sample_image_bytes,
        image_filename="pump_casing.png"
    )
    
    assert isinstance(result, AgentResponse)
    assert result.status == "completed"
    assert result.agent_name == "visual_agent"
    assert result.confidence == 0.90
    assert len(result.findings) >= 5
    
    # Check categorized findings
    findings_str = "\n".join(result.findings)
    assert "Identified Equipment: Centrifugal Pump P-101" in findings_str
    assert "[Direct Observation] Heavy surface oxidation" in findings_str
    assert "[Inferred Analysis] Discoloration on pipe junction" in findings_str
    assert "[Undetermined / Requires Verification] Internal impeller condition" in findings_str
    assert "[Safety Advisory]" in findings_str
    
    # Check evidence citations
    assert len(result.evidence) >= 2
    assert result.evidence[0].source == "pump_casing.png"


def test_visual_agent_no_image_error():
    """Verify graceful error handling when no image is provided."""
    agent = VisualAgent()
    result = agent.analyze(prompt="Inspect equipment")
    
    assert result.status == "failed"
    assert len(result.errors) > 0
    assert "No image provided" in result.errors[0]


def test_visual_agent_ollama_offline_error(sample_image_bytes):
    """Verify structured response when local Ollama is offline."""
    mock_ollama = MagicMock(spec=OllamaService)
    mock_ollama.encode_image_bytes_to_base64.return_value = "dummy_base64"
    mock_ollama.generate_vision.return_value = {
        "success": False,
        "error": "Cannot connect to Ollama at http://localhost:11434.",
        "response": ""
    }
    
    agent = VisualAgent(ollama_service=mock_ollama)
    result = agent.analyze(
        prompt="Check gauge reading",
        image_bytes=sample_image_bytes
    )
    
    assert result.status == "failed"
    assert len(result.errors) == 1
    assert "Cannot connect to Ollama" in result.errors[0]
