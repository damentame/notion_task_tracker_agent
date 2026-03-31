# RAG-Aligned Task Generation - Quick Reference

## Installation

```javascript
import {
  buildTaskGenerationPrompt,
  validateTaskSchema,
  validateTaskList,
  extractRAGMetadata,
} from './taskPromptBuilder.js';
```

## Basic Usage

### 1. Build Prompt

```javascript
const prompt = buildTaskGenerationPrompt({
  ragChunks: [/* RAG chunks */],
  taskQuery: 'Generate implementation tasks',
  projectId: 42,
});
```

### 2. Validate Tasks

```javascript
const validation = validateTaskList(tasks);
if (!validation.valid) {
  console.error(validation.taskErrors);
}
```

### 3. Extract Metadata

```javascript
const metadata = extractRAGMetadata(ragChunks);
console.log(`${metadata.totalChunks} chunks from ${metadata.uniqueDocuments} documents`);
```

## RAG Chunk Format

```javascript
{
  document_id: number,              // Required
  chunk_id: number,                 // Required
  requirement_type: string,         // functional, constraint, acceptance_criteria, general
  has_constraints: boolean,
  has_success_criteria: boolean,
  project_id: number,
  document_name: string,
  similarity_score: number,
  content: string,                  // Chunk text
  extracted_constraints: string[],
  extracted_success_criteria: string[],
}
```

## Task Schema

```javascript
{
  task_name: string,
  task_type: string,                // implementation, design, testing, research, migration
  description: string,
  parameters: object,
  status: string,                   // PENDING, IN_PROGRESS, COMPLETED
  priority: number,                 // 1 = highest
  task_notes: string,
  task_data: {
    requirement_snippets: string[], // Verbatim quotes
    requirement_type: string,
    constraints: string[],
    success_criteria: string[],
    execution_complexity: string,   // low, medium, high, very_high
    project_id: number,
    document_ids: number[],         // Source documents
    chunk_ids: number[],            // Source chunks
  },
  dependencies: string[],           // task_name values
}
```

## Validation

### Single Task

```javascript
const validation = validateTaskSchema(task);
if (!validation.valid) {
  validation.errors.forEach(err => console.error(err));
}
```

### Task List

```javascript
const validation = validateTaskList(tasks);
validation.taskErrors.forEach(error => {
  console.error(`${error.task_name}: ${error.errors.join(', ')}`);
});
```

## Common Patterns

### Pattern 1: Generate and Validate

```javascript
const prompt = buildTaskGenerationPrompt({ ragChunks, projectId });
const tasks = await llm.generate(prompt);
const validation = validateTaskList(tasks);

if (validation.valid) {
  await storeTasks(tasks);
} else {
  throw new Error('Validation failed');
}
```

### Pattern 2: Iterative Refinement

```javascript
let tasks = await generateTasks(prompt);
let validation = validateTaskList(tasks);

if (!validation.valid) {
  const refinedPrompt = prompt + '\n\nFix these errors:\n' + 
    JSON.stringify(validation.taskErrors);
  tasks = await generateTasks(refinedPrompt);
}
```

### Pattern 3: Metadata Analysis

```javascript
const metadata = extractRAGMetadata(ragChunks);
console.log(`
Context:
- ${metadata.totalChunks} chunks
- ${metadata.uniqueDocuments} documents
- ${metadata.hasConstraints} with constraints
- ${metadata.hasSuccessCriteria} with success criteria
`);
```

## Execution Complexity Values

- `low` - Simple, straightforward tasks (< 4 hours)
- `medium` - Moderate complexity (4-16 hours)
- `high` - Complex tasks requiring significant effort (16-40 hours)
- `very_high` - Very complex, multi-phase tasks (> 40 hours)

## Requirement Types

- `functional` - Feature requirements
- `constraint` - Technical or business constraints
- `acceptance_criteria` - Success criteria and testing requirements
- `general` - Other requirements

## Task Types

- `implementation` - Code implementation
- `design` - Architecture or design work
- `testing` - Test creation or execution
- `research` - Investigation or spike
- `migration` - Data or code migration
- `documentation` - Documentation tasks
- `deployment` - Deployment and infrastructure

## Error Handling

```javascript
try {
  const prompt = buildTaskGenerationPrompt({ ragChunks, projectId });
  const tasks = await generateTasks(prompt);
  
  const validation = validateTaskList(tasks);
  if (!validation.valid) {
    logger.error('Validation failed', { errors: validation.taskErrors });
    // Handle validation errors
  }
  
  await storeTasks(tasks);
} catch (error) {
  logger.error('Task generation failed', { error });
  throw error;
}
```

## Testing

```bash
# Run all tests
npm test

# Run example
npm run example
```

## Key Constraints

1. **RAG chunks must be embedded** - Don't invent requirements
2. **Schema must be followed** - All required fields must be present
3. **Traceability required** - document_ids and chunk_ids must be populated
4. **Verbatim snippets** - requirement_snippets must be exact quotes
5. **Valid complexity** - Must be one of: low, medium, high, very_high

## Common Validation Errors

| Error | Fix |
|-------|-----|
| Missing document_ids | Ensure RAG chunks have document_id field |
| Invalid execution_complexity | Use: low, medium, high, or very_high |
| Empty requirement_snippets | Extract verbatim quotes from chunk content |
| Invalid priority | Must be integer >= 1 |
| Missing task_data | Include complete task_data object |

## Performance Tips

1. **Batch validation** - Use `validateTaskList()` instead of individual validations
2. **Metadata first** - Check `extractRAGMetadata()` before building prompts
3. **Reuse prompts** - Cache prompts for similar RAG contexts
4. **Limit chunks** - Use top 20-50 most relevant chunks
5. **Pre-extract** - Extract constraints/criteria before prompt building

## Documentation

- Full guide: [TASK_PROMPT_BUILDER_GUIDE.md](./TASK_PROMPT_BUILDER_GUIDE.md)
- Examples: [example-usage.js](./example-usage.js)
- Types: [taskPromptBuilder.d.ts](./taskPromptBuilder.d.ts)
