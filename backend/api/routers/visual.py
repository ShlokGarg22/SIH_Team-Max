import os
import uuid
import shutil
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends

from backend.schemas.agent import AgentResponse, VisualRequestPayload
from backend.agents.visual_agent.visual_agent import VisualAgent
from backend.services.ollama_service import OllamaService
from backend.rules.engine import RulesEngine

router = APIRouter(prefix="/api/agents/visual", tags=["Visual Agent"])

# Default instance injection
def get_visual_agent() -> VisualAgent:
    return VisualAgent(
        rules_engine=RulesEngine(),
        ollama_service=OllamaService(),
    )


@router.get("/health")
async def visual_agent_health(agent: VisualAgent = Depends(get_visual_agent)):
    """Checks the health and connectivity of the Visual Agent and local Ollama instance."""
    is_online = agent.ollama_service.is_available()
    local_models = agent.ollama_service.list_local_models() if is_online else []
    
    return {
        "status": "ready" if is_online else "ollama_offline",
        "ollama_available": is_online,
        "default_vision_model": agent.default_model,
        "installed_models": local_models,
    }


@router.post("/analyze", response_model=AgentResponse)
async def analyze_image_json(
    payload: VisualRequestPayload,
    agent: VisualAgent = Depends(get_visual_agent),
):
    """
    Analyzes an industrial image via JSON payload (with image_paths or image_base64).
    """
    task_id = f"task_vis_{uuid.uuid4().hex[:8]}"

    response = agent.analyze(
        prompt=payload.prompt,
        task_id=task_id,
        image_paths=payload.image_paths,
        image_base64=payload.image_base64,
        model=payload.model,
    )

    if response.status == "failed" and not response.findings:
        # Return structured failure without throwing 500
        return response

    return response


@router.post("/upload-and-analyze", response_model=AgentResponse)
async def upload_and_analyze_image(
    prompt: str = Form(..., description="Inspection query or instructions for the image"),
    file: UploadFile = File(..., description="Industrial image file (PNG/JPG/WEBP)"),
    model: Optional[str] = Form(None, description="Optional vision model override"),
    agent: VisualAgent = Depends(get_visual_agent),
):
    """
    Uploads a multipart image file and immediately runs Visual Agent inspection.
    """
    task_id = f"task_vis_{uuid.uuid4().hex[:8]}"

    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
    _, ext = os.path.splitext(file.filename or "")
    if ext.lower() not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported formats: {', '.join(allowed_extensions)}",
        )

    image_bytes = await file.read()

    response = agent.analyze(
        prompt=prompt,
        task_id=task_id,
        image_bytes=image_bytes,
        image_filename=file.filename,
        model=model,
    )

    return response
