import os
import json
import re
import uuid
import logging
from typing import List, Optional, Dict, Any, Union

try:
    from backend.schemas.agent import AgentResponse, Evidence, VisualAnalysisResult
    from backend.services.ollama_service import OllamaService
    from backend.rules.engine import RulesEngine
except ImportError:
    from schemas.agent import AgentResponse, Evidence, VisualAnalysisResult  # type: ignore
    from services.ollama_service import OllamaService  # type: ignore
    from rules.engine import RulesEngine  # type: ignore


logger = logging.getLogger("VisualAgent")
logger.setLevel(logging.INFO)


class VisualAgent:
    """
    The Visual Inspection Agent for the Sovereign AI Workbench.
    Processes photos of industrial equipment, engineering diagrams, gauges,
    and physical anomalies locally using open-weight multimodal LLMs.
    """

    def __init__(
        self,
        rules_engine: Optional[RulesEngine] = None,
        ollama_service: Optional[OllamaService] = None,
        default_model: str = "llava",
    ):
        self.rules_engine = rules_engine or RulesEngine()
        self.ollama_service = ollama_service or OllamaService()
        self.default_model = default_model

    def build_system_prompt(self, agent_rules: str) -> str:
        """Constructs a strict system prompt enforcing industrial visual safety guidelines."""
        return (
            "You are the specialized Visual Inspection Agent for a confidential industrial plant (e.g., MRPL refinery).\n"
            "Your objective is to inspect industrial photographs, engineering diagrams, piping & instrumentation, "
            "gauges, valves, pumps, and physical components.\n\n"
            "CRITICAL OPERATIONAL RULES & CONSTRAINTS:\n"
            "1. You must STRICTLY categorize all visual findings into THREE distinct categories:\n"
            "   - direct_observations: Concrete, undeniable physical facts visible in the image (e.g., rust color, missing bolt, pressure gauge value, valve lever position, disconnected wire).\n"
            "   - inferred_observations: Deductions or hypotheses based on visible indicators (e.g., possible cavitation, potential thermal discoloration).\n"
            "   - undetermined_factors: Internal states or metallurgical conditions that CANNOT be determined from visual image alone (e.g., internal seal wear, microscopic cracks, metallurgical fatigue).\n"
            "2. NEVER make safety-critical structural integrity certifications or declare high-pressure equipment fully safe based only on photographs.\n"
            "3. If text, labels, or gauge readings are visible, extract exact values and units.\n\n"
            f"GOVERNANCE & DYNAMIC RULES INJECTED:\n{agent_rules}\n\n"
            "OUTPUT FORMAT INSTRUCTIONS:\n"
            "You must return your response as a valid JSON object matching this schema:\n"
            "{\n"
            '  "equipment_type": "<Identified equipment/system or Unknown>",\n'
            '  "direct_observations": ["<Fact 1>", "<Fact 2>"],\n'
            '  "inferred_observations": ["<Inference 1>", "<Inference 2>"],\n'
            '  "undetermined_factors": ["<Undetermined 1>", "<Undetermined 2>"],\n'
            '  "safety_advisory": "Visual inspection notice: Field physical verification and ultrasonic/pressure testing required before operation.",\n'
            '  "confidence": 0.85\n'
            "}"
        )

    def analyze(
        self,
        prompt: str,
        task_id: Optional[str] = None,
        image_paths: Optional[List[str]] = None,
        image_base64: Optional[str] = None,
        image_bytes: Optional[bytes] = None,
        image_filename: Optional[str] = None,
        model: Optional[str] = None,
    ) -> AgentResponse:
        """
        Performs visual inspection on provided image(s).

        Args:
            prompt: User question or inspection query.
            task_id: Unique task identifier.
            image_paths: List of local image paths.
            image_base64: Direct base64-encoded image string.
            image_bytes: Raw bytes of uploaded image.
            image_filename: Optional source file name for evidence citations.
            model: Optional model override.

        Returns:
            AgentResponse: Standardized response contract with findings, evidence, and status.
        """
        task_id = task_id or f"task_vis_{uuid.uuid4().hex[:8]}"
        target_model = model or self.default_model

        # 1. Fetch Dynamic Rules
        injected_rules = self.rules_engine.get_rules_for_agent("Visual Agent", include_global=True)
        system_prompt = self.build_system_prompt(injected_rules)

        # 2. Collect and Encode Images to Base64
        images_b64: List[str] = []
        source_names: List[str] = []

        try:
            if image_base64:
                # Strip data URL prefix if present (e.g. data:image/png;base64,...)
                clean_b64 = image_base64.split(",")[-1] if "," in image_base64 else image_base64
                images_b64.append(clean_b64)
                source_names.append(image_filename or "uploaded_image_base64")

            elif image_bytes:
                encoded = self.ollama_service.encode_image_bytes_to_base64(image_bytes)
                images_b64.append(encoded)
                source_names.append(image_filename or "uploaded_image_file")

            elif image_paths:
                for path in image_paths:
                    encoded = self.ollama_service.encode_image_file_to_base64(path)
                    images_b64.append(encoded)
                    source_names.append(os.path.basename(path))

            if not images_b64:
                return AgentResponse(
                    task_id=task_id,
                    agent_name="visual_agent",
                    status="failed",
                    findings=[],
                    evidence=[],
                    confidence=0.0,
                    errors=["No image provided. Please upload an image file or provide a valid base64 image string."],
                )

        except Exception as e:
            return AgentResponse(
                task_id=task_id,
                agent_name="visual_agent",
                status="failed",
                findings=[],
                evidence=[],
                confidence=0.0,
                errors=[f"Image preparation error: {str(e)}"],
            )

        # 3. Execute Multimodal Query via Ollama
        query_prompt = (
            f"User Inspection Request: {prompt}\n\n"
            "Examine the attached image(s) carefully. Identify visible components, surface conditions, "
            "anomalies, gauge readings, and provide strict categorized findings in the required JSON format."
        )

        ollama_result = self.ollama_service.generate_vision(
            prompt=query_prompt,
            images_base64=images_b64,
            system_prompt=system_prompt,
            model=target_model,
            format_json=True,
        )

        if not ollama_result.get("success"):
            err = ollama_result.get("error", "Unknown Ollama vision inference error")
            return AgentResponse(
                task_id=task_id,
                agent_name="visual_agent",
                status="failed",
                findings=[],
                evidence=[],
                confidence=0.0,
                errors=[err],
            )

        raw_response = ollama_result.get("response", "")

        # 4. Parse Structured Findings
        parsed_data = self._parse_json_response(raw_response)

        findings: List[str] = []
        evidence_list: List[Evidence] = []
        overall_confidence = float(parsed_data.get("confidence", 0.85))

        primary_source = source_names[0] if source_names else "inspected_image"

        equipment = parsed_data.get("equipment_type")
        if equipment and equipment.lower() != "unknown":
            findings.append(f"Identified Equipment: {equipment}")

        # Add Direct Observations
        direct_obs = parsed_data.get("direct_observations", [])
        if isinstance(direct_obs, list):
            for obs in direct_obs:
                findings.append(f"[Direct Observation] {obs}")
                evidence_list.append(
                    Evidence(
                        source=primary_source,
                        chunk=f"Direct observation: {obs}",
                        confidence=overall_confidence,
                    )
                )

        # Add Inferred Observations
        inferred_obs = parsed_data.get("inferred_observations", [])
        if isinstance(inferred_obs, list):
            for inf in inferred_obs:
                findings.append(f"[Inferred Analysis] {inf}")

        # Add Undetermined Factors
        undetermined = parsed_data.get("undetermined_factors", [])
        if isinstance(undetermined, list):
            for und in undetermined:
                findings.append(f"[Undetermined / Requires Verification] {und}")

        # Add Safety Advisory
        advisory = parsed_data.get("safety_advisory")
        if advisory:
            findings.append(f"[Safety Advisory] {advisory}")

        # If parser couldn't find lists, fall back to raw response
        if not findings:
            findings = [raw_response.strip()]
            evidence_list.append(
                Evidence(
                    source=primary_source,
                    chunk=raw_response[:200],
                    confidence=overall_confidence,
                )
            )

        return AgentResponse(
            task_id=task_id,
            agent_name="visual_agent",
            status="completed",
            findings=findings,
            evidence=evidence_list,
            confidence=overall_confidence,
            errors=[],
        )

    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """Robust JSON extraction from LLM response text."""
        text = text.strip()
        try:
            return json.loads(text)
        except Exception:
            pass

        # Try regex search for outermost JSON object
        json_match = re.search(r"\{.*\}", text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except Exception:
                pass

        return {}


# -----------------------------------------------------------------------------
# Standalone CLI Testing Runner
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    import sys
    import argparse

    parser = argparse.ArgumentParser(description="Test the Visual Inspection Agent directly.")
    parser.add_argument("--image", "-i", type=str, help="Path to an image file (e.g. pump.jpg)")
    parser.add_argument("--prompt", "-p", type=str, default="Inspect this equipment and identify visible anomalies or conditions.", help="Inspection query")
    parser.add_argument("--model", "-m", type=str, default="llava", help="Ollama vision model (default: llava)")
    args = parser.parse_args()

    agent = VisualAgent(default_model=args.model)
    print("==================================================")
    print("   Sovereign AI Workbench - Visual Agent CLI      ")
    print("==================================================")
    
    # Check Ollama connectivity
    if not agent.ollama_service.is_available():
        print(f"[!] WARNING: Local Ollama service is not reachable at {agent.ollama_service.base_url}")
        print("    Please start Ollama using 'ollama serve' and ensure a vision model is pulled:")
        print(f"    ollama pull {args.model}\n")

    if args.image and os.path.exists(args.image):
        print(f"[*] Analyzing image: {args.image}")
        print(f"[*] User Prompt: {args.prompt}")
        print(f"[*] Target Model: {args.model}\n")

        result = agent.analyze(
            prompt=args.prompt,
            image_paths=[args.image],
            model=args.model
        )

        print("\n--- Visual Agent Response ---")
        print(f"Status: {result.status}")
        print(f"Confidence: {result.confidence}")
        print("\nFindings:")
        for finding in result.findings:
            print(f"  - {finding}")

        if result.evidence:
            print("\nEvidence References:")
            for ev in result.evidence:
                print(f"  - Source: {ev.source} | Chunk: {ev.chunk}")

        if result.errors:
            print("\nErrors:")
            for err in result.errors:
                print(f"  - {err}")

    else:
        print("[i] No image provided. Running self-test with sample mock payload...")
        print("    To test a real image, pass: python backend/agents/visual_agent/visual_agent.py --image path/to/photo.jpg\n")
        
        # Test rules extraction
        rules = agent.rules_engine.get_rules_for_agent("Visual Agent")
        print("[+] Injected Safety Rules:")
        print(rules)
        print("\n[+] Visual Agent is configured and ready.")

