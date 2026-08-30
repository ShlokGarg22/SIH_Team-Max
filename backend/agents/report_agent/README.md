# Report Generation Agent

## Role
The "Synthesizer" responsible for formatting raw JSON findings into professional, ISO-compliant documents.

## Responsibilities
- Gathers the raw JSON outputs produced by the RAG, Data, and Visual agents.
- Formats the combined data into a structured Markdown or HTML report.
- Organizes output into specific sections: Executive Summary, Root Cause (e.g., 5 Whys), Evidence, Analysis, and Recommendations.

## Inputs / Outputs
- **Input:** Array of JSON findings from multiple agents.
- **Output:** A highly formatted, human-readable markdown string ready for frontend rendering or PDF export.
