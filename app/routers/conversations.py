from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
import os
from ..database import get_db
from ..models import Corpus, Conversation, ConversationPart
from ..schemas import ConversationCreate, ConversationResponse
from ..services.openai_service import query_corpus
from openai import OpenAI
from qdrant_client import QdrantClient

router = APIRouter(prefix="/corpora", tags=["conversations"])

@router.post("/{corpus_id}/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    corpus_id: str,
    conversation_data: ConversationCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new conversation with an initial conversation part.
    This replaces the old query endpoint and stores the interaction history.
    """
    # Get the corpus
    corpus = db.query(Corpus).filter(Corpus.id == corpus_id).first()
    if corpus is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Corpus with ID '{corpus_id}' not found"
        )
    
    # Check if corpus has a Qdrant collection
    if not corpus.qdrant_collection_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corpus does not have a Qdrant collection configured"
        )
    
    # Initialize clients
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OPENAI_API_KEY not configured"
        )
    
    qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
    openai_client = OpenAI(api_key=openai_api_key)
    qdrant_client = QdrantClient(url=qdrant_url)
    
    try:
        # Query the corpus using corpus models
        query_result = query_corpus(
            corpus=corpus,
            query=conversation_data.query,
            openai_client=openai_client,
            qdrant_client=qdrant_client,
            limit=conversation_data.limit
        )
        
        # Create the conversation
        conversation = Conversation(
            corpus_id=corpus_id,
            title=conversation_data.title
        )
        
        db.add(conversation)
        db.flush()  # Get the conversation ID
        
        # Create the conversation part
        conversation_part = ConversationPart(
            conversation_id=conversation.id,
            query=conversation_data.query,
            context_chunks=query_result.context_chunks,
            response=query_result.answer,
            sources=query_result.sources,
            embedding_model_used=query_result.embedding_model_used,
            completion_model_used=query_result.model_used,
            chunks_retrieved=query_result.chunks_retrieved
        )
        
        db.add(conversation_part)
        db.commit()
        
        # Refresh to get the conversation with its parts
        db.refresh(conversation)
        
        return conversation
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating conversation: {str(e)}"
        ) 