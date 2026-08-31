import os
import json
import pytest
from unittest.mock import MagicMock

from backend.rules.engine import RulesEngine
from backend.services.ollama_service import OllamaService
from backend.agents.report_agent.report_agent import ReportAgent
from backend.schemas.agent import AgentResponse, Evidence, ReportRequestPayload, ReportResult


@pytest.fixture
def sample_multi_agent_payload():
    return ReportRequestPayload(
        title="Boiler B-202 Over-Temperature & Steam Valve Seal Breach",
        equipment_id="Boiler B-202",
        plant_area="Steam Generation Facility Unit 1",
        severity="CRITICAL",
        report_type="incident_investigation",
        agent_responses=[
            AgentResponse(
                task_id="task_vis_001",
                agent_name="visual_agent",
                status="completed",
                findings=[
                    "[Direct Observation] Steam valve bonnet shows thermal discoloration and dark streak markings.",
                    "[Direct Observation] Pressure relief indicator flag is tripped in UP position.",
                    "[Inferred Analysis] Possible seal blowout due to high thermal gradient.",
                    "[Undetermined / Requires Verification] Internal tube bundle scaling cannot be determined visually."
                ],
                evidence=[
                    Evidence(source="boiler_valve_photo.jpg", chunk="Discoloration on bonnet, flag tripped", confidence=0.94)
                ]
            ),
            AgentResponse(
                task_id="task_rag_001",
                agent_name="rag_agent",
                status="completed",
                findings=[
                    "[SOP Citation] MRPL-SOP-BOILER-2024 (Page 8): Maximum allowable continuous operating temperature is 450°C.",
                    "[SOP Citation] Emergency depressurization procedure SOP-701 mandatory if relief flag is tripped."
                ],
                evidence=[
                    Evidence(source="MRPL-SOP-BOILER-2024.pdf", page=8, chunk="Section 2.1 Thermal Limits", confidence=0.98),
                    Evidence(source="MRPL-SOP-EMERGENCY-701.pdf", page=3, chunk="Section 1.4 Immediate Depressurization", confidence=0.96)
                ]
            ),
            AgentResponse(
                task_id="task_data_001",
                agent_name="data_agent",
                status="completed",
                findings=[
                    "Telemetry data indicates furnace temperature reached 482°C at 14:15 UTC (exceeding limit by 32°C).",
                    "Steam pressure dropped sharply from 65 bar to 42 bar in 8 minutes."
                ],
                evidence=[
                    Evidence(source="boiler_b202_telemetry.csv", chunk="Timestamp 14:15 UTC temperature spike to 482C", confidence=0.92)
                ]
            )
        ],
        additional_context="Audible steam venting reported by field operator at 14:18 UTC.",
    )


def test_report_rules_injection():
    """Verify that Report Agent rules are extracted from rules.md properly."""
    engine = RulesEngine()
    rules = engine.get_rules_for_agent("Report Agent", include_global=True)
    
    assert "Global Rules" in rules
    assert "Report Agent Rules" in rules
    assert "Executive Summary" in rules
    assert "5-Whys" in rules


def test_multi_agent_aggregation(sample_multi_agent_payload):
    """Verify multi-agent findings are correctly categorized by agent domain."""
    agent = ReportAgent()
    categorized, sources = agent._aggregate_findings_and_sources(sample_multi_agent_payload)

    assert len(categorized["visual"]) == 4
    assert len(categorized["rag"]) == 2
    assert len(categorized["data"]) == 2
    assert len(sources) == 4  # 1 visual + 2 rag + 1 data


