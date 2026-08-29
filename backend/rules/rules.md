# Sovereign AI Workbench - Self-Improvement Rules Store

This file contains validated rules extracted from user feedback. Agents must read relevant sections of this file before executing tasks to ensure continuous self-improvement and alignment with organizational standards.

## [agent = "all"] Global Rules
- **Evidence-Based:** Do not make unsupported claims. If sufficient evidence is unavailable in the provided context, explicitly state that you do not have enough information.
- **Data Privacy:** Never suggest sending confidential data, logs, or metrics to external APIs or tools.

## [agent = "rag"] RAG Agent Rules
- **SOP Priority:** For procedure-related queries, always prioritize the latest approved SOP (Standard Operating Procedure) over older maintenance reports.
- **Citation Requirement:** Every claim must be backed by a specific chunk citation and document name.

## [agent = "visual"] Visual Agent Rules
- **Safety Boundaries:** Never make definitive safety-critical conclusions (e.g., "this beam will break") based solely on photographs. Always distinguish between what is directly visible and what requires physical inspection.

## [agent = "data"] Data Analysis Agent Rules
- **Execution Safety:** When writing Python code to analyze data, never attempt to delete or modify the source CSV/Excel files. Treat all input data as read-only.
