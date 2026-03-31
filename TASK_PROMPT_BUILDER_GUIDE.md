# RAG-Aligned Task Generation Prompt Builder

## Overview

The RAG-Aligned Task Generation Prompt Builder is a comprehensive module that constructs task generation instruction prompts with embedded RAG (Retrieval-Augmented Generation) chunks and strict database schema alignment. This ensures that generated tasks are implementation-ready, fully traceable to source requirements, and conform to the `main.task` table structure.

## Key Features

### 1. **RAG Chunk Embedding**
- Directly embeds RAG retrieval results into the prompt
- Includes full chunk metadata (document_id, chunk_id, requirement_type, etc.)
- Preserves extracted constraints and success criteria
- Maintains similarity scores and document context

### 2. **Strict DB Schema Alignment**
- Mirrors the `main.task` table structure exactly
- Enforces all required fields including:
  - `task_data.execution_complexity`
  - `task_data.constraints`
  - `task_data.success_criteria`
  - `task_data.document_ids`
  - `task_data.chunk_ids`
- Validates generated tasks against schema

### 3. **Requirement Traceability**
- Every task must reference source RAG chunks via `document_ids` and `chunk_ids`
- Requires verbatim `requirement_snippets` from chunk content
- Prevents invention of requirements not present in source documents
- Enables complete audit trail from task back to original requirements

### 4. **Implementation-Ready Output**
- Generates exhaustive task lists covering all requirements
- Includes detailed descriptions with scope and edge cases
- Extracts constraints and success criteria from requirements
- Identifies task dependencies and execution order

## Installation

The module is a standalone ES6 module with no external dependencies:

```javascript
import {
  buildTaskGenerationPrompt,
  validateTaskSchema,
  validateTaskList,
  extractRAGMetadata,
  TASK_SCHEMA,
} from './taskPromptBuilder.js';
```

## Core Functions

### `buildTaskGenerationPrompt(options)`

Builds a complete RAG-aligned task generation prompt.

**Parameters:**
```javascript
{
  ragChunks: Array,           // RAG retrieval results (required)
  taskQuery: string,          // High-level objective (optional)
  projectId: number,          // Project ID (optional)
  documentId: number,         // Document ID (optional)
  agentId: string,            // Cursor agent ID (optional)
  dbAgentId: string,          // DB agent_id for traceability (optional)
  agentInstanceId: string,    // Agent instance ID (optional)
}
```

**Returns:** `string` - Complete task generation prompt

**Example:**
```javascript
const prompt = buildTaskGenerationPrompt({
  ragChunks: [
    {
      document_id: 1,
      chunk_id: 5,
      requirement_type: 'functional',
      has_constraints: true,
      has_success_criteria: true,
      project_id: 42,
      content: 'The system must provide secure user authentication...',
      extracted_constraints: ['Must use JWT tokens'],
      extracted_success_criteria: ['User can log in successfully'],
    },
  ],
  taskQuery: 'Generate implementation tasks for the authentication system',
  projectId: 42,
});
```

### `validateTaskSchema(task)`

Validates that a task object conforms to the required schema.

**Parameters:**
- `task` (Object): Task object to validate

**Returns:** `{ valid: boolean, errors: string[] }`

**Example:**
```javascript
const validation = validateTaskSchema({
  task_name: 'Implement user authentication',
  task_type: 'implementation',
  description: 'Build JWT-based authentication system...',
  parameters: { endpoints: ['/api/auth/login'] },
  status: 'PENDING',
  priority: 1,
  task_notes: '',
  task_data: {
    requirement_snippets: ['The system must provide secure authentication'],
    requirement_type: 'functional',
    constraints: ['Must use JWT tokens'],
    success_criteria: ['User can log in successfully'],
    execution_complexity: 'medium',
    project_id: 42,
    document_ids: [1],
    chunk_ids: [5],
  },
  dependencies: [],
});

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

### `validateTaskList(tasks)`

Validates an array of task objects.

**Parameters:**
- `tasks` (Array): Array of task objects

**Returns:** `{ valid: boolean, taskErrors: Array }`

**Example:**
```javascript
const validation = validateTaskList([task1, task2, task3]);

