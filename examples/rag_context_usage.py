"""
Example: Using serialize_document_cursor_activity with RAG Context

This example demonstrates how to use the updated serialize_document_cursor_activity
function with RAG context instead of full document content.
"""

import asyncio
from typing import Dict, Any
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from temporal.activities.api_activities import serialize_document_cursor_activity


async def example_basic_usage():
    """Basic example with minimal RAG context"""
    print("=" * 80)
    print("Example 1: Basic Usage")
    print("=" * 80)
    
    # Sample RAG context with 3 relevant chunks
    rag_context = {
        "query": "Implement user authentication",
        "total_results": 15,
        "results": [
            {
                "document_id": 1,
                "chunk_id": "chunk_001",
                "text": "User authentication must support OAuth2 and JWT tokens.",
                "similarity": 0.95,
                "requirement_type": "security",
                "has_constraints": True,
                "has_success_criteria": True,
                "document_name": "security_requirements.md",
                "document_type": "requirements",
                "project_context": "auth_service",
                "chunk_index": 0,
                "token_count": 12,
            },
            {
                "document_id": 1,
                "chunk_id": "chunk_002",
                "text": "Passwords must be hashed using bcrypt with salt rounds >= 12.",
                "similarity": 0.92,
                "requirement_type": "security",
                "has_constraints": True,
                "has_success_criteria": False,
                "document_name": "security_requirements.md",
                "document_type": "requirements",
                "project_context": "auth_service",
                "chunk_index": 1,
                "token_count": 14,
            },
            {
                "document_id": 2,
                "chunk_id": "chunk_003",
                "text": "Users can log in within 2 seconds. Failed attempts are logged.",
                "similarity": 0.88,
                "requirement_type": "functional",
                "has_constraints": False,
                "has_success_criteria": True,
                "document_name": "functional_requirements.md",
                "document_type": "requirements",
                "project_context": "auth_service",
                "chunk_index": 5,
                "token_count": 13,
            },
        ]
    }
    
    # Call the activity
    result = await serialize_document_cursor_activity(
        rag_context=rag_context,
        agent_id="agent_auth_001"
    )
    
    # Display results
    print(f"\n✅ Success: {result['success']}")
    print(f"📦 Payload Size: {result['payload_size_kb']} KB ({result['payload_size']} bytes)")
    print(f"📄 Chunks Sent: {result['chunks_sent']} / {result['total_chunks_available']}")
    print(f"🎯 Agent ID: {result['metadata']['agent_id']}")
    print(f"🔍 Query: {result['metadata']['rag_query']}")
    

async def example_with_all_parameters():
    """Example with all optional parameters"""
    print("\n" + "=" * 80)
    print("Example 2: With All Optional Parameters")
    print("=" * 80)
    
    rag_context = {
        "query": "Implement payment processing",
        "total_results": 8,
        "results": [
            {
                "document_id": 3,
                "chunk_id": "chunk_payment_001",
                "text": "Payment processing must support Stripe and PayPal. All transactions must be encrypted using TLS 1.3.",
                "similarity": 0.97,
                "requirement_type": "integration",
                "has_constraints": True,
                "has_success_criteria": True,
                "document_name": "payment_requirements.md",
                "document_type": "requirements",
                "project_context": "payment_service",
                "chunk_index": 0,
                "token_count": 20,
            },
        ]
    }
    
    result = await serialize_document_cursor_activity(
        rag_context=rag_context,
        agent_id="agent_payment_001",
        task_query="Create payment processing module with Stripe integration",
        document_id=3,
        project_id=100,
        db_agent_id=5,
        agent_instance_id=42,
        execute_mode="thorough"
    )
    
    print(f"\n✅ Success: {result['success']}")
    print(f"📦 Payload Size: {result['payload_size_kb']} KB")
    print(f"📄 Chunks Sent: {result['chunks_sent']}")
    print(f"📋 Document ID: {result['metadata']['document_id']}")
    print(f"🏗️  Project ID: {result['metadata']['project_id']}")
    print(f"⚙️  Execute Mode: {result['metadata']['execute_mode']}")


