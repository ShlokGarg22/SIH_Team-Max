You are a senior AI architect, full-stack engineer, and AI agent systems engineer.

Help me design and build a production-quality prototype for the following project:

"Sovereign On-Premise Agentic AI Workbench using Open-Weight Multimodal LLMs for Confidential Industrial Work"

The target use case is an industrial organization such as Mangalore Refinery and Petrochemicals Limited (MRPL).

IMPORTANT PROJECT REQUIREMENTS:

The system must be designed as a sovereign, on-premise AI platform.

The architecture should support:

- Open-weight LLMs
- Local model inference
- No dependency on external LLM APIs
- Confidential organizational data remaining inside company infrastructure
- Modular multi-agent architecture
- Easy replacement of models and infrastructure components

The project should NOT be designed as a simple chatbot.

It should be an AI Workbench where different specialized agents can perform different types of work.

====================================================
CORE SYSTEM ARCHITECTURE
====================================================

The system has the following components:

1. Orchestrator Agent
2. Visual Agent
3. RAG Agent with Citations
4. Data Analysis Agent
5. Report Generation Agent
6. Deep Research Mode
7. Shared Self-Improvement Rules System

Do not unnecessarily add more agents.

Keep the architecture clean and modular.

====================================================
1. ORCHESTRATOR AGENT
====================================================

The Orchestrator Agent handles normal conversation.

The user interacts with the AI Workbench through a chat interface.

The Orchestrator analyzes the user's request and decides which specialized agent should handle it.

Examples:

Image-related task
→ Visual Agent

Question about internal company documents
→ RAG Agent

CSV / Excel / structured dataset
→ Data Analysis Agent

Request to create a structured report
→ Report Generation Agent

The Orchestrator should support routing to one or multiple agents when required.

The Orchestrator should NOT use Deep Research Mode automatically.

Deep Research Mode is explicitly triggered by the user.

Normal flow:

User
↓
Orchestrator Agent
↓
Select Appropriate Agent
↓
Agent Performs Task
↓
Return Result to User

====================================================
2. VISUAL AGENT
====================================================

The Visual Agent handles visual information.

Input may include:

- Equipment photographs
- Industrial images
- Engineering-related images
- Scanned visual documents
- Charts
- Diagrams

The Visual Agent should use a locally hosted multimodal model.

Its responsibility is to understand the image and return structured findings.

Example:

User uploads an image of industrial equipment.

The Visual Agent can provide:

- What is visible
- Important components
- Potential observations
- Visible anomalies
- Extracted information

The Visual Agent should NOT make unsupported safety-critical conclusions.

It should clearly distinguish between:

- What is directly visible
- What is inferred
- What cannot be determined from the image

====================================================
3. RAG AGENT WITH CITATIONS
====================================================

The RAG Agent answers questions using internal organizational knowledge.

Supported knowledge sources may include:

- PDFs
- SOPs
- Technical manuals
- Maintenance reports
- Historical documents
- Internal reports

The RAG Agent should follow this pipeline:

User Query
↓
Query Understanding
↓
Retrieve Relevant Documents
↓
Retrieve Relevant Chunks
↓
Provide Context to LLM
↓
Generate Grounded Answer
↓
Return Answer with Citations

Every important answer should include citations showing:

- Source document
- Relevant page
- Relevant section or chunk

The system should avoid unsupported claims.

If sufficient information is not available, the agent should explicitly say:

"Insufficient information found in the available knowledge base."

Do not fabricate answers.

====================================================
4. DATA ANALYSIS AGENT
====================================================

The Data Analysis Agent handles structured data.

Supported inputs:

- CSV
- Excel
- Tabular datasets

The user should be able to ask questions in natural language.

Examples:

"Find unusual patterns in this data."

"Analyze the last six months."

"Find anomalies."

"Compare the performance of these two periods."

The Data Analysis Agent should:

1. Understand the user's analysis request
2. Inspect the dataset
3. Determine the required analysis
4. Perform calculations
5. Generate useful insights
6. Create charts when appropriate
7. Return findings clearly

The system should support safe code execution for data analysis.

The agent should be able to use Python for calculations and analysis inside a controlled environment.

====================================================
5. REPORT GENERATION AGENT
====================================================

The Report Generation Agent converts findings into structured professional reports.

