# Task Schema Validator with Constraint Extraction

A comprehensive validation system that ensures generated tasks strictly adhere to the database schema and automatically extracts constraints and success criteria from RAG (Retrieval-Augmented Generation) chunks.

## Features

- **Schema Validation**: Validates all required task fields against the DB schema
- **Constraint Extraction**: Automatically extracts constraints from chunks marked `has_constraints=true`
- **Success Criteria Extraction**: Extracts success/acceptance criteria from chunks marked `has_success_criteria=true`
- **Pattern Matching**: Uses advanced regex patterns to identify constraint and acceptance language
- **Original Wording Preservation**: Maintains the exact wording of constraints and criteria
- **Implied Detection**: Detects constraints and criteria even when not explicitly marked
- **Task Enrichment**: Automatically enriches tasks with extracted data

## Installation

No external dependencies required. The validator uses only Python standard library modules:

```python
import re
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
```

## Quick Start

```python
from task_schema_validator import create_validator, RAGChunk

# Create a validator instance
validator = create_validator()

# Define your task
task = {
    'task_name': 'Implement user authentication',
    'task_type': 'implementation',
    'description': 'Add JWT-based authentication',
    'parameters': {'auth_type': 'JWT'},
    'status': 'PENDING',
    'priority': 1,
    'task_notes': 'High priority security feature',
    'task_data': {
        'requirement_snippets': ['User must authenticate with JWT'],
        'requirement_type': 'functional',
        'constraints': [],
        'success_criteria': [],
        'execution_complexity': 'complex',
        'project_id': 1,
        'document_ids': [1],
        'chunk_ids': [10],
        'dependencies': []
    }
}

# Define RAG chunks with constraints and success criteria
chunks = [
    RAGChunk(
        chunk_id=10,
        chunk_text="System must use JWT tokens. Session timeout must not exceed 30 minutes.",
        document_id=1,
        project_id=1,
        has_constraints=True,
        has_success_criteria=False
    ),
    RAGChunk(
        chunk_id=11,
        chunk_text="User must be able to login successfully. System should validate credentials.",
        document_id=1,
        project_id=1,
        has_constraints=False,
        has_success_criteria=True
    )
]

# Validate and enrich the task
enriched_task, result = validator.validate_and_enrich_task(task, chunks)

if result.is_valid:
    print("✓ Task is valid!")
    print(f"Extracted {len(result.extracted_constraints)} constraints")
    print(f"Extracted {len(result.extracted_success_criteria)} success criteria")
else:
    print("✗ Task validation failed:")
    for error in result.errors:
        print(f"  - {error}")
```

## Core Components

### TaskSchemaValidator

The main validator class that performs schema validation and extraction.

#### Methods

##### `validate_task(task, rag_chunks=None)`

Validates a task object against the schema and extracts constraints/success criteria.

**Parameters:**
- `task` (dict): The task object to validate
- `rag_chunks` (list[RAGChunk], optional): RAG chunks that informed this task

**Returns:**
- `ValidationResult`: Validation status and extracted data

**Example:**

```python
result = validator.validate_task(task, chunks)

if not result.is_valid:
    print("Errors:", result.errors)
if result.warnings:
    print("Warnings:", result.warnings)
```

##### `validate_and_enrich_task(task, rag_chunks=None)`

Validates a task and automatically enriches it with extracted constraints and success criteria.

**Parameters:**
- `task` (dict): The task object to validate and enrich
- `rag_chunks` (list[RAGChunk], optional): RAG chunks that informed this task

**Returns:**
- `tuple[dict, ValidationResult]`: Enriched task and validation result

**Example:**

```python
enriched_task, result = validator.validate_and_enrich_task(task, chunks)

# The enriched task now contains extracted constraints and success criteria
print(enriched_task['task_data']['constraints'])
print(enriched_task['task_data']['success_criteria'])
```

### RAGChunk

Dataclass representing a RAG chunk with metadata.

**Fields:**
- `chunk_id` (int): Unique identifier for the chunk
- `chunk_text` (str): The text content of the chunk
- `document_id` (int): ID of the source document
- `project_id` (int): ID of the project
- `has_constraints` (bool): Whether chunk contains constraints (default: False)
- `has_success_criteria` (bool): Whether chunk contains success criteria (default: False)
- `requirement_type` (str, optional): Type of requirement (e.g., "functional", "constraint")
- `priority_indicators` (str, optional): Priority indicators from the text

**Example:**

```python
chunk = RAGChunk(
    chunk_id=1,
    chunk_text="The API must support HTTPS only.",
    document_id=1,
    project_id=1,
    has_constraints=True,
    requirement_type="constraint",
    priority_indicators="critical"
)
```

### ValidationResult

Dataclass containing validation results.