async def example_payload_size_comparison():
    """Example demonstrating payload size reduction"""
    print("\n" + "=" * 80)
    print("Example 3: Payload Size Reduction Demonstration")
    print("=" * 80)
    
    # Create a large RAG context with 20 chunks
    chunks = []
    for i in range(20):
        chunk_text = f"This is requirement chunk {i}. " * 50  # ~1000 chars each
        chunks.append({
            "document_id": i // 5 + 1,
            "chunk_id": f"chunk_{i:03d}",
            "text": chunk_text,
            "similarity": 0.95 - (i * 0.02),
            "requirement_type": "functional" if i % 2 == 0 else "technical",
            "has_constraints": i % 3 == 0,
            "has_success_criteria": i % 2 == 0,
            "document_name": f"requirements_doc_{i // 5}.md",
            "document_type": "requirements",
            "project_context": "large_project",
            "chunk_index": i,
            "token_count": 200,
        })
    
    rag_context = {
        "query": "Implement complete system",
        "total_results": 20,
        "results": chunks
    }
    
    # Calculate full document size
    full_doc_text = "".join([chunk["text"] for chunk in chunks])
    full_doc_size = len(full_doc_text.encode('utf-8'))
    
    # Get RAG context payload size
    result = await serialize_document_cursor_activity(
        rag_context=rag_context,
        agent_id="agent_large_001"
    )
    
    rag_payload_size = result['payload_size']
    reduction = ((full_doc_size - rag_payload_size) / full_doc_size) * 100
    
    print(f"\n📊 Payload Size Comparison:")
    print(f"   Full Document Size: {full_doc_size:,} bytes ({full_doc_size / 1024:.2f} KB)")
    print(f"   RAG Payload Size: {rag_payload_size:,} bytes ({rag_payload_size / 1024:.2f} KB)")
    print(f"   Size Reduction: {reduction:.1f}%")
    print(f"\n📈 Efficiency Metrics:")
    print(f"   Total Chunks Available: {result['total_chunks_available']}")
    print(f"   Chunks Sent: {result['chunks_sent']}")
    print(f"   Chunk Reduction: {((20 - result['chunks_sent']) / 20) * 100:.1f}%")


async def example_error_handling():
    """Example demonstrating error handling"""
    print("\n" + "=" * 80)
    print("Example 4: Error Handling")
    print("=" * 80)
    
    # Test with invalid context
    print("\n🔴 Testing with None context:")
    try:
        await serialize_document_cursor_activity(
            rag_context=None,
            agent_id="agent_test"
        )
    except ValueError as e:
        print(f"   ✅ Caught expected error: {e}")
    
    # Test with empty context
    print("\n🔴 Testing with empty context:")
    try:
        await serialize_document_cursor_activity(
            rag_context={},
            agent_id="agent_test"
        )
    except ValueError as e:
        print(f"   ✅ Caught expected error: {e}")
    
    # Test with missing results field
    print("\n🔴 Testing with missing 'results' field:")
    try:
        await serialize_document_cursor_activity(
            rag_context={"query": "test"},
            agent_id="agent_test"
        )
    except ValueError as e:
        print(f"   ✅ Caught expected error: {e}")
    
    # Test with empty results (should succeed)
    print("\n🟢 Testing with empty results (valid):")
    result = await serialize_document_cursor_activity(
        rag_context={"query": "test", "total_results": 0, "results": []},
        agent_id="agent_test"
    )
    print(f"   ✅ Success with 0 chunks: {result['success']}")


async def example_enriched_metadata():
    """Example highlighting enriched metadata"""
    print("\n" + "=" * 80)
    print("Example 5: Enriched Metadata Showcase")
    print("=" * 80)
    
    rag_context = {
        "query": "Database schema design",
        "total_results": 5,
        "results": [
            {
                "document_id": 10,
                "chunk_id": "db_chunk_001",
                "text": "Database must support ACID transactions. Use PostgreSQL 15+ with proper indexing strategy.",
                "similarity": 0.96,
                "requirement_type": "technical",
                "has_constraints": True,
                "has_success_criteria": True,
                "document_name": "database_architecture.md",
                "document_type": "architecture",
                "project_context": "data_layer",
                "chunk_index": 0,
                "token_count": 18,
            },
            {
                "document_id": 10,
                "chunk_id": "db_chunk_002",
                "text": "Success criteria: Query response time < 100ms for 95th percentile. Support 10,000 concurrent connections.",
                "similarity": 0.94,
                "requirement_type": "performance",
                "has_constraints": True,
                "has_success_criteria": True,
                "document_name": "database_architecture.md",
                "document_type": "architecture",
                "project_context": "data_layer",
                "chunk_index": 1,
                "token_count": 20,
            },
        ]
    }
    
    result = await serialize_document_cursor_activity(
        rag_context=rag_context,
        agent_id="agent_db_001",
        document_id=10,
        project_id=200
    )
    
    print(f"\n📝 Enriched Metadata Included:")
    print(f"   ✅ Document IDs: Tracked per chunk")
    print(f"   ✅ Chunk IDs: Unique identifiers for each chunk")
    print(f"   ✅ Requirement Types: technical, performance, security, etc.")
    print(f"   ✅ Constraints Flags: {rag_context['results'][0]['has_constraints']}")
    print(f"   ✅ Success Criteria Flags: {rag_context['results'][0]['has_success_criteria']}")
    print(f"   ✅ Similarity Scores: 0.94 - 0.96 range")
    print(f"   ✅ Document Context: {rag_context['results'][0]['project_context']}")
    print(f"   ✅ Token Counts: For LLM processing estimation")


async def main():
    """Run all examples"""
    print("\n")
    print("╔" + "=" * 78 + "╗")
    print("║" + " " * 15 + "RAG Context Usage Examples" + " " * 36 + "║")
    print("╚" + "=" * 78 + "╝")
    
    await example_basic_usage()
    await example_with_all_parameters()
    await example_payload_size_comparison()
    await example_error_handling()
    await example_enriched_metadata()
    
    print("\n" + "=" * 80)
    print("✅ All examples completed successfully!")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