It can receive findings from:

- RAG Agent
- Visual Agent
- Data Analysis Agent
- Deep Research Mode

The Report Agent should generate structured reports.

Example structure:

Title

Executive Summary

Problem / Objective

Findings

Evidence

Analysis

Conclusion

Recommendations

Sources

The report should clearly distinguish between:

- Confirmed information
- Analysis
- Inference
- Recommendations

The report should not invent information.

====================================================
6. DEEP RESEARCH MODE
====================================================

Deep Research Mode is separate from normal conversation.

The user explicitly triggers Deep Research Mode through the UI.

Example:

Normal Chat Mode

[ Chat ]

[ 🔬 Deep Research ]

Deep Research Mode is designed for complex investigations.

The Deep Research Agent has three major powers:

1. It can loop and continue researching.
2. It can ask the user clarifying questions.
3. It can use the other specialized agents.

Deep Research should NOT follow:

Question
↓
One Search
↓
Answer

Instead, it should follow an iterative research loop.

CORE FLOW:

User Research Request
↓
Deep Research Agent
↓
Analyze Current Research State
↓
Need User Clarification?

YES
↓
Ask User a Question
↓
Receive User Answer
↓
Update Research State
↓
Continue Research

NO
↓
Determine What Information Is Needed
↓
Call Required Agent(s)

Possible agents:

Visual Agent

RAG Agent

Data Analysis Agent

↓
Collect Findings
↓
Analyze Findings
↓
Is Research Complete?

NO
↓
Loop Again

YES
↓
Generate Final Research Result
↓
Optional Report Generation

The Deep Research Agent should be able to ask questions DURING research, not only before research begins.

Example:

User:
"Investigate why Pump P-101 failed."

Deep Research Agent:
"Which failure period would you like me to investigate?"

User provides answer.

The agent starts research.

During research, it discovers two relevant incidents.

The agent can ask:

"I found two major incidents involving Pump P-101. Should I focus on the latest incident or compare both?"

The user answers.

The Deep Research Agent continues from its existing research state.

IMPORTANT:

Deep Research must maintain persistent research state.

Example research state:

research_id

research_goal

user_context

known_information

missing_information

questions_asked

agent_tasks_completed

findings

evidence

current_hypotheses

research_status

The Deep Research Agent should not forget previous findings while looping.

The Deep Research Agent should support the following actions:

ASK_USER

CALL_AGENT

ANALYZE_FINDINGS

CONTINUE_RESEARCH

FINALIZE

The agent should use structured outputs for these decisions.

Example:

{
  "action": "ASK_USER",
  "question": "Which failure period should I investigate?"
}

Example:

{
  "action": "CALL_AGENT",
  "agent": "rag_agent",
  "task": "Find maintenance and failure reports related to Pump P-101."
}

Example:

{
  "action": "CONTINUE_RESEARCH",
  "reason": "More evidence is required to determine the cause."
}

Example:

{
  "action": "FINALIZE",
  "reason": "Sufficient evidence has been collected."
}

====================================================
7. SELF-IMPROVEMENT THROUGH USER FEEDBACK
====================================================

The system should include a shared self-improvement layer.

This should NOT retrain the LLM.

Instead, the system learns from user corrections by storing validated rules.

Example:

The RAG Agent gives an incorrect answer.

User says:

"For procedure-related questions, always prioritize the latest approved SOP."

The system identifies this as a potentially useful reusable rule.

The rule is stored in a shared Rules Store.

Example structure:

{
  "id": "rule_001",
  "agent": "rag",
  "category": "source_priority",
  "rule": "Always prioritize the latest approved SOP for procedure-related questions.",
  "status": "approved",
  "priority": "high"
}

Before an agent performs a task, it should retrieve relevant rules.

The rules can apply to:

- A specific agent
- A specific task type
- All agents

Example:

agent = "rag"

rule:
"Prioritize the latest approved SOP."

Example:

agent = "all"

rule:
"Do not make unsupported claims when sufficient evidence is unavailable."

IMPORTANT SECURITY REQUIREMENT:

Do not automatically allow every user correction to become a permanent rule.

The system should support:

User Feedback
↓
Rule Extraction
↓
Validation
↓
Proposed Rule
↓
Optional Admin Approval
↓
Approved Rule
↓
Used by Relevant Agents

