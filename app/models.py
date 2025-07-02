from sqlalchemy import Column, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from .database import Base

class Corpus(Base):
    __tablename__ = "corpora"
    
    # Use String for SQLite compatibility, UUID for PostgreSQL
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    default_prompt = Column(Text, nullable=False)
    qdrant_collection_name = Column(String(255), nullable=False)
    path = Column(String(500), nullable=False)  # Path to the corpus directory
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship to corpus files
    files = relationship("CorpusFile", back_populates="corpus", cascade="all, delete-orphan")

class CorpusFile(Base):
    __tablename__ = "corpus_files"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    corpus_id = Column(String(36), ForeignKey("corpora.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    is_ingested = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationship back to corpus
    corpus = relationship("Corpus", back_populates="files") 