import os
import sys
import json
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
    from backend.agents.report_agent.report_agent import ReportAgent
    from backend.schemas.agent import AgentResponse, Evidence, ReportRequestPayload, ReportResult
except ImportError:
    from rules.engine import RulesEngine  # type: ignore
    from services.ollama_service import OllamaService  # type: ignore
    from agents.report_agent.report_agent import ReportAgent  # type: ignore
    from schemas.agent import AgentResponse, Evidence, ReportRequestPayload, ReportResult  # type: ignore


class TestReportAgent(unittest.TestCase):
    """Unit tests for the ReportAgent synthesis pipeline."""

    def setUp(self):
        self.sample_payload = ReportRequestPayload(
            title="Boiler B-202 Over-Temperature & Steam Valve Seal Breach",
            equipment_id="Boiler B-202",
            plant_area="Utilities & Steam Generation Unit",
            severity="CRITICAL",
            report_type="incident_investigation",
            agent_responses=[
                AgentResponse(
                    task_id="task_vis_01",
                    agent_name="visual_agent",
                    status="completed",
                    findings=[
                        "DIRECT OBSERVATIONS: Steam leaking around primary valve bonnet; pressure gauge needle pegged at 42 bar.",
                        "INFERRED OBSERVATIONS: High temperature seal degradation.",
                        "UNDETERMINED FACTORS: Internal metallurgical creep."
                    ],
                    evidence=[Evidence(source="boiler_leak.png", page=1)],
                    confidence=0.9,
                    errors=[]
                ),
                AgentResponse(
                    task_id="task_rag_01",
                    agent_name="rag_agent",
                    status="completed",
                    findings=[
                        "SOP-MRPL-STM-012 Page 14 dictates maximum allowable steam operating pressure is 35 bar. Immediate depressurization required if pressure exceeds 40 bar."
                    ],
                    evidence=[Evidence(source="SOP-MRPL-STM-012.pdf", page=14)],
                    confidence=0.95,
                    errors=[]
                ),
                AgentResponse(
                    task_id="task_data_01",
                    agent_name="data_agent",
                    status="completed",
                    findings=[
                        "Telemetry Analysis: Steam pressure rose sharply from 31.2 bar to 42.1 bar between 03:15 AM and 03:45 AM (35% surge above nominal limit)."
                    ],
                    evidence=[Evidence(source="steam_telemetry_aug2026.csv")],
                    confidence=0.98,
                    errors=[]
                )
            ],
            additional_context="Night shift supervisor initiated emergency fuel cutoff at 03:52 AM."
        )

    def test_rules_engine_injection(self):
        """Verify that Report Agent rules are extracted and injected correctly."""
        engine = RulesEngine()
        rules = engine.get_rules_for_agent("Report Agent", include_global=True)
        
        self.assertIn("Global Rules", rules)
        self.assertIn("Report Agent Rules", rules)
        self.assertIn("Executive Summary", rules)
        self.assertIn("5-Whys", rules)

    def test_deterministic_fallback_synthesis(self):
        """Verify that report generation succeeds with ISO structure even when LLM is offline."""
        mock_ollama = MagicMock(spec=OllamaService)
        mock_ollama.generate_text.return_value = {
            "success": False,
            "error": "Ollama service unavailable in air-gapped test environment",
            "response": ""
        }

        agent = ReportAgent(ollama_service=mock_ollama)
        report = agent.generate_report(self.sample_payload)

        self.assertIsInstance(report, ReportResult)
        self.assertEqual(report.title, "Boiler B-202 Over-Temperature & Steam Valve Seal Breach")
        self.assertEqual(report.equipment_id, "Boiler B-202")
        self.assertEqual(report.severity, "CRITICAL")
        self.assertEqual(report.status, "completed")
        self.assertTrue(len(report.markdown_content) > 500)
        self.assertTrue(len(report.sources) >= 3)
        self.assertTrue(len(report.root_cause_analysis) >= 4)
        self.assertTrue(len(report.recommendations) >= 3)

        # Check headers in generated Markdown
        self.assertIn("INDUSTRIAL", report.markdown_content)
        self.assertIn("REPORT", report.markdown_content)
        self.assertIn("## 1. Executive Summary", report.markdown_content)
        self.assertIn("## 2. Problem Statement", report.markdown_content)
        self.assertIn("## 3. Multi-Source Field Findings", report.markdown_content)
        self.assertIn("## 4. Root Cause Analysis (5-Whys", report.markdown_content)


    def test_llm_json_synthesis(self):
        """Verify parsing when local LLM returns structured JSON synthesis."""
        mock_ollama = MagicMock(spec=OllamaService)
        mock_llm_output = {
            "executive_summary": "Boiler B-202 suffered a severe over-pressure event resulting in valve seal failure.",
            "root_cause_analysis": [
                "Why 1: Steam pressure breached 42 bar due to feed valve sticking.",
                "Why 2: Polymer gasket degraded under excessive thermal load.",
                "Why 3: Preventative inspection interval was exceeded by 60 days."
            ],
            "recommendations": [
                "1. Replace valve bonnet seal with high-temperature Viton gasket.",
                "2. Recalibrate emergency trip pressure transducers."
            ],
            "markdown_content": "# Comprehensive Investigation Report\n\nExecutive summary and findings."
        }
        mock_ollama.generate_text.return_value = {
            "success": True,
            "response": json.dumps(mock_llm_output),
            "model": "llama3",
            "error": None
        }

        agent = ReportAgent(ollama_service=mock_ollama)
        report = agent.generate_report(self.sample_payload)

        self.assertIsInstance(report, ReportResult)
        self.assertEqual(report.executive_summary, mock_llm_output["executive_summary"])
        self.assertEqual(len(report.root_cause_analysis), 3)
        self.assertEqual(len(report.recommendations), 2)
        self.assertEqual(report.markdown_content, mock_llm_output["markdown_content"])


if __name__ == "__main__":
    unittest.main()
