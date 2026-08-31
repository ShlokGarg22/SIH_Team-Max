import logging
from typing import List, Dict, Any
try:
    from fastapi import APIRouter, HTTPException, Depends  # type: ignore
except ImportError:
    pass


from backend.schemas.agent import ReportRequestPayload, ReportResult
from backend.agents.report_agent.report_agent import ReportAgent
from backend.services.ollama_service import OllamaService
from backend.rules.engine import RulesEngine

logger = logging.getLogger("ReportRouter")
router = APIRouter(prefix="/api/agents/report", tags=["Report Agent"])


def get_report_agent() -> ReportAgent:
    return ReportAgent(
        rules_engine=RulesEngine(),
        ollama_service=OllamaService(),
    )


@router.get("/templates")
async def list_report_templates():
    """Returns available ISO-standard industrial report templates."""
    return {
        "templates": [
            {
                "id": "incident_investigation",
                "name": "Industrial Incident & Failure Investigation",
                "description": "Comprehensive 5-Whys root cause analysis, multi-agent evidence synthesis, and corrective recommendations.",
                "standard": "ISO 55001 / OSHA 1910",
            },
            {
                "id": "equipment_health_check",
                "name": "Equipment Routine Health & Condition Audit",
                "description": "Correlates visual surface inspection with historical telemetry metrics and SOP maintenance thresholds.",
                "standard": "ISO 17359 Condition Monitoring",
            },
            {
                "id": "diagnostic_report",
                "name": "Telemetry & Anomaly Diagnostic Report",
                "description": "Deep data analysis detailing statistical deviations, failure correlations, and sensor drift.",
                "standard": "ISO 13374 Condition Assessment",
            },
            {
                "id": "sop_compliance",
                "name": "SOP & Procedural Compliance Verification",
                "description": "Audits operational procedures against the latest approved plant SOP versions with exact citations.",
                "standard": "ISO 9001 Quality Management",
            },
        ]
    }


@router.post("/generate", response_model=ReportResult)
async def generate_industrial_report(
    payload: ReportRequestPayload,
    agent: ReportAgent = Depends(get_report_agent),
):
    """
    Generates a structured ISO-compliant industrial report by aggregating findings
    from Visual, RAG, Data, or Deep Research agents.
    """
    try:
        report = agent.generate_report(payload)
        return report
    except Exception as e:
        logger.error(f"Report generation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate report: {str(e)}"
        )


@router.post("/generate-html")
async def generate_report_html_endpoint(
    payload: ReportRequestPayload,
    agent: ReportAgent = Depends(get_report_agent),
):
    """
    Generates an executive-grade styled HTML report document.
    """
    try:
        from fastapi.responses import HTMLResponse  # type: ignore
    except ImportError:
        pass
    try:
        html_content = agent.generate_html(payload)
        return HTMLResponse(content=html_content, status_code=200)
    except Exception as e:
        logger.error(f"HTML report generation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate HTML report: {str(e)}"
        )


@router.post("/export-pdf")
async def export_report_pdf_endpoint(
    payload: ReportRequestPayload,
    agent: ReportAgent = Depends(get_report_agent),
):
    """
    Generates and exports the report as a downloadable binary PDF document.
    """
    try:
        from fastapi.responses import Response  # type: ignore
    except ImportError:
        pass

    try:
        pdf_bytes = agent.export_pdf(payload)
        filename = f"report_{payload.equipment_id or 'asset'}.pdf".replace(" ", "_")
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            },
        )
    except Exception as e:
        logger.error(f"PDF report export error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export PDF report: {str(e)}"
        )

