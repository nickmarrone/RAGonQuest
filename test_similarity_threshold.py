#!/usr/bin/env python3
"""
Simple test script to verify similarity threshold functionality
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.services.openai_service import search_qdrant, query_corpus
from unittest.mock import Mock, MagicMock

def test_search_qdrant_with_threshold():
    """Test that search_qdrant filters results based on similarity threshold"""
    
    # Mock the OpenAI client
    mock_openai_client = Mock()
    mock_embedding_response = Mock()
    mock_embedding_response.data = [Mock()]
    mock_embedding_response.data[0].embedding = [0.1, 0.2, 0.3]  # Mock embedding
    mock_openai_client.embeddings.create.return_value = mock_embedding_response
    
    # Mock the Qdrant client
    mock_qdrant_client = Mock()
    
    # Create mock hits with different similarity scores
    mock_hit_high = Mock()
    mock_hit_high.score = 0.85  # High similarity
    mock_hit_high.payload = {"text": "High similarity chunk"}
    
    mock_hit_medium = Mock()
    mock_hit_medium.score = 0.75  # Medium similarity
    mock_hit_medium.payload = {"text": "Medium similarity chunk"}
    
    mock_hit_low = Mock()
    mock_hit_low.score = 0.65  # Low similarity (below threshold)
    mock_hit_low.payload = {"text": "Low similarity chunk"}
    
    mock_qdrant_client.search.return_value = [mock_hit_high, mock_hit_medium, mock_hit_low]
    
    # Test with threshold of 0.7
    result = search_qdrant(
        query="test query",
        openai_client=mock_openai_client,
        qdrant_client=mock_qdrant_client,
        collection_name="test_collection",
        similarity_threshold=0.7
    )
    
    # Should only return chunks with score >= 0.7
    expected_chunks = ["High similarity chunk", "Medium similarity chunk"]
    assert result == expected_chunks, f"Expected {expected_chunks}, got {result}"
    
    print("✅ search_qdrant similarity threshold test passed!")

def test_search_qdrant_without_threshold():
    """Test that search_qdrant works with default threshold"""
    
    # Mock the OpenAI client
    mock_openai_client = Mock()
    mock_embedding_response = Mock()
    mock_embedding_response.data = [Mock()]
    mock_embedding_response.data[0].embedding = [0.1, 0.2, 0.3]
    mock_openai_client.embeddings.create.return_value = mock_embedding_response
    
    # Mock the Qdrant client
    mock_qdrant_client = Mock()
    
    # Create mock hits
    mock_hit_high = Mock()
    mock_hit_high.score = 0.85
    mock_hit_high.payload = {"text": "High similarity chunk"}
    
    mock_hit_low = Mock()
    mock_hit_low.score = 0.65
    mock_hit_low.payload = {"text": "Low similarity chunk"}
    
    mock_qdrant_client.search.return_value = [mock_hit_high, mock_hit_low]
    
    # Test with default threshold (0.7)
    result = search_qdrant(
        query="test query",
        openai_client=mock_openai_client,
        qdrant_client=mock_qdrant_client,
        collection_name="test_collection"
    )
    
    # Should only return the high similarity chunk
    expected_chunks = ["High similarity chunk"]
    assert result == expected_chunks, f"Expected {expected_chunks}, got {result}"
    
    print("✅ search_qdrant default threshold test passed!")

if __name__ == "__main__":
    print("Testing similarity threshold functionality...")
    test_search_qdrant_with_threshold()
    test_search_qdrant_without_threshold()
    print("🎉 All tests passed!") 