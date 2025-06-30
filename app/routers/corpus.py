from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
import os
from ..database import get_db
from ..models import Corpus
from ..schemas import CorpusCreate, CorpusUpdate, CorpusResponse

router = APIRouter(prefix="/corpora", tags=["corpora"])

@router.post("/", response_model=CorpusResponse, status_code=status.HTTP_201_CREATED)
def create_corpus(corpus: CorpusCreate, db: Session = Depends(get_db)):
    """
    Create a new corpus. Names must be unique.
    """
    # Check if corpus with same name already exists
    existing_corpus = db.query(Corpus).filter(Corpus.name == corpus.name).first()
    if existing_corpus:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Corpus with name '{corpus.name}' already exists"
        )
    
    # Validate that the path exists and is a directory (only if path is provided)
    if corpus.path:
        if not os.path.exists(corpus.path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Path '{corpus.path}' does not exist"
            )
        
        if not os.path.isdir(corpus.path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Path '{corpus.path}' is not a directory"
            )
    
    db_corpus = Corpus(
        name=corpus.name,
        description=corpus.description,
        default_prompt=corpus.default_prompt,
        qdrant_collection_name=corpus.qdrant_collection_name,
        path=corpus.path
    )
    
    try:
        db.add(db_corpus)
        db.commit()
        db.refresh(db_corpus)
        return db_corpus
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corpus creation failed due to database constraint violation"
        )

@router.get("/", response_model=List[CorpusResponse])
def get_corpora(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve a list of all corpora with pagination support.
    """
    corpora = db.query(Corpus).offset(skip).limit(limit).all()
    return corpora

@router.get("/{corpus_id}", response_model=CorpusResponse)
def get_corpus(corpus_id: str, db: Session = Depends(get_db)):
    """
    Retrieve a specific corpus by ID.
    """
    corpus = db.query(Corpus).filter(Corpus.id == corpus_id).first()
    if corpus is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Corpus with ID '{corpus_id}' not found"
        )
    return corpus

@router.patch("/{corpus_id}", response_model=CorpusResponse)
def update_corpus(corpus_id: str, corpus_update: CorpusUpdate, db: Session = Depends(get_db)):
    """
    Update a specific corpus by ID. Only provided fields will be updated.
    """
    db_corpus = db.query(Corpus).filter(Corpus.id == corpus_id).first()
    if db_corpus is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Corpus with ID '{corpus_id}' not found"
        )
    
    # Check if name is being updated and if it conflicts with existing corpus
    if corpus_update.name is not None and corpus_update.name != db_corpus.name:
        existing_corpus = db.query(Corpus).filter(
            Corpus.name == corpus_update.name,
            Corpus.id != corpus_id
        ).first()
        if existing_corpus:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Corpus with name '{corpus_update.name}' already exists"
            )
    
    # Validate path if it's being updated
    if corpus_update.path is not None and corpus_update.path:
        if not os.path.exists(corpus_update.path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Path '{corpus_update.path}' does not exist"
            )
        
        if not os.path.isdir(corpus_update.path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Path '{corpus_update.path}' is not a directory"
            )
    
    # Update only provided fields
    update_data = corpus_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_corpus, field, value)
    
    try:
        db.commit()
        db.refresh(db_corpus)
        return db_corpus
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corpus update failed due to database constraint violation"
        ) 