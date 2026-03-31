# Notion Task Tracker Agent

Script for Notion task tracking enablement with RAG-aligned task generation.

## Features

### 1. Notion Task Management
- Create and update tasks in Notion databases
- Track task status and assignments
- Automated task lifecycle management

### 2. RAG-Aligned Task Generation Prompt Builder
- **Embeds RAG chunks directly** into task generation prompts
- **Enforces strict DB schema alignment** with `main.task` table structure
- **Ensures requirement traceability** via document_ids and chunk_ids
- **Generates implementation-ready tasks** with complete metadata

## Installation

```bash
npm install
```

## Quick Start

### Basic Notion Integration

```javascript
import { createTask, updateTask } from './index.js';

// Create a task
const taskId = await createTask(
  "Implement authentication",
  "Agent",
  "Build JWT-based auth system"
);

// Update task status
await updateTask(taskId, "In Progress", "Working on login endpoint");
```

### RAG-Aligned Task Generation

```javascript
import { buildTaskGenerationPrompt, validateTaskList } from './taskPromptBuilder.js';

// Build prompt with RAG chunks
const prompt = buildTaskGenerationPrompt({
  ragChunks: [
    {
      document_id: 1,
      chunk_id: 5,
      requirement_type: 'functional',
      has_constraints: true,
      has_success_criteria: true,
      content: 'The system must provide secure user authentication...',
      extracted_constraints: ['Must use JWT tokens'],
      extracted_success_criteria: ['User can log in successfully'],
    },
  ],
  taskQuery: 'Generate implementation tasks for authentication',
  projectId: 42,
});

// Use prompt with LLM to generate tasks
const tasks = await llm.generate(prompt);

// Validate generated tasks
const validation = validateTaskList(tasks);
if (validation.valid) {
  console.log('All tasks are valid!');
}
```

## Scripts

```bash
# Run tests
npm test

# Run example usage
npm run example
```

## Documentation

- **[Task Prompt Builder Guide](./TASK_PROMPT_BUILDER_GUIDE.md)** - Complete documentation for the RAG-aligned task generation system
- **[Example Usage](./example-usage.js)** - Practical examples and demonstrations

## Task Schema

Generated tasks conform to the following schema (mirrors DB `main.task` table):

```javascript
{
  task_name: string,              // Short imperative title
  task_type: string,              // implementation, design, testing, etc.
  description: string,            // Multi-paragraph explanation
  parameters: object,             // Structured inputs/configuration
  status: string,                 // PENDING, IN_PROGRESS, COMPLETED, etc.
  priority: number,               // 1 = highest, larger = lower
  task_notes: string,             // Free-form notes
  task_data: {
    requirement_snippets: string[],      // Verbatim requirement quotes
    requirement_type: string,            // functional, constraint, etc.
    constraints: string[],               // Extracted constraints
    success_criteria: string[],          // Extracted success criteria
    execution_complexity: string,        // low, medium, high, very_high
    project_id: number,                  // Project identifier
    document_ids: number[],              // Source document IDs
    chunk_ids: number[],                 // Source chunk IDs
  },
  dependencies: string[],         // Prerequisite task names
}
```

## Key Features

### Requirement Traceability
Every generated task includes:
- `document_ids` - Source documents that informed the task
- `chunk_ids` - Specific requirement chunks referenced
- `requirement_snippets` - Verbatim quotes from requirements

### Strict Schema Enforcement
- Validates all required fields
- Enforces execution_complexity values (low, medium, high, very_high)
- Ensures arrays are non-empty where required
- Validates dependency references

### RAG Chunk Embedding
Prompts include complete RAG context:
- Document and chunk metadata
- Requirement type classification
- Constraint and success criteria flags
- Extracted metadata for quick reference

## Environment Variables

Create a `.env` file:

```env
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_database_id
```

## License

ISC
