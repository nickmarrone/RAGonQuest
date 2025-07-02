from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class CorpusBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Name of the corpus")
    description: Optional[str] = Field("", description="Description of the corpus")
    default_prompt: Optional[str] = Field("", min_length=1, description="Default prompt for the corpus")
    qdrant_collection_name: Optional[str] = Field("", min_length=1, max_length=255, description="Qdrant collection name")
    path: Optional[str] = Field("", min_length=1, max_length=500, description="Path to the corpus directory")

class CorpusCreate(CorpusBase):
    pass

class CorpusUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Name of the corpus")
    description: Optional[str] = Field(None, description="Description of the corpus")
    default_prompt: Optional[str] = Field(None, min_length=1, description="Default prompt for the corpus")
    qdrant_collection_name: Optional[str] = Field(None, min_length=1, max_length=255, description="Qdrant collection name")
    path: Optional[str] = Field(None, min_length=1, max_length=500, description="Path to the corpus directory")

class CorpusFileBase(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255, description="Name of the file")

class CorpusFileCreate(CorpusFileBase):
    pass

class CorpusFileUpdate(BaseModel):
    filename: Optional[str] = Field(None, min_length=1, max_length=255, description="Name of the file")

class CorpusFileResponse(CorpusFileBase):
    id: str = Field(..., description="Corpus file ID")
    corpus_id: str = Field(..., description="Corpus ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    class Config:
        from_attributes = True

class CorpusResponse(CorpusBase):
    id: str = Field(..., description="Corpus ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    files: List[CorpusFileResponse] = Field(default=[], description="List of files in the corpus")
    
    class Config:
        from_attributes = True 