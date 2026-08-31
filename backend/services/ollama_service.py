import os
import requests
from typing import Optional, Dict, Any


class OllamaServiceError(Exception):
    """Custom exception raised when communication with the Ollama service fails."""
    pass


class OllamaService:
    """
    Generic client for communicating with a local Ollama inference service.
    Can be reused across all agents (Orchestrator, RAG, Data, Visual, etc.).
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        default_model: Optional[str] = None,
        timeout: float = 60.0
    ):
        """
        Initialize the Ollama service client.

        Args:
            base_url (Optional[str]): Base HTTP URL for local Ollama instance.
                                      Defaults to OLLAMA_BASE_URL env var or 'http://localhost:11434'.
            default_model (Optional[str]): Default LLM model name.
                                           Defaults to OLLAMA_MODEL env var or 'llama3:8b'.
            timeout (float): Request timeout in seconds (default: 60.0).
        """
        self.base_url = (base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")).rstrip("/")
        self.default_model = default_model or os.getenv("OLLAMA_MODEL", "llama3:8b")
        self.timeout = timeout

    def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        system: Optional[str] = None,
        temperature: float = 0.0,
        stream: bool = False
    ) -> Dict[str, Any]:
        """
        Sends a completion generation request to the local Ollama API (`/api/generate`).

        Args:
            prompt (str): Text prompt for the LLM.
            model (Optional[str]): Target model override. Uses self.default_model if None.
            system (Optional[str]): Optional system prompt/instructions.
            temperature (float): Sampling temperature (0.0 for deterministic output).
            stream (bool): Whether to stream responses (default False).

        Returns:
            Dict[str, Any]: Dictionary containing:
                - "success" (bool): True if request succeeded.
                - "response" (str): Model's generated text response.
                - "model" (str): Model used.
                - "error" (Optional[str]): Error message if success is False.
        """
        target_model = model or self.default_model
        endpoint = f"{self.base_url}/api/generate"

        payload: Dict[str, Any] = {
            "model": target_model,
            "prompt": prompt,
            "stream": stream,
            "options": {
                "temperature": temperature
            }
        }

        if system:
            payload["system"] = system

        try:
            res = requests.post(endpoint, json=payload, timeout=self.timeout)
            
            if res.status_code == 200:
                data = res.json()
                return {
                    "success": True,
                    "response": data.get("response", ""),
                    "model": target_model,
                    "error": None
                }
            else:
                err_msg = f"Ollama API returned HTTP {res.status_code}: {res.text}"
                return {
                    "success": False,
                    "response": "",
                    "model": target_model,
                    "error": err_msg
                }

        except requests.exceptions.ConnectionError:
            err_msg = f"Unable to connect to local Ollama service at '{self.base_url}'. Ensure Ollama is running (`ollama serve`)."
            return {
                "success": False,
                "response": "",
                "model": target_model,
                "error": err_msg
            }
        except requests.exceptions.Timeout:
            err_msg = f"Request to local Ollama service at '{self.base_url}' timed out after {self.timeout}s."
            return {
                "success": False,
                "response": "",
                "model": target_model,
                "error": err_msg
            }
        except Exception as e:
            err_msg = f"Unexpected error during Ollama API call: {str(e)}"
            return {
                "success": False,
                "response": "",
                "model": target_model,
                "error": err_msg
            }

    def is_healthy(self) -> bool:
        """
        Checks if the local Ollama service endpoint is reachable.

        Returns:
            bool: True if reachable, False otherwise.
        """
        try:
            res = requests.get(f"{self.base_url}/api/tags", timeout=5.0)
            return res.status_code == 200
        except Exception:
            return False


# Reusable helper function for simple completions
def generate_llm_completion(
    prompt: str,
    system_prompt: Optional[str] = None,
    model: Optional[str] = None
) -> Dict[str, Any]:
    """
    Convenience function to perform a single completion request using default Ollama configurations.
    """
    client = OllamaService()
    return client.generate(prompt=prompt, system=system_prompt, model=model)
