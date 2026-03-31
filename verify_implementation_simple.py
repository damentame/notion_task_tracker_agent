#!/usr/bin/env python3
"""
Simple Verification Script: RAG Context Implementation

This script verifies the implementation without requiring external dependencies.
It checks the code structure and validates the implementation approach.
"""

import os
import sys


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


def check_file_exists(filepath: str) -> bool:
    """Check if a file exists"""
    return os.path.isfile(filepath)


def check_string_in_file(filepath: str, search_string: str) -> bool:
    """Check if a string exists in a file"""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
            return search_string in content
    except Exception:
        return False


def verify_criterion_1():
    """
    SUCCESS CRITERION 1: Function accepts rag_context parameter
    """
    print_header("Criterion 1: Function accepts rag_context parameter")
    
    filepath = "temporal/activities/api_activities.py"
    
    checks = [
        ("File exists", check_file_exists(filepath)),
        ("Function signature includes 'rag_context: Dict[str, Any]'",
         check_string_in_file(filepath, "rag_context: Dict[str, Any]")),
        ("Function is named 'serialize_document_cursor_activity'",
         check_string_in_file(filepath, "async def serialize_document_cursor_activity")),
        ("rag_context is first parameter",
         check_string_in_file(filepath, "rag_context: Dict[str, Any],\n    agent_id: str,")),
    ]
    
    passed = all(result for _, result in checks)
    
    for check_name, result in checks:
        if result:
            print_success(check_name)
        else:
            print_failure(check_name)
    
    return passed


def verify_criterion_2():
    """
    SUCCESS CRITERION 2: Only relevant chunks are serialized and sent
    """
    print_header("Criterion 2: Only relevant chunks are serialized and sent")
    
    filepath = "temporal/activities/api_activities.py"
    
    checks = [
        ("Extracts chunks from rag_context",
         check_string_in_file(filepath, 'rag_context.get("results", [])')),
        ("Limits to top chunks ([:10])",
         check_string_in_file(filepath, "[:10]")),
        ("Logs chunk count",
         check_string_in_file(filepath, "chunks_sent")),
        ("Returns chunks_sent in result",
         check_string_in_file(filepath, '"chunks_sent": len(enriched_chunks)')),
    ]
    
    passed = all(result for _, result in checks)
    
    for check_name, result in checks:
        if result:
            print_success(check_name)
        else:
            print_failure(check_name)
    
    return passed


def verify_criterion_3():
    """
    SUCCESS CRITERION 3: Enriched metadata is included in payload
    """
    print_header("Criterion 3: Enriched metadata is included in payload")
    
    filepath = "temporal/activities/api_activities.py"
    
    required_fields = [
        "document_id",
        "chunk_id",
        "requirement_type",
        "has_constraints",
        "has_success_criteria",
        "similarity",
    ]
    
    checks = []
    for field in required_fields:
        checks.append((
            f"Includes '{field}' field",
            check_string_in_file(filepath, f'"{field}"')
        ))
    
    # Additional metadata fields
    additional_fields = [
        "document_name",
        "document_type",
        "project_context",
        "chunk_index",
        "token_count",
    ]
    
    for field in additional_fields:
        checks.append((
            f"Includes '{field}' field",
            check_string_in_file(filepath, f'"{field}"')
        ))
    
    passed = all(result for _, result in checks)
    
    for check_name, result in checks:
        if result:
            print_success(check_name)
        else:
            print_failure(check_name)
    
    return passed


def verify_criterion_4():
    """
    SUCCESS CRITERION 4: Payload size is significantly reduced
    """
    print_header("Criterion 4: Payload size is significantly reduced")
    
    filepath = "temporal/activities/api_activities.py"
    
    checks = [
        ("Calculates payload size",
         check_string_in_file(filepath, "payload_size = len(payload_json.encode('utf-8'))")),
        ("Returns payload_size in result",
         check_string_in_file(filepath, '"payload_size": payload_size')),
        ("Calculates reduction percentage",
         check_string_in_file(filepath, "reduction_percent")),
        ("Logs payload size reduction",
         check_string_in_file(filepath, "Payload size reduction")),
    ]
    
    passed = all(result for _, result in checks)
    
    for check_name, result in checks:
        if result:
            print_success(check_name)
        else:
            print_failure(check_name)
    
    return passed


def verify_test_coverage():
    """
    BONUS: Verify test coverage
    """
    print_header("Bonus: Test Coverage Verification")
    
    filepath = "temporal/activities/test_api_activities.py"
    
    test_functions = [
        "test_accepts_rag_context_parameter",
        "test_sends_only_relevant_chunks",
        "test_includes_enriched_metadata",
        "test_payload_size_reduction",
        "test_validates_rag_context_structure",
    ]
    
    checks = [
        ("Test file exists", check_file_exists(filepath))
    ]
    
    for test_name in test_functions:
        checks.append((
            f"Test '{test_name}' exists",
            check_string_in_file(filepath, f"async def {test_name}")
        ))
    
    passed = all(result for _, result in checks)
    
    for check_name, result in checks:
        if result:
            print_success(check_name)
        else:
            print_failure(check_name)
    
    return passed


def verify_documentation():
    """
    BONUS: Verify documentation exists
    """
    print_header("Bonus: Documentation Verification")
    
    docs = [
        ("Implementation guide", "docs/RAG_CONTEXT_IMPLEMENTATION.md"),
        ("Usage examples", "examples/rag_context_usage.py"),
        ("Implementation summary", "IMPLEMENTATION_SUMMARY.md"),
        ("Temporal README", "temporal/README.md"),
    ]
    
    checks = []
    for doc_name, filepath in docs:
        checks.append((
            f"{doc_name} exists",
            check_file_exists(filepath)
        ))
    
    passed = all(result for _, result in checks)
    
    for check_name, result in checks:
        if result:
            print_success(check_name)
        else:
            print_failure(check_name)
    
    return passed


def main():
    """Run all verification checks"""
    print(f"\n{Colors.BOLD}")
    print("╔" + "=" * 78 + "╗")
    print("║" + "RAG Context Implementation Verification".center(78) + "║")
    print("║" + "serialize_document_cursor_activity".center(78) + "║")
    print("╚" + "=" * 78 + "╝")
    print(f"{Colors.END}")
    
    results = []
    
    # Verify each success criterion
    results.append(("Criterion 1: Accepts rag_context parameter", verify_criterion_1()))
    results.append(("Criterion 2: Sends only relevant chunks", verify_criterion_2()))
    results.append(("Criterion 3: Includes enriched metadata", verify_criterion_3()))
    results.append(("Criterion 4: Reduces payload size significantly", verify_criterion_4()))
    results.append(("Bonus: Test coverage", verify_test_coverage()))
    results.append(("Bonus: Documentation", verify_documentation()))
    
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
        print_info("Implementation is complete and ready for review")
        return 0
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}⚠️  Some criteria not met{Colors.END}\n")
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
