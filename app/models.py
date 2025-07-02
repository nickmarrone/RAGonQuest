from sqlalchemy import Column, String, DateTime, Text, Boolean, ForeignKey, JSON, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.exc import IntegrityError
import uuid
import os
from datetime import datetime, timezone
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
    embedding_model = Column(String(100), nullable=False, default="text-embedding-3-small")  # OpenAI embedding model
    completion_model = Column(String(100), nullable=False, default="gpt-4o-mini")  # OpenAI completion model
    created_at = Column(DateTime, default=datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc), nullable=False)
    
    # Relationships
    files = relationship("CorpusFile", back_populates="corpus", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="corpus", cascade="all, delete-orphan")

class CorpusFile(Base):
    __tablename__ = "corpus_files"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    corpus_id = Column(String(36), ForeignKey("corpora.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    is_ingested = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc), nullable=False)
    
    # Relationship back to corpus
    corpus = relationship("Corpus", back_populates="files")

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    corpus_id = Column(String(36), ForeignKey("corpora.id"), nullable=False, index=True)
    title = Column(String(255), nullable=True)  # Optional title for the conversation
    created_at = Column(DateTime, default=datetime.now(timezone.utc), nullable=False)
    
    # Relationships
    corpus = relationship("Corpus", back_populates="conversations")
    parts = relationship("ConversationPart", back_populates="conversation", cascade="all, delete-orphan", order_by="ConversationPart.created_at")

class ConversationPart(Base):
    __tablename__ = "conversation_parts"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=False, index=True)
    query = Column(Text, nullable=False)  # User's query/question
    context_chunks = Column(JSON, nullable=False)  # List of context chunks retrieved from vector database
    response = Column(Text, nullable=False)  # AI's response
    sources = Column(JSON, nullable=True)  # List of source files used
    embedding_model_used = Column(String(100), nullable=False)  # Which embedding model was used
    completion_model_used = Column(String(100), nullable=False)  # Which completion model was used
    chunks_retrieved = Column(Integer, nullable=False, default=0)  # Number of chunks retrieved
    created_at = Column(DateTime, default=datetime.now(timezone.utc), nullable=False)
    
    # Relationship back to conversation
    conversation = relationship("Conversation", back_populates="parts") 