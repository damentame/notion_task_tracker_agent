"""
API Activities for Temporal Workflows

This module contains activities for interacting with external APIs,
including the Cursor agent API with RAG context support.
"""

import logging
from typing import Dict, Any, Optional, List
from temporalio import activity
import json

logger = logging.getLogger(__name__)


def track_activity(func):
    """Decorator for tracking activity execution."""
    async def wrapper(*args, **kwargs):
        logger.info(f"Starting activity: {func.__name__}")
        try:
            result = await func(*args, **kwargs)
            logger.info(f"Completed activity: {func.__name__}")
            return result
        except Exception as e:
            logger.error(f"Error in activity {func.__name__}: {str(e)}")
            raise
    return wrapper


@activity.defn
@track_activity
async def serialize_document_cursor_activity(
    rag_context: Dict[str, Any],
    agent_id: str,
    task_query: Optional[str] = None,
    document_id: Optional[int] = None,
    project_id: Optional[int] = None,
    db_agent_id: Optional[int] = None,
    agent_instance_id: Optional[int] = None,
    execute_mode: str = "fast",
) -> Dict[str, Any]:
    """
    Send enriched RAG context to Cursor agent for deep task generation.
    
    This activity accepts RAG context instead of full document content,
    significantly reducing payload size while maintaining all necessary
    context through relevant chunks and enriched metadata.
    
    Args:
        rag_context: Dictionary containing RAG retrieval results with:
            - results: List of relevant chunks with metadata
            - query: Original search query
            - total_results: Total number of results
        agent_id: Cursor agent identifier
        task_query: Optional task generation query
        document_id: Optional document identifier
        project_id: Optional project identifier
        db_agent_id: Optional database agent identifier
        agent_instance_id: Optional agent instance identifier
        execute_mode: Execution mode (default: "fast")
    
    Returns:
        Dictionary containing:
            - success: Boolean indicating success
            - payload_size: Size of the payload in bytes
            - chunks_sent: Number of chunks included
            - agent_response: Response from Cursor agent
            - metadata: Additional metadata about the operation
    
    Raises:
        ValueError: If rag_context is invalid or missing required fields
        RuntimeError: If API call fails
    """
    try:
        logger.info(f"Sending RAG context to Cursor agent {agent_id}")
        
        # Validate rag_context
        if not rag_context or not isinstance(rag_context, dict):
            raise ValueError("rag_context must be a non-empty dictionary")
        
        if "results" not in rag_context:
            raise ValueError("rag_context must contain 'results' field")
        
        # Extract top chunks (limit to top 10 for optimal performance)
        all_chunks = rag_context.get("results", [])
        top_chunks = all_chunks[:10]
        
        logger.info(f"Processing {len(top_chunks)} relevant chunks from {len(all_chunks)} total results")
        
        # Build enriched chunk payload with metadata
        enriched_chunks = []
        for chunk in top_chunks:
            enriched_chunk = {
                "document_id": chunk.get("document_id"),
                "chunk_id": chunk.get("chunk_id"),
                "text": chunk.get("text", ""),
                "similarity": chunk.get("similarity", 0.0),
                "metadata": {
                    "requirement_type": chunk.get("requirement_type"),
                    "has_constraints": chunk.get("has_constraints", False),
                    "has_success_criteria": chunk.get("has_success_criteria", False),
                    "document_name": chunk.get("document_name"),
                    "document_type": chunk.get("document_type"),
                    "project_context": chunk.get("project_context"),
                    "chunk_index": chunk.get("chunk_index"),
                    "token_count": chunk.get("token_count"),
                }
            }
            enriched_chunks.append(enriched_chunk)
        
        # Build request body with RAG context
        request_body = {
            "agent_id": agent_id,
            "task_query": task_query or rag_context.get("query", ""),
            "rag_context": {
                "chunks": enriched_chunks,
                "total_available": len(all_chunks),
                "chunks_included": len(enriched_chunks),
                "query": rag_context.get("query", ""),
            },
            "metadata": {
                "document_id": document_id,
                "project_id": project_id,
                "db_agent_id": db_agent_id,
                "agent_instance_id": agent_instance_id,
                "execute_mode": execute_mode,
            }
        }
        
        # Calculate payload size
        payload_json = json.dumps(request_body)
        payload_size = len(payload_json.encode('utf-8'))
        
        logger.info(f"Payload size: {payload_size} bytes ({payload_size / 1024:.2f} KB)")
        logger.info(f"Chunks sent: {len(enriched_chunks)}")
        
        # Log payload size reduction metrics
        estimated_full_doc_size = sum(
            len(chunk.get("text", "").encode('utf-8')) 
            for chunk in all_chunks
        )
        if estimated_full_doc_size > 0:
            reduction_percent = ((estimated_full_doc_size - payload_size) / estimated_full_doc_size) * 100
            logger.info(
                f"Payload size reduction: {reduction_percent:.1f}% "
                f"(from ~{estimated_full_doc_size / 1024:.2f} KB to {payload_size / 1024:.2f} KB)"
            )
        
        # TODO: Make actual API call to Cursor agent
        # For now, return a mock response structure
        # In production, this would be replaced with actual HTTP client call
        
        # Simulated API response
        agent_response = {
            "status": "success",
            "agent_id": agent_id,
            "tasks_generated": [],
            "processing_time_ms": 0,
        }
        
        return {
            "success": True,
            "payload_size": payload_size,
            "payload_size_kb": round(payload_size / 1024, 2),
            "chunks_sent": len(enriched_chunks),
            "total_chunks_available": len(all_chunks),
            "agent_response": agent_response,
            "metadata": {
                "document_id": document_id,
                "project_id": project_id,
                "agent_id": agent_id,
                "execute_mode": execute_mode,
                "rag_query": rag_context.get("query", ""),
            }
        }
        
    except ValueError as ve:
        logger.error(f"Validation error in serialize_document_cursor_activity: {str(ve)}")
        raise
    except Exception as e:
        logger.error(f"Error in serialize_document_cursor_activity: {str(e)}")
        raise RuntimeError(f"Failed to serialize RAG context for Cursor agent: {str(e)}")


@activity.defn
@track_activity
async def create_cursor_agent_activity(
    agent_config: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Create a new Cursor agent instance.
    
    Args:
        agent_config: Configuration for the agent
    
    Returns:
        Dictionary with agent creation result
    """
    logger.info("Creating Cursor agent")
    # Placeholder implementation
    return {
        "success": True,
        "agent_id": "mock_agent_id",
        "status": "created"
    }


@activity.defn
@track_activity
async def serialize_document_local_activity(
    document_content: str,
    document_id: int,
    project_id: int
) -> Dict[str, Any]:
    """
    Serialize document for local processing.
    
    Args:
        document_content: Full document content
        document_id: Document identifier
        project_id: Project identifier
    
    Returns:
        Dictionary with serialization result
    """
    logger.info(f"Serializing document {document_id} locally")
    # Placeholder implementation
    return {
        "success": True,
        "document_id": document_id,
        "size": len(document_content)
    }


@activity.defn
@track_activity
async def persist_generated_tasks_activity(
    tasks: List[Dict[str, Any]],
    project_id: int
) -> Dict[str, Any]:
    """
    Persist generated tasks to database.
    
    Args:
        tasks: List of task dictionaries
        project_id: Project identifier
    
    Returns:
        Dictionary with persistence result
    """
    logger.info(f"Persisting {len(tasks)} tasks for project {project_id}")
    # Placeholder implementation
    return {
        "success": True,
        "tasks_persisted": len(tasks)
    }
