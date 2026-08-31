import os
import sys
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
    from backend.services.vector_store import LocalVectorStore
    from backend.agents.rag_agent.rag_agent import RAGAgent, INSUFFICIENT_INFO_MESSAGE
    from backend.schemas.agent import AgentRequest, AgentResponse, Evidence
    from backend.agents.orchestrator.router import Orchestrator
except ImportError:
    from rules.engine import RulesEngine
    from services.ollama_service import OllamaService
    from services.vector_store import LocalVectorStore
    from agents.rag_agent.rag_agent import RAGAgent, INSUFFICIENT_INFO_MESSAGE
    from schemas.agent import AgentRequest, AgentResponse, Evidence
    from agents.orchestrator.router import Orchestrator


class TestRAGAgent(unittest.TestCase):
    """Unit and integration tests for RAG Agent pipeline."""

    def test_rag_rules_engine_injection(self):
        """Verify that RAG Agent and Global rules are extracted from rules.md correctly."""
        engine = RulesEngine()
        rules = engine.get_rules_for_agent("RAG Agent", include_global=True)
        
        self.assertTrue("global rules" in rules.lower())
        self.assertTrue("rag agent rules" in rules.lower())
        self.assertTrue("prioritize the latest approved" in rules.lower() or "sop" in rules.lower())


    def test_rag_system_prompt_builder(self):
        """Verify system prompt enforces industrial precision, strict citations, and injected rules."""
        agent = RAGAgent()
        rules_text = "Rule 1: Always check seal compatibility."
        prompt = agent.build_system_prompt(rules_text)
        
        self.assertIn("Librarian", prompt)
        self.assertIn("GROUNDED REASONING", prompt)
        self.assertIn("STRICT CITATIONS", prompt)
        self.assertIn("Rule 1: Always check seal compatibility.", prompt)

    def test_rag_query_with_grounded_answer(self):
        """Test full RAG query flow with mock vector retrieval and mock LLM generation."""
        mock_vector_store = MagicMock(spec=LocalVectorStore)
        mock_ollama_service = MagicMock(spec=OllamaService)

        mock_vector_store.hybrid_search.return_value = [
            {
                "id": "chunk_1",
                "text": "For Centrifugal Pump P-101, minimum operating suction pressure is 1.2 bar and maximum allowable vibration is 4.5 mm/s RMS.",
                "source": "SOP-MRPL-MEC-042.pdf",
                "page": 18,
                "score": 0.92,
                "vector_score": 0.90,
                "bm25_score": 0.94,
            }
        ]

        mock_ollama_service.generate_text.return_value = {
            "success": True,
            "response": "According to the procedure, Pump P-101 requires a minimum suction pressure of 1.2 bar and must not exceed 4.5 mm/s RMS vibration. [Source: SOP-MRPL-MEC-042.pdf | Page: 18]",
            "error": None
        }

        agent = RAGAgent(
            vector_store=mock_vector_store,
            ollama_service=mock_ollama_service,
        )

        response = agent.query("What is the maximum vibration limit for Pump P-101?")

        self.assertIsInstance(response, AgentResponse)
        self.assertEqual(response.status, "completed")
        self.assertEqual(response.agent_name, "rag_agent")
        self.assertEqual(len(response.findings), 1)
        self.assertIn("1.2 bar", response.findings[0])
        self.assertEqual(len(response.evidence), 1)
        self.assertEqual(response.evidence[0].source, "SOP-MRPL-MEC-042.pdf")
        self.assertEqual(response.evidence[0].page, 18)
        self.assertGreater(response.confidence, 0.8)

    def test_rag_insufficient_info_guardrail(self):
        """Test anti-hallucination guardrail when no relevant chunks exist in knowledge base."""
        mock_vector_store = MagicMock(spec=LocalVectorStore)
        mock_ollama_service = MagicMock(spec=OllamaService)

        # No matches found
        mock_vector_store.hybrid_search.return_value = []

        agent = RAGAgent(
            vector_store=mock_vector_store,
            ollama_service=mock_ollama_service,
        )

        response = agent.query("What is the protocol for nuclear reactor shutdown?")

        self.assertEqual(response.status, "completed")
        self.assertEqual(len(response.findings), 1)
        self.assertEqual(response.findings[0], INSUFFICIENT_INFO_MESSAGE)
        self.assertEqual(len(response.evidence), 0)
        self.assertEqual(response.confidence, 0.0)

    def test_rag_process_request_contract(self):
        """Test standardized AgentRequest contract handling."""
        mock_vector_store = MagicMock(spec=LocalVectorStore)
        mock_ollama_service = MagicMock(spec=OllamaService)

        mock_vector_store.hybrid_search.return_value = [
            {
                "id": "c1",
                "text": "Valve V-405 torque specification is 150 Nm.",
                "source": "SOP-Valves.pdf",
                "page": 5,
                "score": 0.88,
            }
        ]
        mock_ollama_service.generate_text.return_value = {
            "success": True,
            "response": "Valve V-405 requires 150 Nm torque. [Source: SOP-Valves.pdf | Page: 5]",
            "error": None
        }

        agent = RAGAgent(
            vector_store=mock_vector_store,
            ollama_service=mock_ollama_service,
        )

        req = AgentRequest(
            task_id="task_test_123",
            session_id="session_test_456",
            agent_target="rag_agent",
            payload={
                "query": "What is the torque for Valve V-405?",
                "hybrid_search": True
            }
        )

        response = agent.process_request(req)
        self.assertEqual(response.task_id, "task_test_123")
        self.assertEqual(response.agent_name, "rag_agent")
        self.assertEqual(response.status, "completed")
        self.assertEqual(len(response.evidence), 1)
        self.assertEqual(response.evidence[0].source, "SOP-Valves.pdf")

    def test_orchestrator_routes_to_rag(self):
        """Verify central Orchestrator properly routes RAG requests to RAGAgent."""
        mock_vector_store = MagicMock(spec=LocalVectorStore)
        mock_ollama_service = MagicMock(spec=OllamaService)

        orch = Orchestrator()
        orch.rag_agent.vector_store = mock_vector_store
        orch.rag_agent.ollama_service = mock_ollama_service

        mock_vector_store.hybrid_search.return_value = [
            {
                "id": "c1",
                "text": "Start auxiliary lube oil pump prior to main turbine roll.",
                "source": "SOP-Turbine.pdf",
                "page": 2,
                "score": 0.95,
            }
        ]
        mock_ollama_service.generate_text.return_value = {
            "success": True,
            "response": "Start the auxiliary lube oil pump before rolling the main turbine. [Source: SOP-Turbine.pdf | Page: 2]",
            "error": None
        }

        req = AgentRequest(
            task_id="task_orch_rag",
            session_id="session_orch",
            agent_target="rag_agent",
            payload={"query": "How to start turbine lube pump?"}
        )

        res = orch.route_request(req)
        self.assertEqual(res.agent_name, "rag_agent")
        self.assertEqual(res.status, "completed")
        self.assertEqual(len(res.evidence), 1)


if __name__ == "__main__":
    unittest.main()
