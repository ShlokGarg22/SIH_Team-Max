import os
import re
import math
import logging
from typing import List, Dict, Any, Optional, Tuple
from collections import Counter

logger = logging.getLogger("VectorStore")
logger.setLevel(logging.INFO)

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DEFAULT_CHROMA_DIR = os.path.join(BACKEND_DIR, "data", "chroma")
COLLECTION_NAME = "industrial_knowledge_base"


# -----------------------------------------------------------------------------
# 1. Pure-Python Fast BM25 Keyword Search Engine
# -----------------------------------------------------------------------------

def tokenize(text: str) -> List[str]:
    """Tokenizes text preserving alphanumeric industrial identifiers (e.g. p-101, v-405, iso-10816)."""
    if not text:
        return []
    # Replace non-alphanumeric (except dashes/underscores) with space
    cleaned = re.sub(r"[^a-zA-Z0-9\-_]", " ", text.lower())
    tokens = [t.strip("-_") for t in cleaned.split() if t.strip("-_")]
    return [t for t in tokens if len(t) > 1]


class BM25Index:
    """
    In-memory BM25Okapi implementation for fast, exact keyword retrieval
    over industrial equipment codes and standard numbers.
    """

    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.corpus: List[List[str]] = []
        self.doc_ids: List[str] = []
        self.doc_len: List[int] = []
        self.avgdl: float = 0.0
        self.doc_freqs: List[Dict[str, int]] = []
        self.idf: Dict[str, float] = {}
        self.corpus_size: int = 0

    def fit(self, documents: List[str], doc_ids: List[str]):
        """Builds the BM25 inverted index from a list of document chunk strings."""
        self.corpus = [tokenize(doc) for doc in documents]
        self.doc_ids = list(doc_ids)
        self.corpus_size = len(self.corpus)
        if self.corpus_size == 0:
            self.avgdl = 0.0
            self.doc_len = []
            self.doc_freqs = []
            self.idf = {}
            return

        self.doc_len = [len(doc) for doc in self.corpus]
        self.avgdl = sum(self.doc_len) / self.corpus_size
        self.doc_freqs = [Counter(doc) for doc in self.corpus]

        # Calculate Inverse Document Frequency (IDF)
        df_counts: Dict[str, int] = {}
        for doc in self.corpus:
            for word in set(doc):
                df_counts[word] = df_counts.get(word, 0) + 1

        self.idf = {}
        for word, freq in df_counts.items():
            # BM25 standard smoothed IDF formula
            self.idf[word] = math.log(1.0 + (self.corpus_size - freq + 0.5) / (freq + 0.5))

    def search(self, query: str, top_k: int = 5) -> List[Tuple[str, float]]:
        """
        Computes BM25 score for query against all documents.
        Returns list of (doc_id, score) tuples sorted by descending score.
        """
        if self.corpus_size == 0:
            return []

        query_tokens = tokenize(query)
        if not query_tokens:
            return []

        scores: List[float] = [0.0] * self.corpus_size

        for token in query_tokens:
            if token not in self.idf:
                continue
            idf_val = self.idf[token]
            for idx, doc_freq in enumerate(self.doc_freqs):
                tf = doc_freq.get(token, 0)
                if tf == 0:
                    continue
                doc_l = self.doc_len[idx]
                numerator = tf * (self.k1 + 1.0)
                denominator = tf + self.k1 * (1.0 - self.b + self.b * (doc_l / (self.avgdl or 1.0)))
                scores[idx] += idf_val * (numerator / denominator)

        # Rank documents
        ranked = [(self.doc_ids[i], scores[i]) for i in range(self.corpus_size) if scores[i] > 0.0]
        ranked.sort(key=lambda x: x[1], reverse=True)
        return ranked[:top_k]


# -----------------------------------------------------------------------------
# 2. Local ChromaDB Vector Store & Hybrid Search Service
# -----------------------------------------------------------------------------

