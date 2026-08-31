import os
import base64
import json
import logging
from typing import Optional, Dict, Any, List, Union
import requests

logger = logging.getLogger("OllamaService")
logger.setLevel(logging.INFO)

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_VISION_MODEL = os.environ.get("OLLAMA_VISION_MODEL", "llava")
DEFAULT_TEXT_MODEL = os.environ.get("OLLAMA_TEXT_MODEL", "llama3:8b")


class OllamaServiceError(Exception):
    """Custom exception raised when communication with the Ollama service fails."""
    pass


class OllamaService:
    """
    Unified client for communicating with a local Ollama inference service.
    Reused across all agents (Orchestrator, RAG, Data, Visual, Report, Rules).
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        default_model: Optional[str] = None,
        timeout: float = 90.0,
    ):
        self.base_url = (base_url or OLLAMA_BASE_URL).rstrip("/")
        self.default_model = default_model or os.getenv("OLLAMA_MODEL", DEFAULT_TEXT_MODEL)
        self.timeout = timeout

    def is_available(self) -> bool:
        """Checks if the local Ollama service endpoint is reachable."""
        try:
            res = requests.get(f"{self.base_url}/api/tags", timeout=3.0)
            return res.status_code == 200
        except Exception:
            return False

    def is_healthy(self) -> bool:
        """Alias for is_available."""
        return self.is_available()

    def list_local_models(self) -> List[str]:
        """Returns list of installed local model names in Ollama."""
        try:
            resp = requests.get(f"{self.base_url}/api/tags", timeout=3.0)
            if resp.status_code == 200:
                data = resp.json()
                return [m.get("name", "") for m in data.get("models", [])]
            return []
        except Exception as e:
            logger.warning(f"Could not list Ollama models: {e}")
            return []

    @staticmethod
    def encode_image_file_to_base64(image_path: str) -> str:
        """Reads a local image file and returns its Base64 string."""
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file not found at path: {image_path}")

        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")

    @staticmethod
    def encode_image_bytes_to_base64(image_bytes: bytes) -> str:
        """Encodes raw bytes to a Base64 string."""
        return base64.b64encode(image_bytes).decode("utf-8")

    def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        system: Optional[str] = None,
        temperature: float = 0.0,
        stream: bool = False,
        format_json: bool = False,
    ) -> Dict[str, Any]:
        """
        Sends a completion generation request to the local Ollama API (/api/generate).
        """
        target_model = model or self.default_model
        endpoint = f"{self.base_url}/api/generate"

        payload: Dict[str, Any] = {
            "model": target_model,
            "prompt": prompt,
            "stream": stream,
            "options": {
                "temperature": temperature,
            },
        }

        if system:
            payload["system"] = system

        if format_json:
            payload["format"] = "json"

        try:
            res = requests.post(endpoint, json=payload, timeout=self.timeout)
            if res.status_code == 200:
                data = res.json()
                return {
                    "success": True,
                    "response": data.get("response", ""),
                    "model": target_model,
                    "error": None,
                }
            else:
                err_msg = f"Ollama API returned HTTP {res.status_code}: {res.text}"
                return {
                    "success": False,
                    "response": "",
                    "model": target_model,
                    "error": err_msg,
                }
        except requests.exceptions.ConnectionError:
            err_msg = f"Unable to connect to local Ollama service at '{self.base_url}'. Ensure Ollama is running ('ollama serve')."
            return {
                "success": False,
                "response": "",
                "model": target_model,
                "error": err_msg,
            }
        except requests.exceptions.Timeout:
            err_msg = f"Request to local Ollama service at '{self.base_url}' timed out after {self.timeout}s."
            return {
                "success": False,
                "response": "",
                "model": target_model,
                "error": err_msg,
            }
        except Exception as e:
            err_msg = f"Unexpected error during Ollama API call: {str(e)}"
            return {
                "success": False,
                "response": "",
                "model": target_model,
                "error": err_msg,
            }

    def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        format_json: bool = False,
        temperature: float = 0.3,
    ) -> Dict[str, Any]:
        """Convenience method for text generation with JSON format support."""
        return self.generate(
            prompt=prompt,
            model=model,
            system=system_prompt,
            temperature=temperature,
            format_json=format_json,
        )

    def generate_vision(
        self,
        prompt: str,
        images_base64: List[str],
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        format_json: bool = False,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        """
        Executes multimodal vision query on local Ollama instance with base64 images.
        """
        if not images_base64:
            raise ValueError("At least one base64 image must be provided for vision inference.")

        target_model = model or DEFAULT_VISION_MODEL
        endpoint = f"{self.base_url}/api/generate"

        payload: Dict[str, Any] = {
            "model": target_model,
            "prompt": prompt,
            "images": images_base64,
            "stream": False,
            "options": {
                "temperature": temperature,
            },
        }

        if system_prompt:
            payload["system"] = system_prompt

        if format_json:
            payload["format"] = "json"

        try:
            resp = requests.post(endpoint, json=payload, timeout=self.timeout)
            resp.raise_for_status()
            data = resp.json()
            return {
                "success": True,
                "response": data.get("response", ""),
                "model": data.get("model", target_model),
                "error": None,
            }
        except requests.exceptions.ConnectionError:
            err_msg = f"Cannot connect to Ollama at {self.base_url}. Ensure Ollama is running ('ollama serve')."
            return {"success": False, "error": err_msg, "response": ""}
        except requests.exceptions.Timeout:
            err_msg = f"Vision request timed out after {self.timeout}s."
            return {"success": False, "error": err_msg, "response": ""}
        except Exception as e:
            err_msg = f"Ollama vision request failed: {str(e)}"
            return {"success": False, "error": err_msg, "response": ""}


def generate_llm_completion(
    prompt: str,
    system_prompt: Optional[str] = None,
    model: Optional[str] = None,
) -> Dict[str, Any]:
    """Convenience function to perform a single completion request using default Ollama configurations."""
    client = OllamaService()
    return client.generate(prompt=prompt, system=system_prompt, model=model)