if (!validation.valid) {
  validation.taskErrors.forEach(error => {
    console.error(`Task "${error.task_name}":`, error.errors);
  });
}
```

### `extractRAGMetadata(ragChunks)`

Extracts summary metadata from RAG chunks.

**Parameters:**
- `ragChunks` (Array): Array of RAG chunk objects

**Returns:**
```javascript
{
  totalChunks: number,
  uniqueDocuments: number,
  requirementTypes: { [type: string]: number },
  hasConstraints: number,
  hasSuccessCriteria: number,
}
```

**Example:**
```javascript
const metadata = extractRAGMetadata(ragChunks);
console.log(`Processing ${metadata.totalChunks} chunks from ${metadata.uniqueDocuments} documents`);
console.log(`Chunks with constraints: ${metadata.hasConstraints}`);
console.log(`Requirement types:`, metadata.requirementTypes);
```

## Task Schema

The complete task schema mirrors the `main.task` database table:

```javascript
{
  task_name: string,              // Short imperative title
  task_type: string,              // Category: implementation, design, testing, etc.
  description: string,            // Multi-paragraph explanation
  parameters: object,             // Structured inputs/configuration
  status: string,                 // Initial status (use "PENDING")
  priority: number,               // 1 = highest, larger = lower
  task_notes: string,             // Free-form notes, risks, questions
  task_data: {
    requirement_snippets: string[],      // Verbatim quotes from requirements
    requirement_type: string,            // functional, constraint, acceptance_criteria, general
    constraints: string[],               // Extracted constraints
    success_criteria: string[],          // Extracted success criteria
    execution_complexity: string,        // low, medium, high, very_high
    project_id: number,                  // Project identifier
    document_ids: number[],              // Source document IDs
    chunk_ids: number[],                 // Source chunk IDs
  },
  dependencies: string[],         // task_name values of prerequisite tasks
}
```

## RAG Chunk Format

RAG chunks should include the following fields:

```javascript
{
  document_id: number,                    // Required
  chunk_id: number,                       // Required
  requirement_type: string,               // functional, constraint, acceptance_criteria, general
  has_constraints: boolean,               // Flag indicating constraints present
  has_success_criteria: boolean,          // Flag indicating success criteria present
  project_id: number,                     // Optional
  document_name: string,                  // Optional
  similarity_score: number,               // Optional (0-1)
  content: string,                        // Chunk text content
  chunk_text: string,                     // Alternative field name for content
  extracted_constraints: string[],        // Optional pre-extracted constraints
  extracted_success_criteria: string[],   // Optional pre-extracted success criteria
}
```

## Usage Examples

### Example 1: Basic Task Generation

```javascript
import { buildTaskGenerationPrompt } from './taskPromptBuilder.js';

// RAG chunks from retrieval system
const ragChunks = [
  {
    document_id: 1,
    chunk_id: 5,
    requirement_type: 'functional',
    has_constraints: true,
    has_success_criteria: true,
    project_id: 42,
    document_name: 'API Requirements',
    similarity_score: 0.95,
    content: 'The system must provide secure user authentication via JWT tokens.',
    extracted_constraints: ['Must use JWT tokens'],
    extracted_success_criteria: ['User can authenticate successfully'],
  },
];

// Build the prompt
const prompt = buildTaskGenerationPrompt({
  ragChunks,
  taskQuery: 'Generate implementation tasks for the authentication system',
  projectId: 42,
});

// Send prompt to LLM for task generation
const generatedTasks = await llm.generate(prompt);
```

### Example 2: Validating Generated Tasks

```javascript
import { validateTaskList } from './taskPromptBuilder.js';