class _InMemoryFallbackCollection:
    """Lightweight in-memory document store used when ChromaDB is unavailable."""
    def __init__(self):
        self._data: Dict[str, Dict[str, Any]] = {}

    def count(self) -> int:
        return len(self._data)

    def get(self, ids=None, include=None, where=None) -> Dict[str, Any]:
        docs, metas, matched_ids = [], [], []
        target_ids = set(ids) if ids is not None else None
        for cid, val in self._data.items():
            if target_ids is not None and cid not in target_ids:
                continue
            if where and "filename" in where and val["metadata"].get("filename") != where["filename"]:
                continue
            matched_ids.append(cid)
            docs.append(val["document"])
            metas.append(val["metadata"])
        return {"ids": matched_ids, "documents": docs, "metadatas": metas}


    def upsert(self, ids, documents, metadatas=None, embeddings=None):
        metas = metadatas or [{} for _ in ids]
        embeds = embeddings or [None for _ in ids]
        for cid, doc, meta, emb in zip(ids, documents, metas, embeds):
            self._data[cid] = {"document": doc, "metadata": meta, "embedding": emb}

    def query(self, query_texts=None, query_embeddings=None, n_results=5, where=None, include=None) -> Dict[str, Any]:
        res = self.get(where=where)
        limit = min(n_results, len(res["ids"]))
        return {
            "ids": [res["ids"][:limit]],
            "documents": [res["documents"][:limit]],
            "metadatas": [res["metadatas"][:limit]],
            "distances": [[0.1] * limit],
        }

    def delete(self, ids=None, where=None):
        if ids:
            for cid in ids:
                self._data.pop(cid, None)
            return
        if not where:
            self._data.clear()
            return
        if "filename" in where:
            fn = where["filename"]
            to_del = [cid for cid, v in self._data.items() if v["metadata"].get("filename") == fn]
            for cid in to_del:
                self._data.pop(cid, None)



