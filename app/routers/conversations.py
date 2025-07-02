from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
import os
from ..database import get_db
from ..models import Corpus, Conversation, ConversationPart
from ..schemas import ConversationCreate, ConversationResponse, ConversationContinue
from ..services.openai_service import query_corpus, search_qdrant
from openai import OpenAI
from qdrant_client import QdrantClient

router = APIRouter(prefix="/corpora", tags=["conversations"])

@router.get("/{corpus_id}/conversations", response_model=List[ConversationResponse])
def list_conversations(
    corpus_id: str,
    offset: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """
    Retrieve a list of conversations for a specific corpus.
    Supports pagination.
    """
    # Verify corpus exists
    corpus = db.query(Corpus).filter(Corpus.id == corpus_id).first()
    if corpus is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Corpus with ID '{corpus_id}' not found"
        )
    
    conversations = db.query(Conversation).filter(
        Conversation.corpus_id == corpus_id
    ).offset(offset).limit(limit).all()
    
    return conversations

@router.get("/{corpus_id}/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    corpus_id: str,
    conversation_id: str, 
    db: Session = Depends(get_db)
):
    """
    Retrieve a specific conversation by ID within a corpus.
    """
    # Verify corpus exists
    corpus = db.query(Corpus).filter(Corpus.id == corpus_id).first()
    if corpus is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Corpus with ID '{corpus_id}' not found"
        )
    
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.corpus_id == corpus_id
    ).first()
    
    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation with ID '{conversation_id}' not found in corpus '{corpus_id}'"
        )
    
    return conversation

@router.delete("/{corpus_id}/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    corpus_id: str,
    conversation_id: str, 
    db: Session = Depends(get_db)
):
    """
    Delete a conversation and all its parts within a corpus.
    This operation is idempotent - returns 204 even if the conversation doesn't exist.
    """
    # Verify corpus exists
    corpus = db.query(Corpus).filter(Corpus.id == corpus_id).first()
    if corpus is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Corpus with ID '{corpus_id}' not found"
        )
    
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.corpus_id == corpus_id
    ).first()
    
    if conversation is None:
        # Return 204 for idempotency - conversation doesn't exist, which is the desired state
        return None
    
    try:
        # Delete the conversation (conversation parts will be deleted automatically due to cascade)
        db.delete(conversation)
        db.commit()
        return None
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete conversation due to database constraint violation"
        )

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

@router.post("/{corpus_id}/conversations/{conversation_id}/continue", response_model=ConversationResponse)
def continue_conversation(
    corpus_id: str,
    conversation_id: str,
    conversation_data: ConversationContinue,
    db: Session = Depends(get_db)
):
    """
    Continue an existing conversation by adding a new conversation part.
    The AI will receive the full conversation history including previous queries, contexts, and responses.
    """
    # Verify corpus exists
    corpus = db.query(Corpus).filter(Corpus.id == corpus_id).first()
    if corpus is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Corpus with ID '{corpus_id}' not found"
        )
    
    # Get the conversation with its parts
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.corpus_id == corpus_id
    ).first()
    
    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation with ID '{conversation_id}' not found in corpus '{corpus_id}'"
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
        # Get new context chunks for the current query
        new_context_chunks = search_qdrant(
            query=conversation_data.query,
            openai_client=openai_client,
            qdrant_client=qdrant_client,
            collection_name=corpus.qdrant_collection_name,
            embedding_model=corpus.embedding_model,
            limit=conversation_data.limit
        )
        
        # Build conversation history for the AI
        conversation_history = []
        for part in conversation.parts:
            conversation_history.append(f"User: {part.query}")
            conversation_history.append(f"Assistant: {part.response}")
        
        # Add the current query
        conversation_history.append(f"User: {conversation_data.query}")
        
        # Create the full context for the AI
        full_context = "\n\n".join(new_context_chunks)
        conversation_context = "\n".join(conversation_history[:-1])  # Exclude current query
        
        # Create prompt using corpus default prompt or a generic one
        system_prompt = corpus.default_prompt if corpus.default_prompt else "You are a helpful assistant. Answer questions based only on the provided context and conversation history."
        
        user_prompt = f"""Context from knowledge base:
{full_context}

Previous conversation:
{conversation_context}

Current question: {conversation_data.query}

Please answer the current question based on the context and conversation history."""
        
        # Generate answer using OpenAI
        response = openai_client.chat.completions.create(
            model=corpus.completion_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )
        
        answer = response.choices[0].message.content
        
        # Extract unique sources from context chunks (if available in payload)
        sources = list(set([
            chunk.split("source_file: ")[1].split("\n")[0] 
            for chunk in new_context_chunks 
            if "source_file: " in chunk
        ])) if any("source_file: " in chunk for chunk in new_context_chunks) else []
        
        # Create the new conversation part
        conversation_part = ConversationPart(
            conversation_id=conversation_id,
            query=conversation_data.query,
            context_chunks=new_context_chunks,
            response=answer,
            sources=sources,
            embedding_model_used=corpus.embedding_model,
            completion_model_used=corpus.completion_model,
            chunks_retrieved=len(new_context_chunks)
        )
        
        db.add(conversation_part)
        db.commit()
        
        # Refresh to get the conversation with all its parts
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
            detail=f"Error continuing conversation: {str(e)}"
        ) 