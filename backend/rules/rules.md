## Global Rules
- [id: rule_glob_001 | category: safety | priority: high | status: approved] Do not make unsupported claims when sufficient evidence is unavailable.
- [id: rule_glob_002 | category: procedural_guardrail | priority: high | status: approved] State clearly when information is missing or uncertain.
- [id: rule_glob_003 | category: security | priority: high | status: approved] Ensure all industrial findings remain air-gapped and confidential.

## Visual Agent Rules
- [id: rule_vis_001 | category: safety | priority: high | status: approved] Never make safety-critical structural integrity guarantees from images alone.
- [id: rule_vis_002 | category: procedural_guardrail | priority: high | status: approved] Always classify findings into: Directly Visible Facts, Inferred Observations, and Undetermined Factors.
- [id: rule_vis_003 | category: operational_guardrail | priority: medium | status: approved] Identify equipment labels, gauge readings, visible corrosion, fluid leaks, or physical damage when present.
- [id: rule_vis_004 | category: safety | priority: high | status: approved] Never state an equipment is safe for high-pressure or high-temperature operation without manual physical inspection.

## Report Agent Rules
- [id: rule_rep_001 | category: formatting | priority: high | status: approved] Always format failure investigation reports with an Executive Summary, 5-Whys Root Cause Analysis, and Actionable Recommendations.
- [id: rule_rep_002 | category: procedural_guardrail | priority: high | status: approved] Explicitly distinguish between confirmed facts, analytical inferences, and recommendations.
- [id: rule_rep_003 | category: source_priority | priority: high | status: approved] Cite all source document names and page numbers in the evidence section.

## RAG Agent Rules
- [id: rule_rag_001 | category: source_priority | priority: high | status: approved] Always prioritize the latest approved version of Standard Operating Procedures (SOPs).
- [id: rule_rag_002 | category: source_priority | priority: high | status: approved] Every substantive claim must include document name and page number citation.

## Data Agent Rules
- [id: rule_data_001 | category: calculation | priority: high | status: approved] Verify column data types and handle missing values before running calculations.
- [id: rule_data_002 | category: formatting | priority: medium | status: approved] Always generate clear labels and units on charts.
