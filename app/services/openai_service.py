import os
import glob
import tiktoken
import uuid
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from ..models import Corpus, CorpusFile
from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

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

@dataclass
class IngestResult:
    """Result of ingesting a file into Qdrant."""
    corpus_file_id: str
    filename: str
    chunks_processed: int
    points_created: int
    success: bool
    error_message: Optional[str] = None

@dataclass
class QueryResult:
    """Result of querying a corpus."""
    query: str
    answer: str
    context_chunks: List[str]
    sources: List[str]
    model_used: str
    embedding_model_used: str
    chunks_retrieved: int

def search_qdrant(
    query: str, 
    openai_client: OpenAI, 
    qdrant_client: QdrantClient, 
    collection_name: str,
    embedding_model: str = "text-embedding-3-small",
    limit: int = 25
) -> List[str]:
    """
    Search Qdrant for relevant context chunks based on a query.
    
    Args:
        query: The search query
        openai_client: OpenAI client instance
        qdrant_client: Qdrant client instance
        collection_name: Name of the Qdrant collection to search
        embedding_model: Model to use for creating embeddings
        limit: Maximum number of results to return
        
    Returns:
        List of text chunks from the search results
    """
    # Create embedding for the query
    embedding = openai_client.embeddings.create(
        input=[query], 
        model=embedding_model
    ).data[0].embedding
    
    # Search Qdrant
    hits = qdrant_client.search(
        collection_name=collection_name, 
        query_vector=embedding, 
        limit=limit, 
        with_payload=True
    )
    
    # Extract text from payload
    return [hit.payload["text"] for hit in hits]

def query_corpus(
    corpus: Corpus,
    query: str,
    openai_client: OpenAI,
    qdrant_client: QdrantClient,
    limit: int = 25,
    embedding_model: Optional[str] = None,
    completion_model: Optional[str] = None
) -> QueryResult:
    """
    Query a corpus using embeddings and return an AI-generated answer.
    
    Args:
        corpus: The Corpus object to query
        query: The question to ask
        openai_client: OpenAI client instance
        qdrant_client: Qdrant client instance
        limit: Maximum number of context chunks to retrieve
        embedding_model: Model to use for creating embeddings
        completion_model: Model to use for generating the answer
        
    Returns:
        QueryResult with the answer and context information
    """
    try:
        # Check if corpus has a Qdrant collection
        if not corpus.qdrant_collection_name:
            raise ValueError("Corpus does not have a Qdrant collection configured")
        
        # Use corpus models if not specified
        embedding_model = embedding_model or corpus.embedding_model
        completion_model = completion_model or corpus.completion_model
        
        # Search for relevant context chunks
        context_chunks = search_qdrant(
            query=query,
            openai_client=openai_client,
            qdrant_client=qdrant_client,
            collection_name=corpus.qdrant_collection_name,
            embedding_model=embedding_model,
            limit=limit
        )
        
        if not context_chunks:
            return QueryResult(
                query=query,
                answer="I couldn't find any relevant information in the corpus to answer your question.",
                context_chunks=[],
                sources=[],
                model_used=completion_model,
                embedding_model_used=embedding_model,
                chunks_retrieved=0
            )
        
        # Create context from chunks
        context = "\n\n".join(context_chunks)
        
        # Create prompt using corpus default prompt or a generic one
        system_prompt = corpus.default_prompt if corpus.default_prompt else "You are a helpful assistant. Answer questions based only on the provided context."
        
        user_prompt = f"""Context:
{context}

Q: {query}
A:"""
        
        # Generate answer using OpenAI
        response = openai_client.chat.completions.create(
            model=completion_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )
        
        answer = response.choices[0].message.content
        
        # Extract unique sources from context chunks (if available in payload)
        sources = list(set([
            chunk.split("source_file: ")[1].split("\n")[0] 
            for chunk in context_chunks 
            if "source_file: " in chunk
        ])) if any("source_file: " in chunk for chunk in context_chunks) else []
        
        return QueryResult(
            query=query,
            answer=answer,
            context_chunks=context_chunks,
            sources=sources,
            model_used=completion_model,
            embedding_model_used=embedding_model,
            chunks_retrieved=len(context_chunks)
        )
        
    except Exception as e:
        return QueryResult(
            query=query,
            answer=f"Error processing query: {str(e)}",
            context_chunks=[],
            sources=[],
            model_used=completion_model,
            embedding_model_used=embedding_model,
            chunks_retrieved=0
        )

