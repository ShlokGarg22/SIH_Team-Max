import os
import sys
import json
import tempfile
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
    from backend.schemas.agent import RuleSchema, FeedbackExtractionResponse
except ImportError:
    from rules.engine import RulesEngine  # type: ignore
    from services.ollama_service import OllamaService  # type: ignore
    from schemas.agent import RuleSchema, FeedbackExtractionResponse  # type: ignore


class TestRulesEngine(unittest.TestCase):
    """Unit tests for the RulesEngine and self-improvement layer."""

    def setUp(self):
        self.temp_file = tempfile.NamedTemporaryFile(delete=False, mode="w", encoding="utf-8", suffix=".md")
        self.initial_content = (
            "## Global Rules\n"
            "- [id: rule_glob_001 | category: safety | priority: high | status: approved] Do not make unsupported claims.\n"
            "- [id: rule_glob_002 | category: security | priority: high | status: disabled] Disabled global test rule.\n\n"
            "## Visual Agent Rules\n"
            "- [id: rule_vis_001 | category: safety | priority: high | status: approved] Never make safety-critical structural integrity guarantees from images alone.\n"
            "- [id: rule_vis_002 | category: procedural_guardrail | priority: medium | status: approved] Always classify findings into 3 categories.\n"
        )
        self.temp_file.write(self.initial_content)
        self.temp_file.close()
        self.temp_rules_file = self.temp_file.name

    def tearDown(self):
        if os.path.exists(self.temp_rules_file):
            os.remove(self.temp_rules_file)

    def test_parse_and_load_all_rules(self):
        """Verify structured parsing and filtering from rules.md."""
        engine = RulesEngine(filepath=self.temp_rules_file)
        all_rules = engine.get_all_rules()

        self.assertEqual(len(all_rules), 4)
        
        # Filter by agent
        visual_rules = engine.get_all_rules(agent="visual")
        self.assertEqual(len(visual_rules), 2)
        self.assertEqual(visual_rules[0].id, "rule_vis_001")

        # Filter by status
        approved_rules = engine.get_all_rules(status="approved")
        self.assertEqual(len(approved_rules), 3)
        disabled_rules = engine.get_all_rules(status="disabled")
        self.assertEqual(len(disabled_rules), 1)
        self.assertEqual(disabled_rules[0].id, "rule_glob_002")

    def test_dynamic_prompt_injection(self):
        """Verify that disabled rules are omitted and clean text is generated for prompts."""
        engine = RulesEngine(filepath=self.temp_rules_file)
        injected_str = engine.get_rules_for_agent("Visual Agent", include_global=True)

        self.assertIn("Do not make unsupported claims.", injected_str)
        self.assertIn("Never make safety-critical structural integrity guarantees", injected_str)
        self.assertNotIn("Disabled global test rule", injected_str)  # Excluded because disabled
        self.assertNotIn("[id:", injected_str)  # Clean text without raw tags

    def test_add_new_rule_mutation(self):
        """Verify adding a new approved rule writes formatted entry into rules.md."""
        engine = RulesEngine(filepath=self.temp_rules_file)
        new_rule = engine.add_rule(
            agent_name="Data Agent",
            rule="Verify column types before executing calculations.",
            category="calculation",
            priority="high",
            status="approved"
        )

        self.assertTrue(new_rule.id.startswith("rule_dat_"))
        self.assertEqual(new_rule.agent, "data")
        
        # Verify persistence
        updated_rules = engine.get_all_rules(agent="data")
        self.assertEqual(len(updated_rules), 1)
        self.assertEqual(updated_rules[0].rule, "Verify column types before executing calculations.")

    def test_update_rule_status_toggle(self):
        """Verify toggling rule status between approved and disabled."""
        engine = RulesEngine(filepath=self.temp_rules_file)
        
        # Toggle rule_vis_001 from approved to disabled
        updated = engine.update_rule_status("rule_vis_001", "disabled")
        self.assertIsNotNone(updated)
        self.assertEqual(updated.status, "disabled")

        # Injected prompt should no longer contain rule_vis_001
        injected = engine.get_rules_for_agent("Visual Agent", include_global=False)
        self.assertNotIn("Never make safety-critical structural integrity guarantees", injected)

    def test_llm_rule_extraction_from_user_feedback(self):
        """Test extraction of structured candidate rule from natural language human feedback."""
        mock_ollama = MagicMock(spec=OllamaService)
        mock_ollama.generate_text.return_value = {
            "success": True,
            "response": json.dumps({
                "agent": "rag",
                "category": "source_priority",
                "priority": "high",
                "rule": "Always prioritize the 2024 revised SOP over older 2023 documents for pump repairs.",
                "reasoning": "The user explicitly corrected the RAG agent on document version prioritization."
            })
        }


        engine = RulesEngine(filepath=self.temp_rules_file, ollama_service=mock_ollama)
        feedback_res = engine.extract_rule_from_feedback(
            user_feedback="You gave me steps from 2023, always prioritize the 2024 SOP for pumps!",
            agent_name="rag_agent",
            auto_save=True
        )

        self.assertIsInstance(feedback_res, FeedbackExtractionResponse)
        self.assertIn(feedback_res.extracted_rule.agent, ["rag", "rag_agent"])
        self.assertEqual(feedback_res.extracted_rule.category, "source_priority")
        self.assertTrue(feedback_res.auto_saved)

        # Confirm saved in file
        rag_rules = engine.get_all_rules(agent="rag") + engine.get_all_rules(agent="rag_agent")
        self.assertTrue(len(rag_rules) >= 1)
        self.assertIn("2024 revised SOP", rag_rules[0].rule)



if __name__ == "__main__":
    unittest.main()