The prototype may implement the Rules Store using:

- JSON file initially

Later it should be easily replaceable with:

- PostgreSQL
- SQLite
- Other database

====================================================
SYSTEM COMMUNICATION
====================================================

All agents should communicate using structured messages.

Each agent response should contain:

task_id

agent_name

status

findings

evidence

confidence

errors

Example:

{
  "task_id": "task_123",
  "agent_name": "rag_agent",
  "status": "completed",
  "findings": [],
  "evidence": [],
  "confidence": 0.85,
  "errors": []
}

Agents should not directly manipulate each other's internal state.

The Orchestrator or Deep Research Agent should manage coordination.

====================================================
FRONTEND REQUIREMENTS
====================================================

Create a modern AI Workbench interface.

Main features:

1. Chat Interface

Normal AI conversation.

2. Deep Research Toggle

User can explicitly activate:

🔬 Deep Research Mode

3. File Upload

Support:

Images

PDFs

CSV

Excel

4. Agent Activity Display

Show the user which agent is currently working.

Example:

🟢 RAG Agent — Searching documents

🟢 Data Analysis Agent — Analyzing dataset

🟡 Deep Research — Waiting for clarification

5. Citations

Users should be able to see the source supporting RAG answers.

6. Research Progress

During Deep Research, show:

Research Goal

Current Step

Agents Used

Findings Collected

Questions Asked

Research Status

7. Feedback System

Allow users to:

👍 Correct

👎 Incorrect

Provide feedback

Suggest corrections

====================================================
BACKEND REQUIREMENTS
====================================================

Use a modular architecture.

Suggested structure:

backend/

    api/

    agents/
        orchestrator/
        visual_agent/
        rag_agent/
        data_agent/
        report_agent/
        deep_research/

    services/

    models/

    schemas/

    rules/

    knowledge_base/

    storage/

    utils/

The API should expose separate endpoints/services for:

Chat

Deep Research

File Upload

Agent Execution

Feedback

Rules

Report Generation

====================================================
LOCAL AI INFRASTRUCTURE
====================================================

The architecture should support locally hosted models.

Keep model serving abstracted behind a Model Provider interface.

Example:

ModelProvider

↓

LocalModelProvider

↓

vLLM / Ollama / other local inference engine

This allows the underlying model infrastructure to be changed without rewriting the agents.

Support separate models for:

Text reasoning

Multimodal understanding

Embeddings

====================================================
IMPORTANT DESIGN PRINCIPLES
====================================================

1. Do not create unnecessary agents.

2. Keep each agent focused on one responsibility.

3. Deep Research is the only component that performs iterative research loops.

4. Deep Research is explicitly triggered by the user.

5. Normal conversation should be fast and direct.

6. Agents should return structured results.

7. Maintain clear separation between:

Agent logic

Model inference

Storage

Retrieval

Frontend

8. Avoid hallucinations.

9. Show evidence where possible.

10. Keep the system modular and scalable.

====================================================
FINAL EXPECTED SYSTEM FLOW
====================================================

NORMAL MODE:

User
↓
Orchestrator
↓
Select Agent
↓
Visual / RAG / Data / Report Agent
↓
Response


DEEP RESEARCH MODE:

User explicitly activates Deep Research
↓
Deep Research Agent
↓
Analyze Research State
↓
Ask User if clarification is required
↓
Use appropriate agents
↓
Collect findings
↓
Analyze findings
↓
Loop if more research is required
↓
Ask user again if necessary
↓
Finalize
↓
Optional Report Generation


SELF-IMPROVEMENT:

User Feedback
↓
Extract Potential Rule
↓
Validate Rule
↓
Store in Rules Store
↓
Relevant Agents Read Rules
↓
Improved Future Behavior


YOUR TASK:

Help me build this project step by step.

Do not generate the entire application blindly.

First:

1. Analyze the complete architecture.
2. Identify the best technology stack.
3. Design the folder structure.
4. Define communication contracts between agents.
5. Design the database/schema.
6. Design the Deep Research state machine.
7. Then provide an implementation roadmap.

After that, we will implement the project component by component.

Always prioritize:

Simple architecture

Modularity

Clear agent responsibilities

Local deployment

A working SIH prototype

A strong live demonstration