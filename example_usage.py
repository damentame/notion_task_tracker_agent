"""
Example usage of the Task Schema Validator

This file demonstrates practical usage scenarios for the task schema validator
with constraint and success criteria extraction.
"""

from task_schema_validator import create_validator, RAGChunk


def example_1_basic_validation():
    """Example 1: Basic task validation without RAG chunks"""
    print("=" * 60)
    print("Example 1: Basic Task Validation")
    print("=" * 60)
    
    validator = create_validator()
    
    # A complete, valid task
    task = {
        'task_name': 'Implement user authentication',
        'task_type': 'implementation',
        'description': 'Add JWT-based authentication to the API',
        'parameters': {'auth_type': 'JWT', 'token_expiry': '30m'},
        'status': 'PENDING',
        'priority': 1,
        'task_notes': 'High priority security feature',
        'task_data': {
            'requirement_snippets': ['User authentication is required'],
            'requirement_type': 'functional',
            'constraints': ['Must use JWT', 'Token expiry 30 minutes'],
            'success_criteria': ['User can login', 'Token is validated'],
            'execution_complexity': 'complex',
            'project_id': 1,
            'document_ids': [1],
            'chunk_ids': [10],
            'dependencies': []
        }
    }
    
    result = validator.validate_task(task)
    
    if result.is_valid:
        print("✓ Task is valid!")
    else:
        print("✗ Task validation failed:")
        for error in result.errors:
            print(f"  - {error}")
    
    print()


def example_2_constraint_extraction():
    """Example 2: Extract constraints from RAG chunks"""
    print("=" * 60)
    print("Example 2: Constraint Extraction")
    print("=" * 60)
    
    validator = create_validator()
    
    # Task with empty constraints
    task = {
        'task_name': 'Build API endpoint',
        'task_type': 'implementation',
        'description': 'Create REST API endpoint',
        'parameters': {},
        'status': 'PENDING',
        'priority': 2,
        'task_notes': '',
        'task_data': {
            'requirement_snippets': [],
            'requirement_type': 'functional',
            'constraints': [],  # Empty - will be populated by validator
            'success_criteria': [],
            'execution_complexity': 'fast',
            'project_id': 1,
            'document_ids': [1],
            'chunk_ids': [1],
            'dependencies': []
        }
    }
    
    # RAG chunk with constraints
    chunk = RAGChunk(
        chunk_id=1,
        chunk_text="""
        The API must support HTTPS only.
        Response time must not exceed 200ms.
        The system shall comply with REST standards.
        Maximum payload size is limited to 10MB.
        """,
        document_id=1,
        project_id=1,
        has_constraints=True,
        has_success_criteria=False
    )
    
    enriched_task, result = validator.validate_and_enrich_task(task, [chunk])
    
    print(f"Extracted {len(result.extracted_constraints)} constraints:")
    for i, constraint in enumerate(result.extracted_constraints, 1):
        print(f"  {i}. {constraint}")
    
    print(f"\nTask now contains {len(enriched_task['task_data']['constraints'])} constraints")
    print()


def example_3_success_criteria_extraction():
    """Example 3: Extract success criteria from RAG chunks"""
    print("=" * 60)
    print("Example 3: Success Criteria Extraction")
    print("=" * 60)
    
    validator = create_validator()
    
    task = {
        'task_name': 'User login feature',
        'task_type': 'feature',
        'description': 'Implement user login',
        'parameters': {},
        'status': 'PENDING',
        'priority': 1,
        'task_notes': '',
        'task_data': {
            'requirement_snippets': [],
            'requirement_type': 'functional',
            'constraints': [],
            'success_criteria': [],  # Empty - will be populated
            'execution_complexity': 'complex',
            'project_id': 1,
            'document_ids': [1],
            'chunk_ids': [2],
            'dependencies': []
        }
    }
    
    # RAG chunk with success criteria
    chunk = RAGChunk(
        chunk_id=2,
        chunk_text="""
        Acceptance criteria:
        - User must be able to login with email and password
        - System should validate credentials against database
        - Invalid login must return appropriate error message
        - Successful login should generate JWT token
        Given a registered user, when they enter valid credentials,
        then they should be authenticated successfully.
        """,
        document_id=1,
        project_id=1,
        has_constraints=False,
        has_success_criteria=True
    )
    
    enriched_task, result = validator.validate_and_enrich_task(task, [chunk])
    
    print(f"Extracted {len(result.extracted_success_criteria)} success criteria:")
    for i, criterion in enumerate(result.extracted_success_criteria, 1):
        print(f"  {i}. {criterion}")
    
    print(f"\nTask now contains {len(enriched_task['task_data']['success_criteria'])} criteria")
    print()


