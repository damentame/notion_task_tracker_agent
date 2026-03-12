# RAG-Enhanced Task Generation System

## Overview

This system implements a strict, database-aligned task generation system that embeds RAG (Retrieval-Augmented Generation) chunks directly into agent prompts. It generates exhaustive, implementation-ready task lists based strictly on provided project document requirements and context.

## Architecture

### Core Components

#### 1. Task Schema (`schema/task_schema.js`)

Defines the database schema for tasks aligned with `main.task` table:

- **Fields**: task_name, description, constraints, success_criteria, has_constraints, has_success_criteria, project_id, document_ids, chunk_ids, dependencies, requirement_snippets, priority, estimated_complexity
- **Validation**: Schema validation, constraint flag validation, success criteria flag validation
- **Computed Fields**: Auto-computation of has_constraints and has_success_criteria flags

```javascript
import { TaskSchema, validateTask, computeTaskFields } from './schema/task_schema.js';

const task = {
  task_name: "Implement authentication",
  description: "Build JWT-based auth",
  constraints: ["Must use JWT", "Must hash passwords"],
  // ... other fields
};

const validation = validateTask(task);
console.log(validation.valid); // true/false
console.log(validation.errors); // array of error messages
```

#### 2. RAG Chunk Structure (`rag/chunk_structure.js`)

Handles document chunking and metadata enrichment:

- **Chunking**: Splits documents into ~1000 character chunks with 200 char overlap
- **Metadata**: Extracts constraints, success criteria, semantic classification
- **Classification**: Identifies semantic types (constraint, success_criteria, requirement, etc.)

```javascript
import { chunkDocument, enrichChunk, extractConstraints } from './rag/chunk_structure.js';

const chunks = chunkDocument(documentContent, {
  chunkSize: 1000,
  overlap: 200,
  document_id: 1,
  project_id: 100
});

const constraints = extractConstraints(chunkContent);
// Returns: ["Must use JWT tokens", "Must hash passwords", ...]
```

#### 3. RAG Retrieval (`rag/rag_retrieval.js`)

Retrieves relevant chunks for task generation:

- **Semantic Search**: Finds chunks similar to query using embeddings
- **Filtering**: Filters by project, document type, semantic type
- **Prioritization**: Prioritizes constraint and success criteria chunks

```javascript
import { retrieveTaskGenerationContext } from './rag/rag_retrieval.js';

const ragContext = await retrieveTaskGenerationContext(projectId, taskQuery);
console.log(ragContext.chunks.length); // Number of chunks retrieved
console.log(ragContext.getConstraintChunks()); // Chunks with constraints
console.log(ragContext.getSuccessCriteriaChunks()); // Chunks with success criteria
```

#### 4. Task Generation Prompt Builder (`rag/task_generation_prompt.js`)

Constructs prompts that enforce schema alignment:

- **RAG Embedding**: Embeds all chunks with full metadata into prompt
- **Schema Documentation**: Includes complete schema specification
- **Validation Requirements**: Lists all validation rules
- **Examples**: Provides example tasks for reference

```javascript
import { buildTaskGenerationPrompt } from './rag/task_generation_prompt.js';

const prompt = buildTaskGenerationPrompt(ragContext, {
  project_id: 100,
  high_level_query: "Generate implementation tasks for authentication"
});

// Prompt includes:
// - Primary objective
// - RAG chunks with metadata
// - Database schema
// - Validation requirements
// - Output format examples
```

#### 5. Task Generator (`rag/task_generator.js`)

Main task generation engine:

- **RAG-Based Generation**: Uses RAG context to generate tasks
- **Validation**: Validates all tasks against schema and RAG justification
- **Post-Processing**: Computes fields, ensures consistency

```javascript
import { generateTasks } from './rag/task_generator.js';

const result = await generateTasks(projectId, taskQuery, {
  validateBeforeReturn: true,
  autoComputeFields: true,
  strictMode: true
});

console.log(result.tasks); // Array of generated tasks
console.log(result.metadata); // Generation metadata
const validation = result.validate();
```

#### 6. RAG Validation (`validation/rag_validation.js`)

Comprehensive validation system:

- **Schema Validation**: Checks against TaskSchema
- **Justification Validation**: Ensures RAG chunk references are valid
- **Snippet Validation**: Verifies requirement snippets exist in chunks
- **Constraint/Success Criteria Validation**: Validates extraction accuracy

