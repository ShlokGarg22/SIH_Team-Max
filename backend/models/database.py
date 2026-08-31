from datetime import datetime

try:
    from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, Boolean  # type: ignore
    from sqlalchemy.orm import declarative_base, relationship  # type: ignore
    Base = declarative_base()
except ImportError:
    class Base:  # type: ignore
        metadata = type("Metadata", (), {"create_all": lambda *args, **kwargs: None})()
    Column = Integer = String = Text = DateTime = JSON = ForeignKey = Boolean = lambda *args, **kwargs: None  # type: ignore

    declarative_base = lambda: Base  # type: ignore
    relationship = lambda *args, **kwargs: None  # type: ignore



class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    role = Column(String(20), default="user") # 'user' or 'admin'
    
    sessions = relationship("Session", back_populates="user")


class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(String, primary_key=True, index=True) # UUID
    user_id = Column(Integer, ForeignKey("users.id"))
    session_type = Column(String(20), default="normal") # 'normal' or 'deep_research'
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="active")
    
    user = relationship("User", back_populates="sessions")
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
    research_state = relationship("ResearchState", back_populates="session", uselist=False, cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id"))
    sender = Column(String(50), nullable=False) # 'user', 'orchestrator', 'rag_agent', etc.
    content = Column(Text, nullable=False)
    metadata_json = Column(JSON, nullable=True) # To store citations, charts, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("Session", back_populates="messages")


class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="pending") # 'pending', 'indexed', 'failed'


class ResearchState(Base):
    __tablename__ = "research_states"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id"), unique=True)
    state_data = Column(JSON, nullable=False) # The persistent state dictionary
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    session = relationship("Session", back_populates="research_state")