**Fields:**
- `is_valid` (bool): Whether the task passed validation
- `errors` (list[str]): List of validation errors
- `warnings` (list[str]): List of warnings (non-blocking issues)
- `extracted_constraints` (list[str]): Constraints extracted from chunks
- `extracted_success_criteria` (list[str]): Success criteria extracted from chunks

## Required Task Schema

### Top-Level Fields

All tasks must include these fields:

- `task_name` (string): Name of the task
- `task_type` (string): Type of task (e.g., "implementation", "testing")
- `description` (string): Detailed description
- `parameters` (object): Task parameters
- `status` (string): Current status (e.g., "PENDING", "IN_PROGRESS", "COMPLETED")
- `priority` (integer): Priority level (1 = highest, larger numbers = lower priority)
- `task_notes` (string): Additional notes, risks, trade-offs
- `task_data` (object): Rich requirement-level metadata

### task_data Fields

The `task_data` object must include:

- `requirement_snippets` (array[string]): Verbatim snippets from requirements
- `requirement_type` (string): Type of requirement (e.g., "functional", "constraint")
- `constraints` (array[string]): Explicit constraints
- `success_criteria` (array[string]): Success/acceptance criteria
- `execution_complexity` (string): Either "fast" or "complex"
- `project_id` (integer): Project identifier
- `document_ids` (array[integer]): Source document IDs
- `chunk_ids` (array[integer]): Source chunk IDs
- `dependencies` (array[string]): Task dependencies (task names)

## Constraint Extraction

The validator automatically extracts constraints using pattern matching.

### Constraint Patterns

The following patterns are recognized as constraints:

- `must [not] be/have/include/support/use/comply/adhere/follow`
- `shall [not] be/have/include/support/use/comply/adhere/follow`
- `required to be/have/include/support/use`
- `is/are required`
- `is/are mandatory`
- `cannot/must not/shall not/should not`
- `minimum/maximum/at least/at most/no more than/no less than`
- `within X seconds/minutes/hours/days`
- `limit/limitation/restriction/constraint:`
- `only/exclusively`
- `forbidden/prohibited/not allowed/disallowed`

### Example

```python
chunk = RAGChunk(
    chunk_id=1,
    chunk_text="""
    The system must support at least 1000 concurrent users.
    Response time must not exceed 200ms.
    Database connections are limited to 100 maximum.
    """,
    document_id=1,
    project_id=1,
    has_constraints=True
)

result = validator.validate_task(task, [chunk])

# Extracted constraints:
# - "The system must support at least 1000 concurrent users."
# - "Response time must not exceed 200ms."
# - "Database connections are limited to 100 maximum."
```

## Success Criteria Extraction

The validator extracts success criteria and acceptance language.

### Success Criteria Patterns

The following patterns are recognized as success criteria:

- `must/shall/should be able to`
- `must/shall/should pass/validate/verify`
- `acceptance criteria:`
- `success criteria:`
- `validation criteria:`
- `when/if ... then/expect/should/must`
- `given/when/then` (BDD-style)
- `expected/expects to/that`
- `ensure/verify/validate/confirm/check/test that`
- `should/must/shall return/produce/generate/create/result in/see`
- `can/could login/access/view/create/update/delete/submit`

### Example

```python
chunk = RAGChunk(
    chunk_id=2,
    chunk_text="""
    Acceptance criteria:
    - User must be able to login successfully
    - System should validate all input fields
    - Invalid credentials must return error message
    Given a valid user, when they login, then they should see dashboard.
    """,
    document_id=1,
    project_id=1,
    has_success_criteria=True
)

result = validator.validate_task(task, [chunk])

# Extracted success criteria:
# - "User must be able to login successfully"
# - "System should validate all input fields"
# - "Invalid credentials must return error message"
# - "Given a valid user, when they login, then they should see dashboard."
```

## Advanced Usage

### Handling Implied Constraints/Criteria

The validator can detect constraints and success criteria even when chunks are not explicitly marked:

```python
chunk = RAGChunk(
    chunk_id=3,
    chunk_text="API must use HTTPS only. User should be able to reset password.",
    document_id=1,
    project_id=1,
    has_constraints=False,  # Not marked
    has_success_criteria=False  # Not marked
)

result = validator.validate_task(task, [chunk])

# The validator will extract both constraint and success criterion
# and generate warnings about unmarked chunks
print(result.warnings)
# ["Chunk 3 contains constraint language but has_constraints=false",
#  "Chunk 3 contains acceptance language but has_success_criteria=false"]
```

### Validation-Only Mode

If you only want to validate without extraction:

```python
result = validator.validate_task(task)  # No chunks provided

if result.is_valid:
    print("Task structure is valid")
else:
    print("Validation errors:", result.errors)
```

### Custom Validation Logic

You can extend the validator for custom validation:

```python
from task_schema_validator import TaskSchemaValidator

class CustomValidator(TaskSchemaValidator):
    def validate_task(self, task, rag_chunks=None):
        result = super().validate_task(task, rag_chunks)
        
        # Add custom validation
        if task.get('priority', 0) > 10:
            result.errors.append("Priority cannot exceed 10")
            result.is_valid = False
        
        return result

validator = CustomValidator()
```

## Error Handling

### Common Validation Errors

1. **Missing Required Fields**
   ```
   Error: Missing required field: task_name
   Error: Missing required field: task_data
   ```

2. **Invalid Field Types**
   ```
   Error: task_name must be a string
   Error: priority must be an integer
   Error: task_data.constraints must be an array
   ```

3. **Invalid Values**
   ```
   Error: execution_complexity must be one of {'fast', 'complex'}, got: medium
   Error: priority must be >= 1
   ```

4. **Missing Constraints/Criteria**
   ```
   Error: Task must include constraints: 2 chunk(s) marked has_constraints=true 
          but no constraints were extracted or present in task
   ```

### Handling Validation Results

```python
enriched_task, result = validator.validate_and_enrich_task(task, chunks)

if result.is_valid:
    # Task is valid, proceed with processing
    save_task_to_database(enriched_task)
elif result.errors:
    # Critical errors - task cannot be processed
    log_errors(result.errors)
    notify_user("Task validation failed")
else:
    # Only warnings - task can be processed with caution
    log_warnings(result.warnings)
    save_task_to_database(enriched_task)
```

## Best Practices

1. **Always Validate Before Saving**: Validate tasks before persisting to database
   ```python
   result = validator.validate_task(task, chunks)
   if result.is_valid:
       db.save(task)
   ```

2. **Use Enrichment for New Tasks**: Let the validator extract constraints automatically
   ```python
   enriched_task, result = validator.validate_and_enrich_task(task, chunks)
   ```

3. **Mark Chunks Correctly**: Ensure RAG chunks are properly marked
   ```python
   # Good: Explicitly mark chunks
   chunk.has_constraints = True
   chunk.has_success_criteria = True
   ```

4. **Preserve Original Wording**: The validator preserves exact wording - don't modify extracted text
   ```python
   # The validator already preserves wording
   print(result.extracted_constraints[0])
   # "The system must support at least 1000 concurrent users."
   ```

5. **Handle Warnings**: Check warnings for potential issues
   ```python
   if result.warnings:
       for warning in result.warnings:
           logger.warning(warning)
   ```

## Testing

Run the comprehensive test suite:

```bash
python3 -m unittest test_task_schema_validator -v
```

The test suite includes:
- Required field validation tests
- Constraint extraction tests
- Success criteria extraction tests
- Pattern matching tests
- Edge case handling
- Type validation tests
- Enrichment tests

## Integration Example

Complete example integrating with a task generation system:

```python
from task_schema_validator import create_validator, RAGChunk

def generate_and_validate_task(requirement_text, project_id, document_id):
    """Generate a task from requirements and validate it"""
    
    # Create validator
    validator = create_validator()
    
    # Parse requirement text into chunks
    chunk = RAGChunk(
        chunk_id=1,
        chunk_text=requirement_text,
        document_id=document_id,
        project_id=project_id,
        has_constraints=True,
        has_success_criteria=True
    )
    
    # Create initial task structure
    task = {
        'task_name': 'Generated Task',
        'task_type': 'implementation',
        'description': 'Task generated from requirements',
        'parameters': {},
        'status': 'PENDING',
        'priority': 2,
        'task_notes': 'Auto-generated task',
        'task_data': {
            'requirement_snippets': [requirement_text],
            'requirement_type': 'functional',
            'constraints': [],
            'success_criteria': [],
            'execution_complexity': 'complex',
            'project_id': project_id,
            'document_ids': [document_id],
            'chunk_ids': [1],
            'dependencies': []
        }
    }
    
    # Validate and enrich
    enriched_task, result = validator.validate_and_enrich_task(task, [chunk])
    
    if result.is_valid:
        print(f"✓ Task validated successfully")
        print(f"  Constraints: {len(enriched_task['task_data']['constraints'])}")
        print(f"  Success Criteria: {len(enriched_task['task_data']['success_criteria'])}")
        return enriched_task
    else:
        print(f"✗ Validation failed:")
        for error in result.errors:
            print(f"  - {error}")
        return None

# Usage
requirement = """
The authentication system must use JWT tokens with 256-bit encryption.
Session timeout must not exceed 30 minutes.
User must be able to login with email and password.
System should validate credentials against the database.
"""

task = generate_and_validate_task(requirement, project_id=1, document_id=1)
if task:
    print("\nGenerated Task:")
    print(f"Constraints: {task['task_data']['constraints']}")
    print(f"Success Criteria: {task['task_data']['success_criteria']}")
```

## License

This validator is part of the task generation system and follows the project's license terms.

## Support

For issues or questions, refer to the test suite in `test_task_schema_validator.py` for comprehensive examples of all features.
