from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
import os
import glob
from ..database import get_db
from ..models import Corpus, CorpusFile
from ..schemas import CorpusCreate, CorpusUpdate, CorpusResponse, CorpusFileResponse, validate_path_exists_and_is_directory
from ..services.openai_service import (
    estimate_embedding_cost_for_corpus_file, 
    estimate_embedding_cost_for_corpus, 
    CorpusFileCostInfo, 
    CorpusCostSummary,
    ingest_file_to_qdrant,
    IngestResult
)
from openai import OpenAI
from qdrant_client import QdrantClient

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
def get_corpora(offset: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve a list of all corpora with pagination support.
    """
    corpora = db.query(Corpus).offset(offset).limit(limit).all()
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
    
    # Update only provided fields
    update_data = corpus_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_corpus, field, value)
    
    try:
        # TODO: This is not updating the updated_at field
        db.commit()
        db.refresh(db_corpus)
        return db_corpus
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corpus update failed due to database constraint violation"
        )

@router.post("/{corpus_id}/scan", response_model=List[CorpusFileResponse])
def scan_corpus_files(corpus_id: str, db: Session = Depends(get_db)):
    """
    Scan the corpus path and add any .txt files found as corpus files.
    Files are added with is_ingested=False.
    """
    # Get the corpus
    corpus = db.query(Corpus).filter(Corpus.id == corpus_id).first()
    if corpus is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Corpus with ID '{corpus_id}' not found"
        )
    
    # Check if corpus has a path
    if not corpus.path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corpus does not have a path configured"
        )
    
    # Validate path using schema helper function
    try:
        validate_path_exists_and_is_directory(corpus.path)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Scan for .txt files
    txt_files = glob.glob(os.path.join(corpus.path, "*.txt"))
    
    if not txt_files:
        return []
    
    # Get existing filenames to avoid duplicates
    existing_files = db.query(CorpusFile.filename).filter(
        CorpusFile.corpus_id == corpus_id
    ).all()
    existing_filenames = {file[0] for file in existing_files}
    
    # Create new corpus files for files not already in database
    new_files = []
    for file_path in sorted(txt_files):
        filename = os.path.basename(file_path)
        
        # Skip if file already exists in database
        if filename in existing_filenames:
            continue
        
        # Create new corpus file
        corpus_file = CorpusFile(
            corpus_id=corpus_id,
            filename=filename,
            is_ingested=False
        )
        
        db.add(corpus_file)
        new_files.append(corpus_file)
    
    try:
        db.commit()
        # Refresh the new files to get their IDs and timestamps
        for file in new_files:
            db.refresh(file)
        return new_files
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to add corpus files due to database constraint violation"
        )

@router.get("/{corpus_id}/files/{file_id}/cost_estimate", response_model=CorpusFileCostInfo)
def get_corpus_file_cost_estimate(
    corpus_id: str, 
    file_id: str, 
    db: Session = Depends(get_db)
):
    """
    Get cost estimate for embedding a specific corpus file.
    """
    # Get the corpus
    corpus = db.query(Corpus).filter(Corpus.id == corpus_id).first()
    if corpus is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Corpus with ID '{corpus_id}' not found"
        )
    
    # Get the corpus file
    corpus_file = db.query(CorpusFile).filter(
        CorpusFile.id == file_id,
        CorpusFile.corpus_id == corpus_id
    ).first()
    
    if corpus_file is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Corpus file with ID '{file_id}' not found in corpus '{corpus_id}'"
        )
    
    # Get cost estimate using corpus model
    try:
        cost_estimate = estimate_embedding_cost_for_corpus_file(corpus_file, corpus)
        if cost_estimate is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Could not read file '{corpus_file.filename}' for cost estimation"
            )
        return cost_estimate
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/{corpus_id}/cost_estimate", response_model=CorpusCostSummary)
def get_corpus_cost_estimate(
    corpus_id: str, 
    include_ingested: bool = False,
    db: Session = Depends(get_db)
):
    """
    Get cost estimate for embedding all files in a corpus.
    """
    # Get the corpus with its files
    corpus = db.query(Corpus).filter(Corpus.id == corpus_id).first()
    if corpus is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Corpus with ID '{corpus_id}' not found"
        )
    
    # Get cost estimate using corpus model
    try:
        cost_estimate = estimate_embedding_cost_for_corpus(corpus, include_ingested=include_ingested)
        if cost_estimate is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No files found for cost estimation"
            )
        return cost_estimate
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{corpus_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_corpus(corpus_id: str, db: Session = Depends(get_db)):
    """
    Delete a corpus and all its associated files.
    This operation is idempotent - returns 204 even if the corpus doesn't exist.
    """
    # Get the corpus
    corpus = db.query(Corpus).filter(Corpus.id == corpus_id).first()
    if corpus is None:
        # Return 204 for idempotency - corpus doesn't exist, which is the desired state
        return None
    
    try:
        # Delete the corpus (corpus files will be deleted automatically due to cascade)
        db.delete(corpus)
        db.commit()
        return None
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete corpus due to database constraint violation"
        )

@router.post("/{corpus_id}/ingest", response_model=List[IngestResult])
def ingest_corpus_files(
    corpus_id: str,
    chunk_size: int = 512,
    chunk_overlap: int = 50,
    batch_size: int = 10,
    db: Session = Depends(get_db)
):
    """
    Ingest all uningested files in a corpus into Qdrant.
    """
    # Get the corpus with its files
    corpus = db.query(Corpus).filter(Corpus.id == corpus_id).first()
    if corpus is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Corpus with ID '{corpus_id}' not found"
        )
    
    # Get uningested files
    uningested_files = db.query(CorpusFile).filter(
        CorpusFile.corpus_id == corpus_id,
        CorpusFile.is_ingested == False
    ).all()
    
    if not uningested_files:
        return []
    
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
    
    # Load corpus relationship for all files
    for file in uningested_files:
        file.corpus = corpus
    
    # Ingest each file
    results = []
    for corpus_file in uningested_files:
        result = ingest_file_to_qdrant(
            corpus_file=corpus_file,
            qdrant_client=qdrant_client,
            openai_client=openai_client,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            batch_size=batch_size
        )
        
        # Update ingestion status in database
        if result.success:
            corpus_file.is_ingested = True
            corpus_file.updated_at = datetime.now(timezone.utc)
        
        results.append(result)
    
    # Commit all changes
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update ingestion status due to database constraint violation"
        )
    
    return results 