def chunk_text(text: str, tokenizer, max_tokens: int = 512, overlap: int = 50) -> List[str]:
    """
    Tokenize and chunk text into overlapping segments.
    
    Args:
        text: Text to chunk
        tokenizer: Tiktoken tokenizer instance
        max_tokens: Maximum tokens per chunk
        overlap: Number of overlapping tokens between chunks
        
    Returns:
        List of text chunks
    """
    tokens = tokenizer.encode(text)
    chunks = []
    for i in range(0, len(tokens), max_tokens - overlap):
        chunk = tokens[i:i + max_tokens]
        chunks.append(tokenizer.decode(chunk))
    return chunks

def embed_text_batch(texts: List[str], client: OpenAI, model: str = "text-embedding-3-small") -> List[List[float]]:
    """
    Create embeddings for a batch of texts.
    
    Args:
        texts: List of texts to embed
        client: OpenAI client instance
        model: Embedding model to use
        
    Returns:
        List of embedding vectors
    """
    response = client.embeddings.create(input=texts, model=model)
    return [item.embedding for item in response.data]

def ingest_file_to_qdrant(
    corpus_file: CorpusFile,
    qdrant_client: QdrantClient,
    openai_client: OpenAI,
    chunk_size: int = 512,
    chunk_overlap: int = 50,
    batch_size: int = 10
) -> IngestResult:
    """
    Ingest a single file into Qdrant vector database.
    
    Args:
        corpus_file: The CorpusFile object to ingest (must have corpus relationship loaded)
        qdrant_client: Qdrant client instance
        openai_client: OpenAI client instance
        chunk_size: Maximum tokens per chunk
        chunk_overlap: Number of overlapping tokens between chunks
        batch_size: Number of chunks to process in each batch
        
    Returns:
        IngestResult with processing details
    """
    try:
        # Get corpus from relationship
        corpus = corpus_file.corpus
        if not corpus:
            return IngestResult(
                corpus_file_id=corpus_file.id,
                filename=corpus_file.filename,
                chunks_processed=0,
                points_created=0,
                success=False,
                error_message="Corpus relationship not loaded"
            )
        
        # Check if file exists in corpus path
        file_path = os.path.join(corpus.path, corpus_file.filename)
        if not os.path.exists(file_path):
            return IngestResult(
                corpus_file_id=corpus_file.id,
                filename=corpus_file.filename,
                chunks_processed=0,
                points_created=0,
                success=False,
                error_message=f"File '{corpus_file.filename}' not found at path '{corpus.path}'"
            )
        
        # Use model from corpus (default to text-embedding-3-small if not specified)
        model = getattr(corpus, 'embedding_model', 'text-embedding-3-small')
        
        # Initialize tokenizer
        tokenizer = tiktoken.encoding_for_model(model)
        
        # Ensure Qdrant collection exists
        collection_name = corpus.qdrant_collection_name
        if not qdrant_client.collection_exists(collection_name):
            # Get embedding size based on model
            embedding_size = 1536 if model == "text-embedding-3-small" else 3072
            qdrant_client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=embedding_size, distance=Distance.COSINE)
            )
        
        # Read and chunk the file
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()
        
        chunks = chunk_text(text, tokenizer, chunk_size, chunk_overlap)
        
        if not chunks:
            return IngestResult(
                corpus_file_id=corpus_file.id,
                filename=corpus_file.filename,
                chunks_processed=0,
                points_created=0,
                success=False,
                error_message="No chunks generated from file content"
            )
        
        # Process chunks in batches
        total_points = 0
        for i in range(0, len(chunks), batch_size):
            batch_chunks = chunks[i:i + batch_size]
            
            # Create embeddings for the batch
            embeddings = embed_text_batch(batch_chunks, openai_client, model)
            
            # Create points for Qdrant
            points = [
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "text": chunk,
                        "source_file": corpus_file.filename,
                        "corpus_id": corpus.id,
                        "corpus_name": corpus.name,
                        "chunk_index": i + j
                    }
                )
                for j, (chunk, embedding) in enumerate(zip(batch_chunks, embeddings))
            ]
            
            # Upsert points to Qdrant
            qdrant_client.upsert(collection_name=collection_name, points=points)
            total_points += len(points)
        
        return IngestResult(
            corpus_file_id=corpus_file.id,
            filename=corpus_file.filename,
            chunks_processed=len(chunks),
            points_created=total_points,
            success=True
        )
        
    except Exception as e:
        return IngestResult(
            corpus_file_id=corpus_file.id,
            filename=corpus_file.filename,
            chunks_processed=0,
            points_created=0,
            success=False,
            error_message=str(e)
        )

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
    model: Optional[str] = None
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
    # Use corpus model if not specified
    model = model or corpus.embedding_model
    
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
    model: Optional[str] = None,
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
    # Use corpus model if not specified
    model = model or corpus.embedding_model
    
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
