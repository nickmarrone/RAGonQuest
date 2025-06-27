from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class CorpusBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Name of the corpus")
    description: Optional[str] = Field(None, description="Description of the corpus")
    default_prompt: str = Field(..., min_length=1, description="Default prompt for the corpus")
    qdrant_collection_name: str = Field(..., min_length=1, max_length=255, description="Qdrant collection name")

class CorpusCreate(CorpusBase):
    pass

class CorpusUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Name of the corpus")
    description: Optional[str] = Field(None, description="Description of the corpus")
    default_prompt: Optional[str] = Field(None, min_length=1, description="Default prompt for the corpus")
    qdrant_collection_name: Optional[str] = Field(None, min_length=1, max_length=255, description="Qdrant collection name")

class CorpusResponse(CorpusBase):
    id: str = Field(..., description="Corpus ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    class Config:
        from_attributes = True 