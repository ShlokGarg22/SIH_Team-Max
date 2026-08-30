# Deep Research Agent

## Role
The "Detective" responsible for autonomous, multi-step investigations that require looping logic.

## Responsibilities
- Powered by a LangGraph state machine.
- Maintains a persistent `ResearchState` in the SQLite database to survive system restarts.
- Autonomously decides which specialist agents to call in sequence (e.g., call Visual Agent, then take output to call RAG Agent, then call Data Agent).
- **Human-in-the-Loop:** Automatically pauses execution if critical context is missing, asks the user for clarification, and resumes the loop once the user answers.

## Inputs / Outputs
- **Input:** High-level, complex tasks (e.g., "Perform a full Root Cause Analysis on yesterday's Boiler 3 failure").
- **Output:** Real-time state updates streamed via SSE, followed by a comprehensive final report.
