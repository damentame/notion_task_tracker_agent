# RAG System Quick Reference

## Installation & Setup

```bash
npm install
npm test          # Run tests
npm run demo      # Run full demo
npm start         # Start with Notion
```

## Basic Usage

### 1. Quick Start (Simplest)

```javascript
import { quickStart } from './rag_system.js';

const result = await quickStart("Your requirements here", projectId);
```

### 2. Process Document

```javascript
import { processProjectDocument } from './integration/notion_rag_integration.js';

const document = {
  id: 1,
  name: "Requirements",
  type: "requirement",
  project_id: 1,
  content: "Your requirements..."
};

const result = await processProjectDocument(document, 1);
```

### 3. Custom Generation

```javascript
import { generateTasks } from './rag/task_generator.js';
import { chunkStore } from './rag/rag_retrieval.js';
import { chunkDocument } from './rag/chunk_structure.js';

// 1. Add document
const chunks = chunkDocument(content, { document_id: 1, project_id: 1 });
chunkStore.addDocument(document, chunks);

// 2. Generate
const result = await generateTasks(1, "task query");

// 3. Access tasks
result.tasks.forEach(task => console.log(task.task_name));
```

## Key Imports

```javascript
// Main system
import { quickStart, printSystemInfo } from './rag_system.js';

// Task schema
import { TaskSchema, validateTask } from './schema/task_schema.js';

// Chunking
import { chunkDocument, extractConstraints } from './rag/chunk_structure.js';

// Retrieval
import { retrieveTaskGenerationContext } from './rag/rag_retrieval.js';

// Generation
import { generateTasks } from './rag/task_generator.js';

// Validation
import { validateGeneratedTasks, validateRAGContext } from './validation/rag_validation.js';

// Integration
import { NotionRAGIntegration } from './integration/notion_rag_integration.js';
```

## Task Structure

```javascript
{
  task_name: string,              // Required
  description: string,            // Required
  constraints: string[],          // Optional
  success_criteria: string[],     // Optional
  has_constraints: boolean,       // Required (auto-computed)
  has_success_criteria: boolean,  // Required (auto-computed)
  project_id: number,             // Required
  document_ids: number[],         // Required
  chunk_ids: number[],            // Required
  dependencies: string[],         // Optional
  requirement_snippets: string[], // Required
  priority: 'high'|'medium'|'low', // Optional
  estimated_complexity: string    // Optional
}
```

## Validation

```javascript
// Validate task
const result = validateTask(task);
if (!result.valid) {
  console.log(result.errors);
}

// Validate RAG context
const contextValidation = validateRAGContext(ragContext);
console.log(contextValidation.valid);

// Validate all tasks
const report = validateGeneratedTasks(tasks, ragContext);
console.log(report.toString());
```

## Configuration Options

### Task Generator

```javascript
{
  validateBeforeReturn: true,  // Validate before returning
  autoComputeFields: true,     // Auto-compute has_* flags
  strictMode: true             // Reject invalid tasks
}
```

### Notion Integration

```javascript
{
  validateBeforeCreation: true,    // Validate before Notion
  createNotionTasks: true,         // Create in Notion
  includeMetadataInNotes: true     // Include metadata
}
```

### RAG Retrieval

```javascript
{
  project_id: 100,              // Filter by project
  document_type: 'requirement', // Filter by type
  limit: 20,                    // Max chunks
  threshold: 0.3                // Similarity threshold
}
```

## Common Patterns

### Pattern 1: Validate Before Generation

```javascript
const ragContext = await retrieveTaskGenerationContext(projectId);
const validation = validateRAGContext(ragContext);

if (!validation.valid) {
  console.error('RAG context invalid:', validation.issues);
  return;
}

const result = await generateTasks(projectId);
```

### Pattern 2: Custom Validation

```javascript
import { RAGValidator } from './validation/rag_validation.js';

const validator = new RAGValidator({
  strictMode: false,
  requireSnippets: true
});

const report = validator.validateTasks(tasks, ragContext);
```

### Pattern 3: Batch Processing

```javascript
import { processProjectDocuments } from './integration/notion_rag_integration.js';

const result = await processProjectDocuments(documents, projectId);
console.log(result.summary);
```

## Troubleshooting

### No tasks generated
- Check RAG context has chunks: `ragContext.chunks.length`
- Verify document content: `console.log(document.content)`
- Lower similarity threshold: `threshold: 0.2`

### Missing constraints/criteria
- Check document includes explicit constraints
- Review chunk classification: `chunk.metadata.semantic_type`
- Check extraction: `extractConstraints(content)`

### Validation failures
- Check requirement snippets: `task.requirement_snippets`
- Verify chunk references: `task.chunk_ids`
- Review flags: `task.has_constraints`

## Testing

```bash
# Run all tests
npm test

# Test specific component
node -e "import('./test/rag_system_test.js')"
```

## Environment Variables

```bash
NOTION_API_KEY=your_key_here
NOTION_DATABASE_ID=your_db_id_here
```

## Performance Tips

1. Use appropriate chunk size (default 1000 chars)
2. Set reasonable similarity threshold (0.3 recommended)
3. Limit max chunks (default 50)
4. Enable caching for repeated queries
5. Batch process multiple documents

## Best Practices

1. **Always validate RAG context before generation**
2. **Include explicit constraints in documents**
3. **Mark success criteria clearly**
4. **Review generated tasks before Notion creation**
5. **Use requirement snippets for traceability**

## File Structure

```
/workspace
├── schema/
│   └── task_schema.js         # Task schema definition
├── rag/
│   ├── chunk_structure.js     # Chunking & metadata
│   ├── rag_retrieval.js       # RAG retrieval
│   ├── task_generation_prompt.js # Prompt builder
│   └── task_generator.js      # Task generator
├── validation/
│   └── rag_validation.js      # Validation system
├── integration/
│   └── notion_rag_integration.js # Notion integration
├── demo/
│   └── rag_demo.js            # Demos
├── test/
│   └── rag_system_test.js     # Tests
├── docs/
│   └── RAG_SYSTEM_DOCUMENTATION.md # Full docs
├── rag_system.js              # Main entry point
└── index.js                   # Notion + RAG
```

## Support

See `docs/RAG_SYSTEM_DOCUMENTATION.md` for detailed documentation.
