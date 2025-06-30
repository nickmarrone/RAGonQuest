import os
import glob
import tiktoken
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from ..models import Corpus, CorpusFile

# OpenAI embedding model pricing
PRICING = {
    "text-embedding-3-small": 0.00002,
    "text-embedding-3-large": 0.00013,
}

@dataclass
class FileCostInfo:
    """Information about the cost and tokens for a single file."""
    filename: str
    tokens: int
    cost: float

@dataclass
class EmbeddingCostSummary:
    """Summary of embedding costs for a folder."""
    folder_path: str
    model: str
    files: List[FileCostInfo]
    total_tokens: int
    total_cost: float
    file_count: int

@dataclass
class CorpusFileCostInfo:
    """Information about the cost and tokens for a corpus file."""
    corpus_file_id: str
    filename: str
    tokens: int
    cost: float
    is_ingested: bool

@dataclass
class CorpusCostSummary:
    """Summary of embedding costs for a corpus."""
    corpus_id: str
    corpus_name: str
    model: str
    files: List[CorpusFileCostInfo]
    total_tokens: int
    total_cost: float
    file_count: int
    ingested_count: int
    uningested_count: int

def estimate_embedding_cost_for_folder(
    folder_path: str, 
    model: str = "text-embedding-3-small"
) -> Optional[EmbeddingCostSummary]:
    """
    Estimate the cost of embedding all .txt files in a folder.
    
    Args:
        folder_path: Path to the folder containing .txt files
        model: OpenAI embedding model to use for estimation
        
    Returns:
        EmbeddingCostSummary object with detailed cost information, or None if no files found
        
    Raises:
        ValueError: If the model is not supported
        FileNotFoundError: If the folder doesn't exist
    """
    if model not in PRICING:
        raise ValueError(f"Unknown model: {model}")
    
    if not os.path.exists(folder_path):
        raise FileNotFoundError(f"Folder not found: {folder_path}")
    
    tokenizer = tiktoken.encoding_for_model(model)
    cost_per_token = PRICING[model] / 1000

    txt_files = glob.glob(os.path.join(folder_path, "*.txt"))
    if not txt_files:
        return None

    files_info = []
    total_tokens = 0
    total_cost = 0.0

    for file_path in sorted(txt_files):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
            
            tokens = tokenizer.encode(text)
            num_tokens = len(tokens)
            cost = num_tokens * cost_per_token

            total_tokens += num_tokens
            total_cost += cost

            files_info.append(FileCostInfo(
                filename=os.path.basename(file_path),
                tokens=num_tokens,
                cost=cost
            ))
        except Exception as e:
            # Skip files that can't be read
            print(f"Warning: Could not process {file_path}: {e}")
            continue

    return EmbeddingCostSummary(
        folder_path=folder_path,
        model=model,
        files=files_info,
        total_tokens=total_tokens,
        total_cost=total_cost,
        file_count=len(files_info)
    )

def estimate_embedding_cost_for_corpus_file(
    corpus_file: CorpusFile,
    corpus: Corpus,
    model: str = "text-embedding-3-small"
) -> Optional[CorpusFileCostInfo]:
    """
    Estimate the cost of embedding a single corpus file.
    
    Args:
        corpus_file: The CorpusFile object to estimate
        corpus: The Corpus object containing the file
        model: OpenAI embedding model to use for estimation
        
    Returns:
        CorpusFileCostInfo object with cost information, or None if file can't be read
        
    Raises:
        ValueError: If the model is not supported
        FileNotFoundError: If the corpus path doesn't exist
    """
    if model not in PRICING:
        raise ValueError(f"Unknown model: {model}")
    
    if not corpus.path:
        raise ValueError("Corpus does not have a path configured")
    
    if not os.path.exists(corpus.path):
        raise FileNotFoundError(f"Corpus path not found: {corpus.path}")
    
    file_path = os.path.join(corpus.path, corpus_file.filename)
    
    if not os.path.exists(file_path):
        return None
    
    tokenizer = tiktoken.encoding_for_model(model)
    cost_per_token = PRICING[model] / 1000
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()
        
        tokens = tokenizer.encode(text)
        num_tokens = len(tokens)
        cost = num_tokens * cost_per_token
        
        return CorpusFileCostInfo(
            corpus_file_id=corpus_file.id,
            filename=corpus_file.filename,
            tokens=num_tokens,
            cost=cost,
            is_ingested=corpus_file.is_ingested
        )
    except Exception as e:
        print(f"Warning: Could not process {file_path}: {e}")
        return None

def estimate_embedding_cost_for_corpus(
    corpus: Corpus,
    model: str = "text-embedding-3-small",
    include_ingested: bool = False
) -> Optional[CorpusCostSummary]:
    """
    Estimate the cost of embedding all files in a corpus.
    
    Args:
        corpus: The Corpus object to estimate
        model: OpenAI embedding model to use for estimation
        include_ingested: Whether to include already ingested files in the estimate
        
    Returns:
        CorpusCostSummary object with detailed cost information, or None if no files found
        
    Raises:
        ValueError: If the model is not supported
        FileNotFoundError: If the corpus path doesn't exist
    """
    if model not in PRICING:
        raise ValueError(f"Unknown model: {model}")
    
    if not corpus.path:
        raise ValueError("Corpus does not have a path configured")
    
    if not os.path.exists(corpus.path):
        raise FileNotFoundError(f"Corpus path not found: {corpus.path}")
    
    # Get corpus files from the relationship
    corpus_files = corpus.files
    
    # Filter files based on ingestion status
    if not include_ingested:
        corpus_files = [f for f in corpus_files if not f.is_ingested]
    
    if not corpus_files:
        return None
    
    files_info = []
    total_tokens = 0
    total_cost = 0.0
    ingested_count = 0
    uningested_count = 0
    
    for corpus_file in corpus_files:
        file_cost_info = estimate_embedding_cost_for_corpus_file(corpus_file, corpus, model)
        
        if file_cost_info:
            files_info.append(file_cost_info)
            total_tokens += file_cost_info.tokens
            total_cost += file_cost_info.cost
            
            if file_cost_info.is_ingested:
                ingested_count += 1
            else:
                uningested_count += 1
    
    return CorpusCostSummary(
        corpus_id=corpus.id,
        corpus_name=corpus.name,
        model=model,
        files=files_info,
        total_tokens=total_tokens,
        total_cost=total_cost,
        file_count=len(files_info),
        ingested_count=ingested_count,
        uningested_count=uningested_count
    )

def get_available_models() -> List[str]:
    """Get list of available embedding models."""
    return list(PRICING.keys())

def get_model_pricing(model: str) -> Optional[float]:
    """Get the pricing for a specific model per 1K tokens."""
    return PRICING.get(model)