// After receiving tasks from LLM
const tasks = JSON.parse(llmResponse);

// Validate all tasks
const validation = validateTaskList(tasks);

if (validation.valid) {
  console.log('All tasks are valid!');
  // Store tasks in database
  await storeTasks(tasks);
} else {
  console.error('Validation errors found:');
  validation.taskErrors.forEach(error => {
    console.error(`Task "${error.task_name}":`, error.errors);
  });
  // Request regeneration or manual fix
}
```

### Example 3: Metadata Analysis

```javascript
import { extractRAGMetadata } from './taskPromptBuilder.js';

// Analyze RAG chunks before generating tasks
const metadata = extractRAGMetadata(ragChunks);

console.log(`
Task Generation Context:
- Total chunks: ${metadata.totalChunks}
- Source documents: ${metadata.uniqueDocuments}
- Chunks with constraints: ${metadata.hasConstraints}
- Chunks with success criteria: ${metadata.hasSuccessCriteria}
- Requirement breakdown:
`);

Object.entries(metadata.requirementTypes).forEach(([type, count]) => {
  console.log(`  - ${type}: ${count}`);
});
```

### Example 4: Integration with Cursor Agent API

```javascript
import { buildTaskGenerationPrompt, validateTaskList } from './taskPromptBuilder.js';