def example_4_multiple_chunks():
    """Example 4: Aggregate data from multiple RAG chunks"""
    print("=" * 60)
    print("Example 4: Multiple RAG Chunks")
    print("=" * 60)
    
    validator = create_validator()
    
    task = {
        'task_name': 'Complete authentication system',
        'task_type': 'feature',
        'description': 'Full authentication implementation',
        'parameters': {},
        'status': 'PENDING',
        'priority': 1,
        'task_notes': 'Combines multiple requirements',
        'task_data': {
            'requirement_snippets': [],
            'requirement_type': 'functional',
            'constraints': [],
            'success_criteria': [],
            'execution_complexity': 'complex',
            'project_id': 1,
            'document_ids': [1, 2],
            'chunk_ids': [1, 2, 3],
            'dependencies': []
        }
    }
    
    chunks = [
        RAGChunk(
            chunk_id=1,
            chunk_text="System must use TLS 1.3 encryption. Passwords must be hashed with bcrypt.",
            document_id=1,
            project_id=1,
            has_constraints=True,
            has_success_criteria=False
        ),
        RAGChunk(
            chunk_id=2,
            chunk_text="Session timeout shall not exceed 30 minutes. Rate limiting is required.",
            document_id=1,
            project_id=1,
            has_constraints=True,
            has_success_criteria=False
        ),
        RAGChunk(
            chunk_id=3,
            chunk_text="User must be able to login and logout. System should validate all inputs.",
            document_id=2,
            project_id=1,
            has_constraints=False,
            has_success_criteria=True
        )
    ]
    
    enriched_task, result = validator.validate_and_enrich_task(task, chunks)
    
    print(f"Extracted from {len(chunks)} chunks:")
    print(f"  Constraints: {len(result.extracted_constraints)}")
    print(f"  Success Criteria: {len(result.extracted_success_criteria)}")
    
    print("\nConstraints:")
    for constraint in enriched_task['task_data']['constraints']:
        print(f"  - {constraint}")
    
    print("\nSuccess Criteria:")
    for criterion in enriched_task['task_data']['success_criteria']:
        print(f"  - {criterion}")
    
    print()


def example_5_validation_errors():
    """Example 5: Handling validation errors"""
    print("=" * 60)
    print("Example 5: Validation Errors")
    print("=" * 60)
    
    validator = create_validator()
    
    # Incomplete task with missing required fields
    incomplete_task = {
        'task_name': 'Incomplete task',
        'description': 'Missing several required fields',
        'priority': 0  # Invalid: must be >= 1
    }
    
    result = validator.validate_task(incomplete_task)
    
    print(f"Validation result: {'✓ Valid' if result.is_valid else '✗ Invalid'}")
    
    if result.errors:
        print(f"\nFound {len(result.errors)} errors:")
        for error in result.errors:
            print(f"  - {error}")
    
    print()


def example_6_implied_constraints():
    """Example 6: Detecting implied constraints and criteria"""
    print("=" * 60)
    print("Example 6: Implied Constraints Detection")
    print("=" * 60)
    
    validator = create_validator()
    
    task = {
        'task_name': 'Security implementation',
        'task_type': 'implementation',
        'description': 'Implement security features',
        'parameters': {},
        'status': 'PENDING',
        'priority': 1,
        'task_notes': '',
        'task_data': {
            'requirement_snippets': [],
            'requirement_type': 'security',
            'constraints': [],
            'success_criteria': [],
            'execution_complexity': 'complex',
            'project_id': 1,
            'document_ids': [1],
            'chunk_ids': [1],
            'dependencies': []
        }
    }
    
    # Chunk not marked but contains constraint language
    chunk = RAGChunk(
        chunk_id=1,
        chunk_text="""
        The API must not allow unauthorized access.
        All data must be encrypted at rest.
        User should be able to enable two-factor authentication.
        """,
        document_id=1,
        project_id=1,
        has_constraints=False,  # Not marked!
        has_success_criteria=False  # Not marked!
    )
    
    enriched_task, result = validator.validate_and_enrich_task(task, [chunk])
    
    print(f"Extracted {len(result.extracted_constraints)} constraints (implied)")
    print(f"Extracted {len(result.extracted_success_criteria)} success criteria (implied)")
    
    if result.warnings:
        print(f"\nWarnings ({len(result.warnings)}):")
        for warning in result.warnings:
            print(f"  ⚠ {warning}")
    
    print()


