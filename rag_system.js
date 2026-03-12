/**
 * RAG-Enhanced Task Generation System
 * Main entry point for the RAG system
 */

// Core components
export { TaskSchema, validateTask, computeTaskFields } from './schema/task_schema.js';

// RAG components
export {
  ChunkSchema,
  SemanticTypes,
  extractConstraints,
  extractSuccessCriteria,
  classifyChunk,
  enrichChunk,
  chunkDocument,
  filterChunksByRelevance,
  groupChunksByDocument
} from './rag/chunk_structure.js';

export {
  RAGConfig,
  RAGResult,
  chunkStore,
  retrieveRAGContext,
  retrieveTaskGenerationContext
} from './rag/rag_retrieval.js';

export {
  buildTaskGenerationPrompt,
  buildSimpleTaskPrompt,
  buildExamplesSection,
  validatePrompt
} from './rag/task_generation_prompt.js';

export {
  TaskGenerationResult,
  TaskGenerator,
  generateTasks,
  validateTaskJustification
} from './rag/task_generator.js';

// Validation components
export {
  ValidationResult,
  ValidationReport,
  RAGValidator,
  validateGeneratedTasks,
  validateRAGContext
} from './validation/rag_validation.js';

// Integration components
export {
  NotionRAGIntegration,
  processProjectDocument,
  processProjectDocuments,
  ExampleDocument
} from './integration/notion_rag_integration.js';

// Demo
export { runDemo, runMinimalDemo } from './demo/rag_demo.js';

/**
 * Quick start function - Process a document and generate tasks
 */
export async function quickStart(documentContent, projectId, options = {}) {
  const { NotionRAGIntegration } = await import('./integration/notion_rag_integration.js');
  
  const integration = new NotionRAGIntegration({
    validateBeforeCreation: true,
    createNotionTasks: false,
    ...options
  });

  const document = {
    id: options.documentId || 1,
    name: options.documentName || 'Project Document',
    type: options.documentType || 'requirement',
    project_id: projectId,
    content: documentContent,
    taskQuery: options.taskQuery || null
  };

  return await integration.processDocument(document, projectId);
}

/**
 * System information
 */
export const SystemInfo = {
  name: 'RAG-Enhanced Task Generation System',
  version: '1.0.0',
  description: 'Strict, database-aligned task generation system that embeds RAG chunks directly into agent prompts',
  features: [
    'RAG-based requirement chunking and retrieval',
    'Constraint and success criteria extraction',
    'Database schema-aligned task generation',
    'Comprehensive validation system',
    'Notion integration for task management',
    'Requirement snippet justification tracking'
  ],
  constraints: [
    'Tasks must be directly justified by RAG chunks',
    'Must not invent requirements not present in source content',
    'Must align with main.task database schema',
    'Must extract and preserve constraints from source chunks',
    'Must extract and preserve success criteria from source chunks'
  ]
};

/**
 * Print system information
 */
export function printSystemInfo() {
  console.log(`\n=== ${SystemInfo.name} v${SystemInfo.version} ===\n`);
  console.log(SystemInfo.description);
  console.log('\nFeatures:');
  SystemInfo.features.forEach(f => console.log(`  • ${f}`));
  console.log('\nConstraints:');
  SystemInfo.constraints.forEach(c => console.log(`  • ${c}`));
  console.log('\n');
}

// Default export
export default {
  SystemInfo,
  quickStart,
  printSystemInfo
};
