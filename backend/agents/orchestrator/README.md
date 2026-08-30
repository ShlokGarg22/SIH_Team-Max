# Orchestrator Agent

## Role
The Orchestrator is the "Manager" or "Traffic Cop" of the multi-agent system. 

## Responsibilities
- Receives the raw user input from the chat API.
- Performs Intent Classification (using a local LLM).
- Routes the query to the correct specialized agent (e.g., RAG Agent for manuals, Data Agent for CSVs, Visual Agent for images).
- Does NOT answer technical questions directly. It delegates tasks.

## Inputs / Outputs
- **Input:** User query strings and/or file attachments.
- **Output:** Structured JSON containing the routing decision and the target agent name.