```javascript
import { validateGeneratedTasks, validateRAGContext } from './validation/rag_validation.js';

// Validate RAG context quality
const contextValidation = validateRAGContext(ragContext);
console.log(contextValidation.valid);
console.log(contextValidation.warnings);

// Validate generated tasks
const report = validateGeneratedTasks(tasks, ragContext);
console.log(report.getSummary());
console.log(report.toString()); // Full report
```

#### 7. Notion Integration (`integration/notion_rag_integration.js`)

Integrates RAG system with Notion task manager:

- **Document Processing**: Chunks documents, generates tasks, creates in Notion
- **Metadata Preservation**: Includes constraints, success criteria in Notion notes
- **Batch Processing**: Handles multiple documents

```javascript
import { NotionRAGIntegration } from './integration/notion_rag_integration.js';

const integration = new NotionRAGIntegration({
  validateBeforeCreation: true,
  createNotionTasks: true,
  includeMetadataInNotes: true
});

const result = await integration.processDocument(document, projectId);
console.log(result.summary);
```

## Key Features

### 1. Strict Requirement Justification

Every generated task MUST:
- Reference specific RAG chunk IDs
- Include requirement snippets (direct quotes from chunks)
- Reference source document IDs
- Be traceable to original content

### 2. Constraint Extraction

System automatically extracts constraints using pattern matching:
- "must", "shall", "required to", "cannot"
- "constraint:", "do not", "ensure that"
- Marks chunks with `has_constraints: true`
- Preserves constraints in task objects

### 3. Success Criteria Extraction

Identifies and extracts success criteria:
- "success criteria", "acceptance criteria"
- "should be able to", "expected outcome"
- "definition of done"
- Marks chunks with `has_success_criteria: true`

### 4. Database Schema Alignment

Tasks conform to `main.task` schema:
- All required fields populated
- Computed fields (has_constraints, has_success_criteria) accurate
- Arrays properly initialized
- Foreign key references maintained

### 5. Comprehensive Validation

Multi-level validation:
- Schema validation (required fields, types)
- Justification validation (chunk/document references)
- Snippet validation (quotes exist in chunks)
- Flag validation (has_* flags match arrays)

## Usage Examples

### Quick Start

```javascript
import { quickStart } from './rag_system.js';

const result = await quickStart(`
  Build a REST API with the following requirements:
  
  CONSTRAINTS:
  - Must follow REST principles
  - Must authenticate all endpoints
  - Must return JSON responses
  
  SUCCESS CRITERIA:
  - API returns correct status codes
  - Authentication blocks unauthorized access
  - All responses are valid JSON
`, 1, {
  documentName: 'API Requirements',
  createNotionTasks: true
});

console.log(`Generated ${result.generatedTasks.length} tasks`);
```

### Full Workflow

```javascript
import { NotionRAGIntegration } from './integration/notion_rag_integration.js';
import { validateRAGContext } from './validation/rag_validation.js';

// 1. Create integration
const integration = new NotionRAGIntegration();

// 2. Prepare document
const document = {
  id: 1,
  name: "Requirements Doc",
  type: "requirement",
  project_id: 100,
  content: "..." // Your requirements
};

// 3. Process document
const result = await integration.processDocument(document, 100);

// 4. Validate
const contextValidation = validateRAGContext(result.ragContext);
console.log('RAG Context Valid:', contextValidation.valid);

// 5. Review tasks
result.generatedTasks.forEach(task => {
  console.log(`Task: ${task.task_name}`);
  console.log(`Constraints: ${task.constraints.length}`);
  console.log(`Success Criteria: ${task.success_criteria.length}`);
  console.log(`Justified by chunks: ${task.chunk_ids.join(', ')}`);
});

// 6. Check validation
console.log(result.validationReport.toString());
```

### Custom Task Generation

```javascript
import { TaskGenerator } from './rag/task_generator.js';
import { retrieveTaskGenerationContext } from './rag/rag_retrieval.js';

const generator = new TaskGenerator({
  validateBeforeReturn: true,
  autoComputeFields: true,
  strictMode: false // Allow warnings
});

// Generate tasks
const result = await generator.generateTasks(
  projectId,
  "Generate authentication tasks",
  { additional_context: "Focus on security" }
);

// Validate
const validation = result.validate();
if (!validation.allValid) {
  const invalid = result.getInvalidTasks();
  console.log('Invalid tasks:', invalid);
}
```