class LocalVectorStore:
    """
    On-Premise Hybrid Vector Store backed by local ChromaDB and in-memory BM25.
    Combines dense semantic embeddings with sparse keyword matching.
    """
    _instance = None
    _embed_model = None

    def __init__(self, persist_directory: Optional[str] = None):
        self.persist_directory = persist_directory or DEFAULT_CHROMA_DIR
        os.makedirs(self.persist_directory, exist_ok=True)
        
        self.bm25 = BM25Index()
        self._init_chromadb()
        self._sync_bm25_index()

    def _init_chromadb(self):
        """Initializes persistent ChromaDB client."""
        try:
            import chromadb  # type: ignore
            from chromadb.config import Settings  # type: ignore
            
            self.client = chromadb.PersistentClient(
                path=self.persist_directory,
                settings=Settings(anonymized_telemetry=False)
            )
            self.collection = self.client.get_or_create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )
            logger.info(f"ChromaDB persistent collection '{COLLECTION_NAME}' loaded at {self.persist_directory}")
        except Exception as e:
            logger.warning(f"ChromaDB not available in current environment: {e}. Vector search operations will use mock/fallback.")
            self.client = None
            self.collection = _InMemoryFallbackCollection()


    @classmethod
    def get_embedding_function(cls):
        """
        Loads the SentenceTransformer embedding model once for CPU execution.
        Falls back gracefully if sentence_transformers is initializing.
        """
        if cls._embed_model is None:
            try:
                from sentence_transformers import SentenceTransformer  # type: ignore
                cls._embed_model = SentenceTransformer("all-MiniLM-L6-v2")
                logger.info("SentenceTransformer model 'all-MiniLM-L6-v2' initialized on CPU.")
            except Exception as e:
                logger.warning(f"SentenceTransformer not loaded directly: {e}. Falling back to default embeddings.")
                cls._embed_model = None
        return cls._embed_model


    def compute_embeddings(self, texts: List[str]) -> Optional[List[List[float]]]:
        """Computes dense vector embeddings for input text strings."""
        model = self.get_embedding_function()
        if model is not None and texts:
            try:
                embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
                return embeddings.tolist()
            except Exception as e:
                logger.warning(f"Error computing SentenceTransformer embeddings: {e}")
        return None

    def _sync_bm25_index(self):
        """Rebuilds the in-memory BM25 index from all documents currently in ChromaDB."""
        try:
            results = self.collection.get(include=["documents", "metadatas"])
            docs = results.get("documents", []) or []
            ids = results.get("ids", []) or []
            if docs and ids:
                self.bm25.fit(docs, ids)
                logger.info(f"BM25 index synchronized with {len(docs)} chunks from ChromaDB.")
            else:
                self.bm25 = BM25Index()
        except Exception as e:
            logger.warning(f"Could not synchronize BM25 index: {e}")

    def add_chunks(
        self,
        chunks: List[str],
        metadatas: List[Dict[str, Any]],
        ids: Optional[List[str]] = None,
    ) -> int:
        """
        Adds text chunks with metadata to ChromaDB and updates the BM25 keyword index.
        """
        if not chunks:
            return 0

        chunk_ids = ids or [f"chunk_{i}_{hash(chunks[i]) & 0xFFFFFFFF:08x}" for i in range(len(chunks))]
        
        # Format metadata (Chroma requires primitive types in metadata values)
        sanitized_metadatas = []
        for m in metadatas:
            clean_m = {}
            for k, v in m.items():
                if isinstance(v, (str, int, float, bool)):
                    clean_m[k] = v
                else:
                    clean_m[k] = str(v)
            sanitized_metadatas.append(clean_m)

        # Compute embeddings if model is available
        embeddings = self.compute_embeddings(chunks)

        if embeddings is not None:
            self.collection.upsert(
                ids=chunk_ids,
                documents=chunks,
                embeddings=embeddings,
                metadatas=sanitized_metadatas,
            )
        else:
            self.collection.upsert(
                ids=chunk_ids,
                documents=chunks,
                metadatas=sanitized_metadatas,
            )

        # Update BM25 index
        self._sync_bm25_index()
        logger.info(f"Successfully indexed {len(chunks)} chunks in vector store.")
        return len(chunks)

    def hybrid_search(
        self,
        query: str,
        top_k: int = 5,
        alpha: float = 0.5,
        filter_filename: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Performs Hybrid Search combining Dense Vector Search + BM25 Keyword Search.

        Args:
            query: The user search query.
            top_k: Number of combined results to return.
            alpha: Weight for dense vector search (1.0 = pure vector, 0.0 = pure BM25, 0.5 = balanced).
            filter_filename: Optional filter to restrict search to a specific source PDF.

        Returns:
            List of ranked result dictionaries with text, metadata, combined score, and citations.
        """
        total_chunks = self.collection.count()
        if total_chunks == 0:
            return []

        # 1. Dense Semantic Vector Search
        vector_results_dict: Dict[str, Dict[str, Any]] = {}
        query_embedding = self.compute_embeddings([query])
        
        where_clause = {"filename": filter_filename} if filter_filename else None
        
        fetch_k = min(top_k * 3, total_chunks)
        try:
            if query_embedding is not None:
                v_res = self.collection.query(
                    query_embeddings=query_embedding,
                    n_results=fetch_k,
                    where=where_clause,
                    include=["documents", "metadatas", "distances"]
                )
            else:
                v_res = self.collection.query(
                    query_texts=[query],
                    n_results=fetch_k,
                    where=where_clause,
                    include=["documents", "metadatas", "distances"]
                )

            ids = v_res.get("ids", [[]])[0]
            docs = v_res.get("documents", [[]])[0]
            metas = v_res.get("metadatas", [[]])[0]
            distances = v_res.get("distances", [[]])[0]

            for idx, cid in enumerate(ids):
                # Cosine distance in Chroma: similarity = 1 - distance
                dist = distances[idx] if idx < len(distances) else 0.5
                sim = max(0.0, min(1.0, 1.0 - dist))
                vector_results_dict[cid] = {
                    "id": cid,
                    "text": docs[idx] if idx < len(docs) else "",
                    "metadata": metas[idx] if idx < len(metas) else {},
                    "vector_score": sim,
                }
        except Exception as e:
            logger.warning(f"Vector search failed, continuing with BM25: {e}")

        # 2. BM25 Keyword Search
        bm25_matches = self.bm25.search(query, top_k=fetch_k)
        max_bm25 = max([score for _, score in bm25_matches], default=1.0) or 1.0

        bm25_results_dict: Dict[str, float] = {}
        for cid, score in bm25_matches:
            normalized_bm25 = score / max_bm25
            bm25_results_dict[cid] = normalized_bm25

        # 3. Combine Candidates via Score Fusion
        all_candidate_ids = set(vector_results_dict.keys()).union(set(bm25_results_dict.keys()))
        
        # If any BM25 candidate wasn't in vector results, fetch its data from Chroma
        missing_ids = [cid for cid in all_candidate_ids if cid not in vector_results_dict]
        if missing_ids:
            try:
                fetched = self.collection.get(ids=missing_ids, include=["documents", "metadatas"])
                f_ids = fetched.get("ids", [])
                f_docs = fetched.get("documents", [])
                f_metas = fetched.get("metadatas", [])
                for i, cid in enumerate(f_ids):
                    # Check filename filter if active
                    meta = f_metas[i] if i < len(f_metas) else {}
                    if filter_filename and meta.get("filename") != filter_filename:
                        continue
                    vector_results_dict[cid] = {
                        "id": cid,
                        "text": f_docs[i] if i < len(f_docs) else "",
                        "metadata": meta,
                        "vector_score": 0.0,
                    }
            except Exception as e:
                logger.warning(f"Error fetching missing BM25 chunks: {e}")

        combined_results: List[Dict[str, Any]] = []

        for cid in all_candidate_ids:
            if cid not in vector_results_dict:
                continue
            item = vector_results_dict[cid]
            v_score = item["vector_score"]
            b_score = bm25_results_dict.get(cid, 0.0)

            # Weighted hybrid score calculation
            final_score = (alpha * v_score) + ((1.0 - alpha) * b_score)

            combined_results.append({
                "id": cid,
                "text": item["text"],
                "metadata": item["metadata"],
                "score": round(final_score, 4),
                "vector_score": round(v_score, 4),
                "bm25_score": round(b_score, 4),
                "source": item["metadata"].get("filename", "Unknown"),
                "page": item["metadata"].get("page", 1),
            })

        # Rank descending by final combined score
        combined_results.sort(key=lambda x: x["score"], reverse=True)
        return combined_results[:top_k]

    def delete_by_filename(self, filename: str) -> int:
        """
        Deletes all chunks associated with a specific filename from ChromaDB
        and refreshes the BM25 keyword index.
        """
        try:
            existing = self.collection.get(where={"filename": filename})
            ids_to_delete = existing.get("ids", [])
            if ids_to_delete:
                self.collection.delete(ids=ids_to_delete)
                self._sync_bm25_index()
                logger.info(f"Purged {len(ids_to_delete)} chunks for file '{filename}' from vector store.")
                return len(ids_to_delete)
            return 0
        except Exception as e:
            logger.error(f"Error deleting chunks for '{filename}': {e}")
            return 0

    def get_stats(self) -> Dict[str, Any]:
        """Returns statistics about the vector store collection."""
        try:
            count = self.collection.count()
            results = self.collection.get(include=["metadatas"])
            metas = results.get("metadatas", [])
            unique_files = list(set(m.get("filename", "") for m in metas if m.get("filename")))
            return {
                "collection_name": COLLECTION_NAME,
                "total_chunks": count,
                "indexed_documents_count": len(unique_files),
                "indexed_files": unique_files,
                "persist_directory": self.persist_directory,
                "status": "ready"
            }
        except Exception as e:
            return {
                "collection_name": COLLECTION_NAME,
                "total_chunks": 0,
                "error": str(e),
                "status": "error"
            }