def example_7_bdd_style_criteria():
    """Example 7: BDD-style success criteria"""
    print("=" * 60)
    print("Example 7: BDD-Style Success Criteria")
    print("=" * 60)
    
    validator = create_validator()
    
    task = {
        'task_name': 'Shopping cart feature',
        'task_type': 'feature',
        'description': 'Implement shopping cart',
        'parameters': {},
        'status': 'PENDING',
        'priority': 2,
        'task_notes': '',
        'task_data': {
            'requirement_snippets': [],
            'requirement_type': 'functional',
            'constraints': [],
            'success_criteria': [],
            'execution_complexity': 'complex',
            'project_id': 1,
            'document_ids': [1],
            'chunk_ids': [1],
            'dependencies': []
        }
    }
    
    # BDD-style requirements
    chunk = RAGChunk(
        chunk_id=1,
        chunk_text="""
        Given a user with items in cart
        When they proceed to checkout
        Then they should see order summary
        And they should be able to complete purchase
        
        Given an empty cart
        When user tries to checkout
        Then system should display error message
        """,
        document_id=1,
        project_id=1,
        has_constraints=False,
        has_success_criteria=True
    )
    
    enriched_task, result = validator.validate_and_enrich_task(task, [chunk])
    
    print(f"Extracted {len(result.extracted_success_criteria)} BDD-style criteria:")
    for i, criterion in enumerate(result.extracted_success_criteria, 1):
        print(f"  {i}. {criterion}")
    
    print()


def example_8_real_world_scenario():
    """Example 8: Real-world task generation scenario"""
    print("=" * 60)
    print("Example 8: Real-World Scenario")
    print("=" * 60)
    
    validator = create_validator()
    
    # Simulating a real requirement document
    requirement_text = """
    User Authentication System Requirements
    
    The system must implement secure user authentication using industry-standard practices.
    
    Security Constraints:
    - Passwords must be hashed using bcrypt with minimum 10 rounds
    - Session tokens must expire after 30 minutes of inactivity
    - The system shall enforce HTTPS for all authentication endpoints
    - Maximum login attempts are limited to 5 per hour per IP
    - Multi-factor authentication is required for admin users
    
    Acceptance Criteria:
    - User must be able to register with email and password
    - User must be able to login with valid credentials
    - System should validate password strength (min 8 chars, 1 uppercase, 1 number)
    - Invalid login attempts must be logged
    - User should receive email confirmation after registration
    - Password reset functionality must be available
    
    When a user exceeds maximum login attempts, then their account should be temporarily locked.
    Given a valid session token, when user makes authenticated request, then system should grant access.
    """
    
    # Create task structure
    task = {
        'task_name': 'Implement User Authentication System',
        'task_type': 'feature',
        'description': 'Complete implementation of secure user authentication',
        'parameters': {
            'includes': ['registration', 'login', 'password_reset', 'mfa']
        },
        'status': 'PENDING',
        'priority': 1,
        'task_notes': 'Critical security feature - requires thorough testing',
        'task_data': {
            'requirement_snippets': [requirement_text],
            'requirement_type': 'functional',
            'constraints': [],
            'success_criteria': [],
            'execution_complexity': 'complex',
            'project_id': 1,
            'document_ids': [1],
            'chunk_ids': [1],
            'dependencies': ['Setup database schema', 'Configure email service']
        }
    }
    
    # Create RAG chunk from requirement
    chunk = RAGChunk(
        chunk_id=1,
        chunk_text=requirement_text,
        document_id=1,
        project_id=1,
        has_constraints=True,
        has_success_criteria=True,
        requirement_type='functional',
        priority_indicators='critical'
    )
    
    # Validate and enrich
    enriched_task, result = validator.validate_and_enrich_task(task, [chunk])
    
    print(f"Task: {enriched_task['task_name']}")
    print(f"Status: {'✓ Valid' if result.is_valid else '✗ Invalid'}")
    print(f"Priority: {enriched_task['priority']}")
    print(f"Complexity: {enriched_task['task_data']['execution_complexity']}")
    
    print(f"\nExtracted {len(result.extracted_constraints)} Constraints:")
    for i, constraint in enumerate(result.extracted_constraints[:5], 1):  # Show first 5
        print(f"  {i}. {constraint}")
    if len(result.extracted_constraints) > 5:
        print(f"  ... and {len(result.extracted_constraints) - 5} more")
    
    print(f"\nExtracted {len(result.extracted_success_criteria)} Success Criteria:")
    for i, criterion in enumerate(result.extracted_success_criteria[:5], 1):  # Show first 5
        print(f"  {i}. {criterion}")
    if len(result.extracted_success_criteria) > 5:
        print(f"  ... and {len(result.extracted_success_criteria) - 5} more")
    
    print(f"\nDependencies: {', '.join(enriched_task['task_data']['dependencies'])}")
    
    print()


def main():
    """Run all examples"""
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 10 + "TASK SCHEMA VALIDATOR EXAMPLES" + " " * 17 + "║")
    print("╚" + "=" * 58 + "╝")
    print()
    
    example_1_basic_validation()
    example_2_constraint_extraction()
    example_3_success_criteria_extraction()
    example_4_multiple_chunks()
    example_5_validation_errors()
    example_6_implied_constraints()
    example_7_bdd_style_criteria()
    example_8_real_world_scenario()
    
    print("=" * 60)
    print("All examples completed!")
    print("=" * 60)


if __name__ == '__main__':
    main()
