import os
import sys
import json
import base64
import unittest
from unittest.mock import MagicMock

# Ensure backend and parent directories are in sys.path
_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.abspath(os.path.join(_current_dir, ".."))
_root_dir = os.path.abspath(os.path.join(_backend_dir, ".."))
for p in [_backend_dir, _root_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)


try:
    from backend.rules.engine import RulesEngine
    from backend.services.ollama_service import OllamaService
    from backend.agents.visual_agent.visual_agent import VisualAgent
    from backend.schemas.agent import AgentResponse, Evidence, VisualRequestPayload
except ImportError:
    from rules.engine import RulesEngine  # type: ignore
    from services.ollama_service import OllamaService  # type: ignore
    from agents.visual_agent.visual_agent import VisualAgent  # type: ignore
    from schemas.agent import AgentResponse, Evidence, VisualRequestPayload  # type: ignore


class TestVisualAgent(unittest.TestCase):
    """Unit tests for the VisualAgent pipeline."""

    def setUp(self):
        self.sample_image_bytes = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )

    def test_rules_engine_injection(self):
        """Verify that Visual Agent and Global rules are extracted from rules.md correctly."""
        engine = RulesEngine()
        rules = engine.get_rules_for_agent("Visual Agent", include_global=True)
        
        self.assertIn("Global Rules", rules)
        self.assertIn("Visual Agent Rules", rules)
        self.assertIn("structural integrity", rules.lower())

    def test_system_prompt_builder(self):
        """Verify system prompt enforces industrial safety constraints and rule injection."""
        agent = VisualAgent()
        rules_text = "Rule 1: Inspect flanges carefully."
        prompt = agent.build_system_prompt(rules_text)
        
        self.assertIn("Visual Inspection Agent", prompt)
        self.assertIn("direct_observations", prompt)
        self.assertIn("inferred_observations", prompt)
        self.assertIn("undetermined_factors", prompt)
        self.assertIn("Rule 1: Inspect flanges carefully.", prompt)

    def test_visual_agent_successful_analysis(self):
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
            "safety_advisory": "Visual inspection notice: Pressure testing required.",
            "confidence": 0.88
        }

        mock_ollama.generate_vision.return_value = {
            "success": True,
            "response": json.dumps(mock_json_response),
            "model": "llava",
            "error": None
        }

        agent = VisualAgent(ollama_service=mock_ollama)
        response = agent.analyze(
            prompt="Inspect this pump casing for damage",
            task_id="task_vis_test",
            image_bytes=self.sample_image_bytes,
            image_filename="pump_leak.jpg"
        )

        self.assertIsInstance(response, AgentResponse)
        self.assertEqual(response.status, "completed")
        self.assertEqual(response.agent_name, "visual_agent")
        self.assertTrue(len(response.findings) >= 3)
        self.assertTrue(any("Direct Observation" in f for f in response.findings))
        self.assertTrue(any("Inferred Analysis" in f for f in response.findings))
        self.assertTrue(any("Undetermined" in f for f in response.findings))
        self.assertTrue(len(response.evidence) >= 1)
        self.assertEqual(response.evidence[0].source, "pump_leak.jpg")
        self.assertEqual(response.confidence, 0.88)

    def test_visual_agent_fallback_on_unstructured_text(self):
        """Verify that when Ollama returns non-JSON text, the agent cleans and formats it safely."""
        mock_ollama = MagicMock(spec=OllamaService)
        mock_ollama.encode_image_bytes_to_base64.return_value = "dummy_base64_string"
        mock_ollama.generate_vision.return_value = {
            "success": True,
            "response": "I observe visible rust on the flange and minor steam leakage near valve bonnet.",
            "model": "llava",
            "error": None
        }

        agent = VisualAgent(ollama_service=mock_ollama)
        response = agent.analyze(
            prompt="Analyze this valve",
            image_bytes=self.sample_image_bytes,
        )

        self.assertEqual(response.status, "completed")
        self.assertIn("visible rust on the flange", response.findings[0])
        self.assertTrue(len(response.findings) >= 1)




if __name__ == "__main__":
    unittest.main()