async function generateTasksWithCursorAgent(ragChunks, projectId) {
  // Build the prompt
  const prompt = buildTaskGenerationPrompt({
    ragChunks,
    taskQuery: 'Generate exhaustive implementation tasks',
    projectId,
  });

  // Call Cursor Agent API
  const response = await fetch('https://api.cursor.sh/agents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CURSOR_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      model: 'claude-3-opus',
    }),
  });

  const result = await response.json();
  const tasks = JSON.parse(result.output);

  // Validate tasks
  const validation = validateTaskList(tasks);
  
  if (!validation.valid) {
    throw new Error(`Task validation failed: ${JSON.stringify(validation.taskErrors)}`);
  }

  return tasks;
}
```

### Example 5: Custom Task Query

```javascript
const prompt = buildTaskGenerationPrompt({
  ragChunks,
  taskQuery: `
    Generate a comprehensive task list that:
    1. Covers all API endpoints specified in the requirements
    2. Includes database schema migration tasks
    3. Adds testing tasks for each feature
    4. Prioritizes security-critical tasks
  `,
  projectId: 42,
});
```

## Prompt Structure

The generated prompt includes the following sections:

1. **PRIMARY OBJECTIVE** - High-level query/goal
2. **STRICT REQUIREMENT SOURCE** - Rules for requirement traceability
3. **REQUIREMENT TRACEABILITY** - Instructions for populating document_ids, chunk_ids, requirement_snippets
4. **RAG CHUNKS** - Embedded chunk content with full metadata
5. **TASK SCHEMA** - Complete schema matching DB main.task structure
6. **TASK GENERATION INSTRUCTIONS** - Step-by-step process for generating tasks
7. **OUTPUT FORMAT** - JSON structure and example
8. **CRITICAL REMINDERS** - Key constraints and requirements

## Best Practices

### 1. RAG Chunk Quality
- Ensure chunks have complete metadata (document_id, chunk_id, requirement_type)
- Pre-extract constraints and success criteria when possible
- Include similarity scores for context
- Maintain document names for human readability

### 2. Task Query Specificity
- Provide specific, actionable objectives
- Reference particular aspects of the requirements when needed
- Specify priorities or focus areas if applicable

### 3. Validation
- Always validate generated tasks before storing in database
- Check for complete traceability (document_ids, chunk_ids populated)
- Verify execution_complexity is set correctly
- Ensure dependencies reference valid task_name values

### 4. Error Handling
```javascript
try {
  const prompt = buildTaskGenerationPrompt({ ragChunks, projectId });
  const tasks = await generateTasks(prompt);
  
  const validation = validateTaskList(tasks);
  if (!validation.valid) {
    // Log validation errors
    logger.error('Task validation failed', { errors: validation.taskErrors });
    
    // Optionally retry with refined prompt
    const refinedPrompt = prompt + '\n\nPREVIOUS ERRORS:\n' + 
      JSON.stringify(validation.taskErrors, null, 2);
    tasks = await generateTasks(refinedPrompt);
  }
  
  await storeTasks(tasks);
} catch (error) {
  logger.error('Task generation failed', { error });
  throw error;
}
```

### 5. Iterative Refinement
- Use validation errors to refine prompts
- Add specific instructions for common failure modes
- Maintain examples of well-formed tasks

## Testing

Run the test suite to verify functionality:

```bash
node taskPromptBuilder.test.js
```

The test suite validates:
- Prompt structure and completeness
- RAG chunk embedding
- Schema alignment
- Requirement traceability enforcement
- Task validation logic
- Metadata extraction
- Edge cases and error handling

## Success Criteria Verification

The implementation satisfies all required success criteria:

✅ **Prompt includes high-level query/objective**
- PRIMARY OBJECTIVE section with user-provided or default query

✅ **Prompt enforces strict requirement sourcing from RAG chunks**
- STRICT REQUIREMENT SOURCE section with explicit rules
- Instructions to avoid inventing requirements
- Mandatory verbatim requirement_snippets

✅ **Prompt includes complete task schema matching DB main.task structure**
- Full schema with all required fields
- Detailed field descriptions and constraints
- execution_complexity, document_ids, chunk_ids enforcement

✅ **Generated tasks are implementation-ready and exhaustive**
- TASK GENERATION INSTRUCTIONS with step-by-step process
- Emphasis on actionable, non-overlapping tasks
- Dependency identification and ordering

## Integration Points

### Database Integration
```javascript
async function storeGeneratedTasks(tasks, projectId) {
  for (const task of tasks) {
    await db.query(`
      INSERT INTO main.task (
        task_name, task_type, description, parameters,
        status, priority, task_notes, task_data, dependencies,
        project_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      task.task_name,
      task.task_type,
      task.description,
      JSON.stringify(task.parameters),
      task.status,
      task.priority,
      task.task_notes,
      JSON.stringify(task.task_data),
      task.dependencies,
      projectId,
    ]);
  }
}
```

### RAG Retrieval Integration
```javascript
async function generateTasksFromDocuments(documentIds, projectId) {
  // Retrieve RAG chunks
  const ragChunks = await retrieveRAGChunks({
    documentIds,
    projectId,
    similarityThreshold: 0.7,
    limit: 50,
  });

  // Build prompt
  const prompt = buildTaskGenerationPrompt({
    ragChunks,
    projectId,
  });

  // Generate and validate tasks
  const tasks = await generateTasks(prompt);
  const validation = validateTaskList(tasks);

  if (!validation.valid) {
    throw new Error('Generated tasks failed validation');
  }

  return tasks;
}
```

## Troubleshooting

### Common Issues

**Issue: Tasks missing document_ids or chunk_ids**
- Ensure RAG chunks have document_id and chunk_id fields
- Verify prompt emphasizes REQUIREMENT TRACEABILITY section
- Add explicit reminder in task query

**Issue: Invalid execution_complexity values**
- Check validation errors for specific invalid values
- Ensure prompt clearly lists valid values: low, medium, high, very_high
- Add examples with correct complexity values

**Issue: Empty requirement_snippets**
- Verify RAG chunks have content or chunk_text fields
- Emphasize verbatim quotes requirement in prompt
- Provide examples of proper requirement_snippets

**Issue: Invented requirements**
- Strengthen STRICT REQUIREMENT SOURCE section
- Add explicit warnings about not inventing requirements
- Reduce temperature parameter when calling LLM

## License

This module is part of the Notion Task Tracker Agent project.

## Support

For issues or questions, please refer to the project documentation or contact the development team.
