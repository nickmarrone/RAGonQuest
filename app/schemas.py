from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List, Dict, Any, ClassVar
from datetime import datetime
import os
from uuid import UUID

def validate_path_exists_and_is_directory(path: str) -> str:
    """Validate that a path exists and is a directory if provided"""
    if path and path.strip():  # Only validate if path is not empty
        if not os.path.exists(path):
            raise ValueError(f"Path '{path}' does not exist")
        if not os.path.isdir(path):
            raise ValueError(f"Path '{path}' is not a directory")
    return path

class CorpusBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Name of the corpus")
    description: Optional[str] = Field(None, description="Description of the corpus")
    default_prompt: str = Field(..., min_length=1, description="Default prompt for the corpus")
    qdrant_collection_name: str = Field(..., min_length=1, max_length=255, description="Qdrant collection name")
    path: str = Field(..., min_length=1, max_length=500, description="Path to the corpus directory")
    embedding_model: str = Field(default="text-embedding-3-small", min_length=1, max_length=100, description="OpenAI embedding model to use")
    completion_model: str = Field(default="gpt-4o-mini", min_length=1, max_length=100, description="OpenAI completion model to use")
    
    @field_validator('path')
    @classmethod
    def validate_path(cls, v):
        """Validate that the path exists and is a directory if provided"""
        return validate_path_exists_and_is_directory(v)

class CorpusCreate(CorpusBase):
    pass

class CorpusUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Name of the corpus")
    description: Optional[str] = Field(None, description="Description of the corpus")
    default_prompt: Optional[str] = Field(None, min_length=1, description="Default prompt for the corpus")
    qdrant_collection_name: Optional[str] = Field(None, min_length=1, max_length=255, description="Qdrant collection name")
    path: Optional[str] = Field(None, min_length=1, max_length=500, description="Path to the corpus directory")
    embedding_model: Optional[str] = Field(None, min_length=1, max_length=100, description="OpenAI embedding model to use")
    completion_model: Optional[str] = Field(None, min_length=1, max_length=100, description="OpenAI completion model to use")
    
    @field_validator('path')
    @classmethod
    def validate_path(cls, v):
        """Validate that the path exists and is a directory if provided"""
        return validate_path_exists_and_is_directory(v)

class CorpusFileBase(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255, description="Name of the file")

class CorpusFileCreate(CorpusFileBase):
    pass

class CorpusFileUpdate(BaseModel):
    filename: Optional[str] = Field(None, min_length=1, max_length=255, description="Name of the file")

class CorpusFileResponse(CorpusFileBase):
    id: str = Field(..., description="Corpus file ID")
    corpus_id: str = Field(..., description="Corpus ID")
    is_ingested: bool = Field(..., description="Whether the file has been ingested into the vector database")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    class Config:
        from_attributes = True

class CorpusResponse(CorpusBase):
    id: str = Field(..., description="Corpus ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    files: List[CorpusFileResponse] = Field(default=[], description="List of files in the corpus")
    
    class Config:
        from_attributes = True

# Conversation schemas
class ConversationPartBase(BaseModel):
    query: str = Field(..., min_length=1, description="User's query/question")
    context_chunks: List[str] = Field(..., description="List of context chunks retrieved from vector database")
    response: str = Field(..., description="AI's response")
    sources: Optional[List[str]] = Field(None, description="List of source files used")
    embedding_model_used: str = Field(..., description="Which embedding model was used")
    completion_model_used: str = Field(..., description="Which completion model was used")
    chunks_retrieved: int = Field(..., ge=0, description="Number of chunks retrieved")

class ConversationPartCreate(ConversationPartBase):
    pass

class ConversationPartResponse(ConversationPartBase):
    id: str = Field(..., description="Conversation part ID")
    conversation_id: str = Field(..., description="Conversation ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    class Config:
        from_attributes = True

class ConversationBase(BaseModel):
    title: Optional[str] = Field(None, max_length=255, description="Optional title for the conversation")

class ConversationCreate(ConversationBase):
    query: str = Field(..., min_length=1, description="User's query/question")
    limit: int = Field(default=25, ge=1, le=100, description="Maximum number of context chunks to retrieve")
    similarity_threshold: float = Field(default=0.7, ge=0.0, le=1.0, description="Minimum similarity score (0.0 to 1.0) for chunks to be included")

class ConversationContinue(BaseModel):
    query: str = Field(..., min_length=1, description="User's new query/question")
    limit: int = Field(default=25, ge=1, le=100, description="Maximum number of context chunks to retrieve")
    similarity_threshold: float = Field(default=0.7, ge=0.0, le=1.0, description="Minimum similarity score (0.0 to 1.0) for chunks to be included")

class ConversationResponse(ConversationBase):
    id: str = Field(..., description="Conversation ID")
    corpus_id: str = Field(..., description="Corpus ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    parts: List[ConversationPartResponse] = Field(default=[], description="List of conversation parts")
    
    class Config:
        from_attributes = True 