## Running Demos

### Full Demo

```bash
node demo/rag_demo.js
```

Shows complete workflow:
- Document chunking
- Constraint/success criteria extraction
- Task generation
- Validation
- Detailed results

### Minimal Demo

```javascript
import { runMinimalDemo } from './demo/rag_demo.js';

const result = await runMinimalDemo();
console.log(result.summary);
```

## Validation Rules

### Schema Validation

1. **Required Fields**: task_name, description, project_id, document_ids, chunk_ids, requirement_snippets
2. **Arrays**: All array fields properly initialized
3. **Flags**: has_constraints and has_success_criteria match array contents

### Justification Validation

1. **Chunk References**: All chunk_ids must exist in RAG context
2. **Document References**: All document_ids must exist in RAG context
3. **Requirement Snippets**: Must contain at least one direct quote
4. **Snippet Accuracy**: Snippets should appear in referenced chunks

### Content Validation

1. **No Invented Content**: All requirements from RAG chunks
2. **Constraint Extraction**: Constraints match chunk content
3. **Success Criteria Extraction**: Criteria match chunk content
4. **Traceability**: Every task element traceable to source

## Configuration

### Task Generator Options

```javascript
{
  validateBeforeReturn: true,  // Validate before returning
  autoComputeFields: true,     // Auto-compute has_* flags
  strictMode: true             // Reject invalid tasks
}
```

### Notion Integration Options

```javascript
{
  validateBeforeCreation: true,    // Validate before creating in Notion
  createNotionTasks: true,         // Actually create tasks (false for dry run)
  includeMetadataInNotes: true     // Include detailed metadata in notes
}
```

### RAG Retrieval Options

```javascript
{
  project_id: 100,              // Filter by project
  document_type: 'requirement', // Filter by document type
  semantic_types: ['constraint'], // Filter by semantic type
  limit: 20,                    // Max chunks to return
  threshold: 0.3                // Similarity threshold
}
```

## Best Practices

### 1. Document Preparation

- Include clear constraint sections
- Mark success criteria explicitly
- Use consistent terminology
- Structure requirements hierarchically

### 2. Chunk Quality

- Validate RAG context before generation
- Ensure diverse document coverage
- Include constraint/success criteria chunks
- Monitor chunk relevance scores

### 3. Task Generation

- Use specific task queries
- Provide project context
- Enable validation
- Review generated tasks before creation

### 4. Validation

- Always validate RAG context first
- Check validation reports
- Address warnings
- Ensure snippet accuracy

## Troubleshooting

### No Tasks Generated

- Check RAG context has chunks
- Verify document content has requirements
- Review chunk quality validation
- Check similarity thresholds

### Tasks Missing Constraints

- Ensure documents include explicit constraints
- Check chunk constraint extraction
- Verify constraint patterns match content
- Review semantic classification

### Validation Failures

- Check requirement snippet accuracy
- Verify chunk/document references
- Ensure flags match array contents
- Review strict mode settings

## Performance Considerations

- **Chunking**: ~1000 chars per chunk, 200 overlap
- **Retrieval**: Max 50 chunks, 0.3 similarity threshold
- **Validation**: Runs for all tasks in strict mode
- **Notion API**: Rate limits apply to task creation

## Future Enhancements

1. **LLM Integration**: Connect to OpenAI/Anthropic for actual generation
2. **Vector Database**: Use Pinecone/Weaviate for production embeddings
3. **Caching**: Cache RAG retrievals and validations
4. **Batch Processing**: Parallel document processing
5. **Custom Extractors**: Pluggable constraint/criteria extractors
6. **Metadata Learning**: Learn from validated tasks to improve extraction

## API Reference

See individual component files for detailed API documentation:
- `schema/task_schema.js` - Task schema and validation
- `rag/chunk_structure.js` - Chunking and metadata
- `rag/rag_retrieval.js` - RAG retrieval
- `rag/task_generation_prompt.js` - Prompt building
- `rag/task_generator.js` - Task generation
- `validation/rag_validation.js` - Validation
- `integration/notion_rag_integration.js` - Notion integration
