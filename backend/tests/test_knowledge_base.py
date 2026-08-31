import os
import sys
import io
import shutil
import tempfile
import unittest

# Ensure backend and parent directories are in sys.path
_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.abspath(os.path.join(_current_dir, ".."))
_root_dir = os.path.abspath(os.path.join(_backend_dir, ".."))
for p in [_backend_dir, _root_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    import PyPDF2  # type: ignore
except ImportError:
    PyPDF2 = None  # type: ignore
from unittest.mock import MagicMock


try:
    from backend.services.vector_store import BM25Index, LocalVectorStore, tokenize
    from backend.knowledge_base.ingest import (
        chunk_document_pages,
        extract_pdf_pages,
        ingest_pdf_document,
        delete_ingested_document,
    )
    from backend.storage.db import (
        init_db,
        add_document_record,
        list_document_records,
        delete_document_record,
        update_document_status,
    )
except ImportError:
    from services.vector_store import BM25Index, LocalVectorStore, tokenize
    from knowledge_base.ingest import (
        chunk_document_pages,
        extract_pdf_pages,
        ingest_pdf_document,
        delete_ingested_document,
    )
    from storage.db import (
        init_db,
        add_document_record,
        list_document_records,
        delete_document_record,
        update_document_status,
    )


class TestKnowledgeBase(unittest.TestCase):
    """Unit and integration tests for BM25, ChromaDB Vector Store, PDF Ingestion, and DB tracking."""

    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.chroma_path = os.path.join(self.test_dir, "chroma")

    def tearDown(self):
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_bm25_tokenizer(self):
        """Verify alphanumeric preservation for industrial codes."""
        tokens = tokenize("Turbine P-101 tripped at 3.5 bar with ISO-10816 vibration.")
        self.assertIn("turbine", tokens)
        self.assertIn("p-101", tokens)
        self.assertIn("iso-10816", tokens)
        self.assertIn("vibration", tokens)

    def test_bm25_search_indexing(self):
        """Verify BM25 ranking on industrial keywords."""
        index = BM25Index()
        docs = [
            "Standard operating procedure for centrifugal Pump P-101 maintenance.",
            "Emergency shutdown protocol for gas turbine generator GT-402.",
            "Inspection checklist for control Valve V-405 and pressure gaskets."
        ]
        doc_ids = ["doc1", "doc2", "doc3"]
        index.fit(docs, doc_ids)

        # Query for exact pump ID
        results = index.search("P-101 centrifugal", top_k=2)
        self.assertGreater(len(results), 0)
        self.assertEqual(results[0][0], "doc1")

        # Query for valve
        results_valve = index.search("Valve V-405", top_k=2)
        self.assertGreater(len(results_valve), 0)
        self.assertEqual(results_valve[0][0], "doc3")

    def test_chunk_document_pages(self):
        """Verify page tracking and chunk attribution."""
        pages = [
            {"page": 1, "text": "This is page one discussing Pump P-101 startup procedures in refinery unit 2."},
            {"page": 2, "text": "This is page two detailing vibration tolerances and emergency trip limits."}
        ]
        chunks, metadatas, chunk_ids = chunk_document_pages(
            pages_data=pages,
            filename="SOP-Pump-01.pdf",
            chunk_size=100,
            chunk_overlap=20
        )

        self.assertGreaterEqual(len(chunks), 2)
        self.assertEqual(len(metadatas), len(chunks))
        self.assertEqual(metadatas[0]["filename"], "SOP-Pump-01.pdf")
        self.assertEqual(metadatas[0]["page"], 1)
        self.assertTrue(any(m["page"] == 2 for m in metadatas))

    def test_local_vector_store_hybrid_search(self):
        """Test LocalVectorStore indexing and hybrid retrieval."""
        vstore = LocalVectorStore(persist_directory=self.chroma_path)
        
        chunks = [
            "Routine lubrication procedure for centrifugal Pump P-101 bearing housing.",
            "Boiler B-202 safety relief valve calibration protocol.",
            "Chemical compatibility standards for Viton vs EPDM flange gaskets in CDU feed."
        ]
        metadatas = [
            {"filename": "SOP-Pumps.pdf", "page": 4},
            {"filename": "SOP-Boiler.pdf", "page": 12},
            {"filename": "SOP-Gaskets.pdf", "page": 7}
        ]

        indexed = vstore.add_chunks(chunks=chunks, metadatas=metadatas)
        self.assertEqual(indexed, 3)

        # Hybrid query
        results = vstore.hybrid_search("Pump P-101 lubrication", top_k=2, alpha=0.5)
        self.assertGreater(len(results), 0)
        self.assertEqual(results[0]["source"], "SOP-Pumps.pdf")
        self.assertEqual(results[0]["page"], 4)
        self.assertIn("Pump P-101", results[0]["text"])

    def test_vector_store_deletion(self):
        """Verify purging chunks by filename."""
        vstore = LocalVectorStore(persist_directory=self.chroma_path)
        
        chunks = ["Procedure A for Pump P-101", "Procedure B for Boiler 2"]
        metadatas = [{"filename": "FileA.pdf", "page": 1}, {"filename": "FileB.pdf", "page": 2}]
        vstore.add_chunks(chunks, metadatas)

        stats_before = vstore.get_stats()
        self.assertGreaterEqual(stats_before["total_chunks"], 2)

        # Delete FileA
        purged = vstore.delete_by_filename("FileA.pdf")
        self.assertEqual(purged, 1)

        # Search should no longer return FileA
        res = vstore.hybrid_search("Procedure A", top_k=5)
        sources = [r["source"] for r in res]
        self.assertNotIn("FileA.pdf", sources)

    def test_sqlite_document_record_operations(self):
        """Verify SQLite Document table CRUD operations."""
        init_db()
        
        doc = add_document_record(
            filename="Test-SOP-2026.pdf",
            file_path="/tmp/Test-SOP-2026.pdf",
            status="pending"
        )
        self.assertEqual(doc.filename, "Test-SOP-2026.pdf")
        self.assertEqual(doc.status, "pending")

        update_document_status("Test-SOP-2026.pdf", "indexed")
        
        all_docs = list_document_records()
        found = [d for d in all_docs if d["filename"] == "Test-SOP-2026.pdf"]
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0]["status"], "indexed")

        # Clean up
        deleted = delete_document_record("Test-SOP-2026.pdf")
        self.assertTrue(deleted)


if __name__ == "__main__":
    unittest.main()
