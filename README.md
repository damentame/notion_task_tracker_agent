# RAG-Enhanced Task Generation System

A strict, database-aligned task generation system that embeds RAG (Retrieval-Augmented Generation) chunks directly into agent prompts. Generates exhaustive, implementation-ready task lists based strictly on provided project document requirements and context.

## Features

- **RAG-Based Requirement Analysis**: Chunks documents and retrieves relevant context using semantic search
- **Constraint Extraction**: Automatically identifies and extracts constraints from requirements
- **Success Criteria Extraction**: Identifies acceptance criteria and success conditions
- **Database Schema Alignment**: Tasks conform to `main.task` schema with all required fields
- **Requirement Justification**: Every task includes snippets from source documents
- **Comprehensive Validation**: Multi-level validation ensures task quality and traceability
- **Notion Integration**: Creates tasks directly in Notion with full metadata

## Quick Start

```javascript
import { quickStart } from './rag_system.js';

const result = await quickStart(`
  Build a user authentication system.
  
  CONSTRAINTS:
  - Must use JWT tokens
  - Must hash passwords with bcrypt
  - Must implement rate limiting
  
  SUCCESS CRITERIA:
  - Users can log in successfully
  - Invalid attempts are blocked
  - Tokens expire after 24 hours
`, 1, {
  documentName: 'Auth Requirements',
  createNotionTasks: true
});

console.log(`Generated ${result.generatedTasks.length} tasks`);
```

## Installation

```bash
npm install
```

## Running Tests

```bash
npm test
```

## Running Demos

```bash
# Full demo with detailed output
npm run demo

# Minimal demo
npm run demo:minimal

# Start with Notion integration
npm start
```

## Core Components

### 1. Task Schema (`schema/task_schema.js`)
Defines database-aligned task structure with validation

### 2. RAG Chunk Structure (`rag/chunk_structure.js`)
Document chunking and metadata enrichment

### 3. RAG Retrieval (`rag/rag_retrieval.js`)
Semantic search and context retrieval

### 4. Task Generation Prompt (`rag/task_generation_prompt.js`)
Constructs prompts with embedded RAG context

### 5. Task Generator (`rag/task_generator.js`)
Main task generation engine

### 6. Validation System (`validation/rag_validation.js`)
Comprehensive validation of tasks and RAG context

### 7. Notion Integration (`integration/notion_rag_integration.js`)
Integrates with Notion task manager

## Key Constraints

- Tasks MUST be justified by RAG chunks
- Must NOT invent requirements not in source content
- Must align with main.task database schema
- Must extract and preserve constraints from source chunks
- Must extract and preserve success criteria from source chunks

## Success Criteria

- ✅ Task generation instructions align with DB schema
- ✅ RAG chunks embedded directly into agent prompts
- ✅ Every generated task references specific requirement snippets
- ✅ Constraints marked with `has_constraints=true` are captured explicitly
- ✅ Success criteria marked with `has_success_criteria=true` are extracted and attached

## Documentation

See `docs/RAG_SYSTEM_DOCUMENTATION.md` for comprehensive documentation.

## Architecture

```
┌─────────────────┐
│   Documents     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Chunking     │ ─── Extract constraints
│   & Metadata    │ ─── Extract success criteria
└────────┬────────┘ ─── Classify semantic type
         │
         ▼
┌─────────────────┐
│  RAG Retrieval  │ ─── Semantic search
│                 │ ─── Filter by relevance
└────────┬────────┘ ─── Prioritize chunks
         │
         ▼
┌─────────────────┐
│ Prompt Builder  │ ─── Embed RAG chunks
│                 │ ─── Include schema
└────────┬────────┘ ─── Add validation rules
         │
         ▼
┌─────────────────┐
│ Task Generator  │ ─── Generate tasks
│                 │ ─── Compute fields
└────────┬────────┘ ─── Post-process
         │
         ▼
┌─────────────────┐
│   Validation    │ ─── Schema validation
│                 │ ─── Justification check
└────────┬────────┘ ─── Snippet verification
         │
         ▼
┌─────────────────┐
│ Notion Creation │
└─────────────────┘
```

## Example Output

```javascript
{
  task_name: "Implement JWT authentication",
  description: "Build JWT-based authentication system as specified in requirements",
  constraints: [
    "Must use JWT tokens with 24-hour expiration",
    "Must hash passwords with bcrypt",
    "Must implement rate limiting"
  ],
  success_criteria: [
    "Users can log in successfully with valid credentials",
    "Invalid login attempts are blocked",
    "JWT tokens expire after 24 hours"
  ],
  has_constraints: true,
  has_success_criteria: true,
  project_id: 1,
  document_ids: [1],
  chunk_ids: [1, 2, 3],
  requirement_snippets: [
    "The system must implement JWT-based authentication",
    "Must hash passwords with bcrypt (minimum 10 rounds)",
    "Rate limiting of 5 login attempts per minute is required"
  ]
}
```

## License

ISC
