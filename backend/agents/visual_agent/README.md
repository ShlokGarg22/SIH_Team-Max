# Visual Agent

## Role
The "Eyes" of the system, responsible for inspecting photos of factory equipment, diagrams, or physical anomalies.

## Responsibilities
- Connects to a local multimodal model (e.g., LLaVA) via Ollama.
- Parses `multipart/form-data` image uploads.
- Describes the state of the equipment and identifies obvious visible defects (cracks, leaks, offline indicator lights).
- Strictly follows safety constraints: It describes what it sees but does *not* make safety-critical structural integrity guarantees.

## Inputs / Outputs
- **Input:** Image files (JPG/PNG) and a user prompt (e.g., "What is wrong with this pump?").
- **Output:** Structured findings detailing what is clearly visible and what is undetermined.
