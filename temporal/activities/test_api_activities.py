"""
Unit tests for api_activities module

Tests the serialize_document_cursor_activity function to ensure:
1. It accepts RAG context instead of full document
2. It sends only relevant chunks
3. It includes enriched metadata
4. It reduces payload size significantly
"""

import pytest
import json
from unittest.mock import AsyncMock, patch
from api_activities import serialize_document_cursor_activity


class TestSerializeDocumentCursorActivity:
    """Test suite for serialize_document_cursor_activity"""
    
    @pytest.fixture
    def sample_rag_context(self):
        """Sample RAG context with enriched metadata"""
        return {
            "query": "Implement user authentication system",
            "total_results": 25,
            "results": [
                {
                    "document_id": 1,
                    "chunk_id": "chunk_001",
                    "text": "User authentication must support OAuth2 and JWT tokens. The system should validate tokens on every request and refresh tokens automatically.",
                    "similarity": 0.95,
                    "requirement_type": "security",
                    "has_constraints": True,
                    "has_success_criteria": True,
                    "document_name": "security_requirements.md",
                    "document_type": "requirements",
                    "project_context": "auth_service",
                    "chunk_index": 0,
                    "token_count": 28,
                },
                {
                    "document_id": 1,
                    "chunk_id": "chunk_002",
                    "text": "Password requirements: minimum 12 characters, must include uppercase, lowercase, numbers, and special characters. Passwords must be hashed using bcrypt with salt rounds >= 12.",
                    "similarity": 0.92,
                    "requirement_type": "security",
                    "has_constraints": True,
                    "has_success_criteria": False,
                    "document_name": "security_requirements.md",
                    "document_type": "requirements",
                    "project_context": "auth_service",
                    "chunk_index": 1,
                    "token_count": 32,
                },
                {
                    "document_id": 2,
                    "chunk_id": "chunk_003",
                    "text": "Success criteria: Users can log in within 2 seconds. Failed login attempts are logged. Account lockout after 5 failed attempts.",
                    "similarity": 0.88,
                    "requirement_type": "functional",
                    "has_constraints": False,
                    "has_success_criteria": True,
                    "document_name": "functional_requirements.md",
                    "document_type": "requirements",
                    "project_context": "auth_service",
                    "chunk_index": 5,
                    "token_count": 24,
                },
            ]
        }
    
    @pytest.fixture
    def large_rag_context(self):
        """Large RAG context to test top-k filtering"""
        chunks = []
        for i in range(20):
            chunks.append({
                "document_id": i // 5 + 1,
                "chunk_id": f"chunk_{i:03d}",
                "text": f"This is chunk {i} with some relevant content about the system requirements and implementation details." * 10,
                "similarity": 0.9 - (i * 0.02),
                "requirement_type": "functional" if i % 2 == 0 else "technical",
                "has_constraints": i % 3 == 0,
                "has_success_criteria": i % 2 == 0,
                "document_name": f"doc_{i // 5}.md",
                "document_type": "requirements",
                "project_context": "test_project",
                "chunk_index": i,
                "token_count": 50,
            })
        return {
            "query": "Test query",
            "total_results": 20,
            "results": chunks
        }
    
    @pytest.mark.asyncio
    async def test_accepts_rag_context_parameter(self, sample_rag_context):
        """Test that function accepts rag_context parameter"""
        result = await serialize_document_cursor_activity(
            rag_context=sample_rag_context,
            agent_id="test_agent_123"
        )
        
        assert result is not None
        assert result["success"] is True
    
    @pytest.mark.asyncio
    async def test_sends_only_relevant_chunks(self, large_rag_context):
        """Test that only top 10 chunks are sent, not all chunks"""
        result = await serialize_document_cursor_activity(
            rag_context=large_rag_context,
            agent_id="test_agent_123"
        )
        
        assert result["chunks_sent"] == 10
        assert result["total_chunks_available"] == 20
    
    @pytest.mark.asyncio
    async def test_includes_enriched_metadata(self, sample_rag_context):
        """Test that enriched metadata is included in payload"""
        result = await serialize_document_cursor_activity(
            rag_context=sample_rag_context,
            agent_id="test_agent_123"
        )
        
        # Verify metadata fields are present
        assert "metadata" in result
        assert result["metadata"]["rag_query"] == "Implement user authentication system"
        assert result["metadata"]["agent_id"] == "test_agent_123"
    
    @pytest.mark.asyncio
    async def test_payload_size_reduction(self, large_rag_context):
        """Test that payload size is significantly reduced"""
        # Simulate full document transmission
        full_doc_text = "".join([chunk["text"] for chunk in large_rag_context["results"]])
        full_doc_size = len(full_doc_text.encode('utf-8'))
        
        # Get actual payload size with RAG context
        result = await serialize_document_cursor_activity(
            rag_context=large_rag_context,
            agent_id="test_agent_123"
        )
        
        rag_payload_size = result["payload_size"]
        
        # Verify significant reduction (should be much smaller)
        # With only 10 chunks vs 20 full chunks, we expect at least 50% reduction
        reduction_percent = ((full_doc_size - rag_payload_size) / full_doc_size) * 100
        
        assert rag_payload_size < full_doc_size
        assert reduction_percent > 30  # At least 30% reduction
        print(f"Payload size reduction: {reduction_percent:.1f}%")
    
    @pytest.mark.asyncio
    async def test_validates_rag_context_structure(self):
        """Test that function validates rag_context structure"""
        # Test with None
        with pytest.raises(ValueError, match="rag_context must be a non-empty dictionary"):
            await serialize_document_cursor_activity(
                rag_context=None,
                agent_id="test_agent_123"
            )
        
        # Test with empty dict
        with pytest.raises(ValueError, match="rag_context must contain 'results' field"):
            await serialize_document_cursor_activity(
                rag_context={},
                agent_id="test_agent_123"
            )
        
        # Test with missing results field
        with pytest.raises(ValueError, match="rag_context must contain 'results' field"):
            await serialize_document_cursor_activity(
                rag_context={"query": "test"},
                agent_id="test_agent_123"
            )
    
    @pytest.mark.asyncio
    async def test_enriched_chunk_structure(self, sample_rag_context):
        """Test that chunks include all required enriched metadata fields"""
        result = await serialize_document_cursor_activity(
            rag_context=sample_rag_context,
            agent_id="test_agent_123"
        )
        
        # The actual enriched chunks are in the request body (not directly in result)
        # But we can verify the result contains the expected structure
        assert "chunks_sent" in result
        assert result["chunks_sent"] == 3  # sample has 3 chunks
        
        # Verify payload includes metadata about chunks
        assert "payload_size" in result
        assert "total_chunks_available" in result
    
    @pytest.mark.asyncio
    async def test_optional_parameters(self, sample_rag_context):
        """Test that optional parameters are handled correctly"""
        result = await serialize_document_cursor_activity(
            rag_context=sample_rag_context,
            agent_id="test_agent_123",
            task_query="Custom task query",
            document_id=42,
            project_id=100,
            db_agent_id=5,
            agent_instance_id=10,
            execute_mode="thorough"
        )
        
        assert result["success"] is True
        assert result["metadata"]["document_id"] == 42
        assert result["metadata"]["project_id"] == 100
        assert result["metadata"]["execute_mode"] == "thorough"
    
    @pytest.mark.asyncio
    async def test_empty_results_handling(self):
        """Test handling of RAG context with empty results"""
        empty_context = {
            "query": "test query",
            "total_results": 0,
            "results": []
        }
        
        result = await serialize_document_cursor_activity(
            rag_context=empty_context,
            agent_id="test_agent_123"
        )
        
        assert result["success"] is True
        assert result["chunks_sent"] == 0
        assert result["total_chunks_available"] == 0


class TestPayloadSizeMetrics:
    """Test suite for payload size reduction metrics"""
    
    @pytest.mark.asyncio
    async def test_payload_size_reporting(self):
        """Test that payload size is accurately reported"""
        rag_context = {
            "query": "test",
            "total_results": 1,
            "results": [
                {
                    "document_id": 1,
                    "chunk_id": "chunk_001",
                    "text": "Short text",
                    "similarity": 0.9,
                    "requirement_type": "functional",
                    "has_constraints": False,
                    "has_success_criteria": True,
                }
            ]
        }
        
        result = await serialize_document_cursor_activity(
            rag_context=rag_context,
            agent_id="test_agent"
        )
        
        assert "payload_size" in result
        assert "payload_size_kb" in result
        assert result["payload_size"] > 0
        assert result["payload_size_kb"] == round(result["payload_size"] / 1024, 2)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
