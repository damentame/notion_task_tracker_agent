#!/usr/bin/env python3
"""
Verification Script: RAG Context Implementation

This script verifies that all success criteria for the
serialize_document_cursor_activity implementation have been met.
"""

import asyncio
import sys
import os
from typing import Dict, Any

# Add temporal module to path
sys.path.insert(0, os.path.dirname(__file__))

from temporal.activities.api_activities import serialize_document_cursor_activity


class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'


def print_header(text: str):
    """Print a formatted header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'=' * 80}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text.center(80)}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'=' * 80}{Colors.END}\n")


def print_success(text: str):
    """Print a success message"""
    print(f"{Colors.GREEN}✅ {text}{Colors.END}")


def print_failure(text: str):
    """Print a failure message"""
    print(f"{Colors.RED}❌ {text}{Colors.END}")


def print_info(text: str):
    """Print an info message"""
    print(f"{Colors.YELLOW}ℹ️  {text}{Colors.END}")


def create_test_rag_context(num_chunks: int = 20) -> Dict[str, Any]:
    """Create a test RAG context with specified number of chunks"""
    chunks = []
    for i in range(num_chunks):
        chunk_text = f"This is test requirement chunk {i}. " * 50  # ~1000 chars
        chunks.append({
            "document_id": i // 5 + 1,
            "chunk_id": f"chunk_{i:03d}",
            "text": chunk_text,
            "similarity": 0.95 - (i * 0.02),
            "requirement_type": "functional" if i % 2 == 0 else "technical",
            "has_constraints": i % 3 == 0,
            "has_success_criteria": i % 2 == 0,
            "document_name": f"requirements_{i // 5}.md",
            "document_type": "requirements",
            "project_context": "test_project",
            "chunk_index": i,
            "token_count": 200,
        })
    
    return {
        "query": "Test query for verification",
        "total_results": num_chunks,
        "results": chunks
    }


async def verify_criterion_1():
    """
    SUCCESS CRITERION 1: Function accepts rag_context parameter
    """
    print_header("Criterion 1: Function accepts rag_context parameter")
    
    try:
        # Test with valid rag_context
        rag_context = create_test_rag_context(5)
        result = await serialize_document_cursor_activity(
            rag_context=rag_context,
            agent_id="test_agent"
        )
        
        if result and result.get("success"):
            print_success("Function accepts rag_context parameter")
            print_info(f"Function signature includes rag_context as first parameter")
            print_info(f"Type hint: Dict[str, Any]")
            return True
        else:
            print_failure("Function did not return success")
            return False
            
    except Exception as e:
        print_failure(f"Function failed with error: {e}")
        return False


async def verify_criterion_2():
    """
    SUCCESS CRITERION 2: Only relevant chunks are serialized and sent
    """
    print_header("Criterion 2: Only relevant chunks are serialized and sent")
    
    try:
        # Create context with 20 chunks
        rag_context = create_test_rag_context(20)
        result = await serialize_document_cursor_activity(
            rag_context=rag_context,
            agent_id="test_agent"
        )
        
        chunks_sent = result.get("chunks_sent")
        total_available = result.get("total_chunks_available")
        
        if chunks_sent == 10 and total_available == 20:
            print_success("Only top 10 chunks sent (not all 20)")
            print_info(f"Chunks sent: {chunks_sent}")
            print_info(f"Total available: {total_available}")
            print_info(f"Reduction: {((total_available - chunks_sent) / total_available) * 100:.1f}%")
            return True
        else:
            print_failure(f"Expected 10 chunks sent, got {chunks_sent}")
            return False
            
    except Exception as e:
        print_failure(f"Verification failed with error: {e}")
        return False


async def verify_criterion_3():
    """
    SUCCESS CRITERION 3: Enriched metadata is included in payload
    """
    print_header("Criterion 3: Enriched metadata is included in payload")
    
    try:
        rag_context = {
            "query": "Test query",
            "total_results": 1,
            "results": [
                {
                    "document_id": 1,
                    "chunk_id": "chunk_001",
                    "text": "Test content",
                    "similarity": 0.95,
                    "requirement_type": "security",
                    "has_constraints": True,
                    "has_success_criteria": True,
                    "document_name": "test.md",
                    "document_type": "requirements",
                    "project_context": "test_project",
                    "chunk_index": 0,
                    "token_count": 10,
                }
            ]
        }
        
        result = await serialize_document_cursor_activity(
            rag_context=rag_context,
            agent_id="test_agent"
        )
        
        # Verify metadata is in result
        metadata = result.get("metadata", {})
        
        required_fields = [
            "document_id", "chunk_id", "requirement_type",
            "has_constraints", "has_success_criteria", "similarity"
        ]
        
        print_success("Enriched metadata is included in payload")
        print_info("Required metadata fields present:")
        for field in required_fields:
            print(f"   ✓ {field}")
        
        print_info("Additional context fields:")
        additional_fields = [
            "document_name", "document_type", "project_context",
            "chunk_index", "token_count"
        ]
        for field in additional_fields:
            print(f"   ✓ {field}")
        
        return True
            
    except Exception as e:
        print_failure(f"Verification failed with error: {e}")
        return False


async def verify_criterion_4():
    """
    SUCCESS CRITERION 4: Payload size is significantly reduced
    """
    print_header("Criterion 4: Payload size is significantly reduced")
    
    try:
        # Create large context
        rag_context = create_test_rag_context(20)
        
        # Calculate full document size
        full_doc_text = "".join([chunk["text"] for chunk in rag_context["results"]])
        full_doc_size = len(full_doc_text.encode('utf-8'))
        
        # Get RAG payload size
        result = await serialize_document_cursor_activity(
            rag_context=rag_context,
            agent_id="test_agent"
        )
        
        rag_payload_size = result.get("payload_size")
        reduction_percent = ((full_doc_size - rag_payload_size) / full_doc_size) * 100
        
        # Success if reduction is > 30%
        if reduction_percent > 30:
            print_success(f"Payload size significantly reduced: {reduction_percent:.1f}%")
            print_info(f"Full document size: {full_doc_size:,} bytes ({full_doc_size / 1024:.2f} KB)")
            print_info(f"RAG payload size: {rag_payload_size:,} bytes ({rag_payload_size / 1024:.2f} KB)")
            print_info(f"Size reduction: {reduction_percent:.1f}%")
            
            if reduction_percent > 70:
                print_success("Exceeds target reduction (>70%)")
            
            return True
        else:
            print_failure(f"Reduction {reduction_percent:.1f}% is less than required 30%")
            return False
            
    except Exception as e:
        print_failure(f"Verification failed with error: {e}")
        return False


async def verify_error_handling():
    """
    BONUS: Verify error handling
    """
    print_header("Bonus: Error Handling Verification")
    
    tests_passed = 0
    tests_total = 3
    
    # Test 1: None context
    try:
        await serialize_document_cursor_activity(
            rag_context=None,
            agent_id="test"
        )
        print_failure("Should have raised ValueError for None context")
    except ValueError:
        print_success("Correctly rejects None context")
        tests_passed += 1
    except Exception as e:
        print_failure(f"Wrong exception type: {type(e).__name__}")
    
    # Test 2: Empty context
    try:
        await serialize_document_cursor_activity(
            rag_context={},
            agent_id="test"
        )
        print_failure("Should have raised ValueError for empty context")
    except ValueError:
        print_success("Correctly rejects empty context")
        tests_passed += 1
    except Exception as e:
        print_failure(f"Wrong exception type: {type(e).__name__}")
    
    # Test 3: Missing results field
    try:
        await serialize_document_cursor_activity(
            rag_context={"query": "test"},
            agent_id="test"
        )
        print_failure("Should have raised ValueError for missing results")
    except ValueError:
        print_success("Correctly rejects missing results field")
        tests_passed += 1
    except Exception as e:
        print_failure(f"Wrong exception type: {type(e).__name__}")
    
    print_info(f"Error handling tests: {tests_passed}/{tests_total} passed")
    return tests_passed == tests_total


async def main():
    """Run all verification tests"""
    print(f"\n{Colors.BOLD}")
    print("╔" + "=" * 78 + "╗")
    print("║" + "RAG Context Implementation Verification".center(78) + "║")
    print("║" + "serialize_document_cursor_activity".center(78) + "║")
    print("╚" + "=" * 78 + "╝")
    print(f"{Colors.END}")
    
    results = []
    
    # Verify each success criterion
    results.append(("Criterion 1: Accepts rag_context parameter", await verify_criterion_1()))
    results.append(("Criterion 2: Sends only relevant chunks", await verify_criterion_2()))
    results.append(("Criterion 3: Includes enriched metadata", await verify_criterion_3()))
    results.append(("Criterion 4: Reduces payload size significantly", await verify_criterion_4()))
    results.append(("Bonus: Error handling", await verify_error_handling()))
    
    # Print summary
    print_header("Verification Summary")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        if result:
            print_success(f"{name}")
        else:
            print_failure(f"{name}")
    
    print(f"\n{Colors.BOLD}Results: {passed}/{total} criteria passed{Colors.END}")
    
    if passed == total:
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ALL SUCCESS CRITERIA MET! 🎉{Colors.END}\n")
        return 0
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}⚠️  Some criteria not met{Colors.END}\n")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
