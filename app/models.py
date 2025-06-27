from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from .database import Base

class Corpus(Base):
    __tablename__ = "corpus"
    
    # Use String for SQLite compatibility, UUID for PostgreSQL
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    default_prompt = Column(Text, nullable=False)
    qdrant_collection_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False) 