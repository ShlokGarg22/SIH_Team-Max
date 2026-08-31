import os
import logging
from typing import List, Optional, Dict, Any

from datetime import datetime
try:
    from sqlalchemy import create_engine  # type: ignore
    from sqlalchemy.orm import sessionmaker, Session as DBSession  # type: ignore
except ImportError:
    create_engine = None  # type: ignore
    sessionmaker = None  # type: ignore
    DBSession = None  # type: ignore

try:
    from backend.models.database import Base, Document, Session, Message, User, ResearchState
except ImportError:
    from models.database import Base, Document, Session, Message, User, ResearchState  # type: ignore


logger = logging.getLogger("StorageDB")

# Path definitions
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(BACKEND_DIR, "data")
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
CHROMA_DIR = os.path.join(DATA_DIR, "chroma")
DB_PATH = os.path.join(DATA_DIR, "workbench.db")

# Ensure required storage directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(CHROMA_DIR, exist_ok=True)

DATABASE_URL = f"sqlite:///{DB_PATH}"

if create_engine is not None and sessionmaker is not None:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
else:
    engine = None
    SessionLocal = lambda: None



def init_db():
    """Initializes SQLite database tables if they do not already exist."""
    Base.metadata.create_all(bind=engine)
    logger.info(f"Database initialized at {DB_PATH}")


def get_db():
    """FastAPI dependency to yield a database session and close it after request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------------------------------------------------------------
# Document Database Helper Operations
# -----------------------------------------------------------------------------

_IN_MEMORY_DOCS: Dict[str, Any] = {}

class _MockDoc:
    def __init__(self, filename: str, file_path: str, status: str = "pending"):
        self.id = len(_IN_MEMORY_DOCS) + 1
        self.filename = filename
        self.file_path = file_path
        self.status = status
        self.uploaded_at = datetime.utcnow()

def add_document_record(filename: str, file_path: str, status: str = "pending") -> Any:
    """Inserts a new document record or updates an existing one."""
    init_db()
    if engine is None:
        doc = _MockDoc(filename, file_path, status)
        _IN_MEMORY_DOCS[filename] = doc
        return doc

    with SessionLocal() as db:
        existing = db.query(Document).filter(Document.filename == filename).first()
        if existing:
            existing.file_path = file_path
            existing.status = status
            existing.uploaded_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return existing
        else:
            doc = Document(
                filename=filename,
                file_path=file_path,
                uploaded_at=datetime.utcnow(),
                status=status
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)
            return doc


def update_document_status(filename: str, status: str) -> Optional[Any]:
    """Updates the status of an ingested document (e.g. 'indexed', 'failed')."""
    if engine is None:
        doc = _IN_MEMORY_DOCS.get(filename)
        if doc:
            doc.status = status
        return doc

    with SessionLocal() as db:
        doc = db.query(Document).filter(Document.filename == filename).first()
        if doc:
            doc.status = status
            db.commit()
            db.refresh(doc)
        return doc


def list_document_records() -> List[dict]:
    """Returns a list of all tracked documents in SQLite."""
    init_db()
    if engine is None:
        return [
            {
                "id": d.id,
                "filename": d.filename,
                "file_path": d.file_path,
                "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
                "status": d.status,
            }
            for d in _IN_MEMORY_DOCS.values()
        ]

    with SessionLocal() as db:
        docs = db.query(Document).order_by(Document.uploaded_at.desc()).all()
        return [
            {
                "id": d.id,
                "filename": d.filename,
                "file_path": d.file_path,
                "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
                "status": d.status,
            }
            for d in docs
        ]


def delete_document_record(filename: str) -> bool:
    """Deletes a document record from SQLite by filename."""
    if engine is None:
        if filename in _IN_MEMORY_DOCS:
            del _IN_MEMORY_DOCS[filename]
            return True
        return False

    with SessionLocal() as db:
        doc = db.query(Document).filter(Document.filename == filename).first()
        if doc:
            db.delete(doc)
            db.commit()
            logger.info(f"Deleted document record for {filename}")
            return True
        return False