def test_deterministic_fallback_synthesis(sample_multi_agent_payload):
    """Verify deterministic fallback report generation generates all 7 ISO sections with correct markdown."""
    # Force offline Ollama
    mock_ollama = MagicMock(spec=OllamaService)
    mock_ollama.generate_text.return_value = {"success": False, "error": "Ollama offline"}

    agent = ReportAgent(ollama_service=mock_ollama)
    report = agent.generate_report(sample_multi_agent_payload)

    assert isinstance(report, ReportResult)
    assert report.status == "completed"
    assert report.equipment_id == "Boiler B-202"
    assert report.severity == "CRITICAL"
    assert len(report.root_cause_analysis) >= 5
    assert len(report.recommendations) >= 3
    assert len(report.sources) == 4

    # Verify Markdown sections
    md = report.markdown_content
    assert "# INDUSTRIAL DIAGNOSTIC & INVESTIGATION REPORT" in md
    assert "## 1. Executive Summary" in md
    assert "## 2. Problem Statement & Scope" in md
    assert "## 3. Multi-Source Field Findings & Evidence" in md
    assert "Visual Inspection Agent Findings" in md
    assert "Telemetry & Data Analysis Findings" in md
    assert "Standard Operating Procedures (SOP Citations)" in md
    assert "## 4. Root Cause Analysis (5-Whys Methodology)" in md
    assert "## 5. Technical Conclusion" in md
    assert "## 6. Actionable Recommendations" in md
    assert "## 7. Traceability & Evidence Citations Appendix" in md
    assert "MRPL-SOP-BOILER-2024.pdf" in md


def test_llm_synthesis_with_mock_ollama(sample_multi_agent_payload):
    """Test full LLM synthesis pathway when Ollama returns structured JSON output."""
    mock_ollama = MagicMock(spec=OllamaService)
    mock_json_response = {
        "executive_summary": "Boiler B-202 experienced thermal excursion to 482C causing steam seal breach.",
        "root_cause_analysis": [
            "Why 1: Steam pressure dropped rapidly.",
            "Why 2: Seal blowout occurred on the steam valve bonnet.",
            "Why 3: Temperature exceeded 450C limit reaching 482C.",
            "Why 4: Fuel-to-air ratio control loop drifted during high-load cycle.",
            "Why 5: Sensor calibration was past scheduled maintenance date."
        ],
        "recommendations": [
            "Initiate immediate emergency cooldown SOP-701.",
            "Replace bonnet seal gasket and torque bolts to OEM spec.",
            "Recalibrate air-fuel ratio controller before restart."
        ],
        "markdown_content": "# Generated LLM Report\n## 1. Executive Summary\nBoiler B-202 incident..."
    }

    mock_ollama.generate_text.return_value = {
        "success": True,
        "response": json.dumps(mock_json_response),
        "model": "llama3"
    }

    agent = ReportAgent(ollama_service=mock_ollama)
    report = agent.generate_report(sample_multi_agent_payload)

    assert report.status == "completed"
    assert "Boiler B-202 experienced thermal excursion" in report.executive_summary
    assert len(report.root_cause_analysis) == 5
    assert len(report.recommendations) == 3
    assert "# Generated LLM Report" in report.markdown_content


def test_html_template_generation(sample_multi_agent_payload):
    """Verify that generate_html produces valid HTML with inline styling and metadata."""
    agent = ReportAgent()
    html_output = agent.generate_html(sample_multi_agent_payload)

    assert "<!DOCTYPE html>" in html_output
    assert "INDUSTRIAL DIAGNOSTIC & INVESTIGATION REPORT" in html_output
    assert "CRITICAL SEVERITY" in html_output
    assert "Boiler B-202" in html_output
    assert "MRPL-SOP-BOILER-2024.pdf" in html_output
    assert "5-Whys Methodology" in html_output
    assert "Operations Superintendent" in html_output


def test_pdf_export_generation(sample_multi_agent_payload, tmp_path):
    """Verify that export_pdf converts HTML report into binary PDF with valid %PDF header."""
    agent = ReportAgent()
    pdf_file = str(tmp_path / "test_report.pdf")

    pdf_bytes = agent.export_pdf(sample_multi_agent_payload, output_path=pdf_file)

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    # PDF magic header check
    assert pdf_bytes[:5] == b"%PDF-"
    assert os.path.exists(pdf_file)
    assert os.path.getsize(pdf_file) > 1000

