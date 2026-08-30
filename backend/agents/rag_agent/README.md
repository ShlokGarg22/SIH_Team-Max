# RAG (Retrieval-Augmented Generation) Agent

## Role
The "Librarian" of the system, responsible for querying and synthesizing knowledge from standard operating procedures (SOPs).

## Responsibilities
- Takes the user's query and performs a Hybrid Search (Vector Semantic + BM25 Keyword) against ChromaDB.
- Retrieves the top-k most relevant chunks from ingested PDFs.
- Injects those chunks into the local LLM's prompt to generate a grounded, hallucination-free answer.
- Attaches strict metadata citations (filename, page number) to the final output.

## Inputs / Outputs
- **Input:** Specific technical questions about factory procedures, machinery limits, or safety protocols.
- **Output:** A natural language answer grounded in retrieved text, accompanied by citation metadata.
