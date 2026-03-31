/**
 * TypeScript type definitions for RAG-Aligned Task Generation Prompt Builder
 */

/**
 * RAG chunk object structure
 */
export interface RAGChunk {
  document_id: number;
  chunk_id: number;
  requirement_type?: 'functional' | 'constraint' | 'acceptance_criteria' | 'general';
  has_constraints?: boolean;
  has_success_criteria?: boolean;
  project_id?: number;
  document_name?: string;
  similarity_score?: number;
  content?: string;
  chunk_text?: string;
  extracted_constraints?: string[];
  extracted_success_criteria?: string[];
}

/**
 * Task data structure (nested within Task)
 */
export interface TaskData {
  requirement_snippets: string[];
  requirement_type: string;
  constraints: string[];
  success_criteria: string[];
  execution_complexity: 'low' | 'medium' | 'high' | 'very_high';
  project_id: number | null;
  document_ids: number[];
  chunk_ids: number[];
}

/**
 * Complete task structure (mirrors DB main.task table)
 */
export interface Task {
  task_name: string;
  task_type: string;
  description: string;
  parameters: Record<string, any>;
  status: string;
  priority: number;
  task_notes?: string;
  task_data: TaskData;
  dependencies: string[];
}

/**
 * Options for building task generation prompt
 */
export interface TaskPromptOptions {
  ragChunks?: RAGChunk[];
  taskQuery?: string;
  projectId?: number;
  documentId?: number;
  agentId?: string;
  dbAgentId?: string;
  agentInstanceId?: string;
}

/**
 * Validation result for a single task
 */
export interface TaskValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Task error information
 */
export interface TaskError {
  index: number;
  task_name: string;
  valid: boolean;
  errors: string[];
}

/**
 * Validation result for a list of tasks
 */
export interface TaskListValidation {
  valid: boolean;
  taskErrors: TaskError[];
}

/**
 * RAG metadata summary
 */
export interface RAGMetadata {
  totalChunks: number;
  uniqueDocuments: number;
  requirementTypes: Record<string, number>;
  hasConstraints: number;
  hasSuccessCriteria: number;
}

/**
 * Task schema constant
 */
export const TASK_SCHEMA: {
  task_name: string;
  task_type: string;
  description: string;
  parameters: string;
  status: string;
  priority: string;
  task_notes: string;
  task_data: {
    requirement_snippets: string;
    requirement_type: string;
    constraints: string;
    success_criteria: string;
    execution_complexity: string;
    project_id: string;
    document_ids: string;
    chunk_ids: string;
  };
  dependencies: string;
};

/**
 * Build a complete RAG-aligned task generation prompt
 * 
 * @param options - Configuration options
 * @returns Complete task generation prompt string
 */
export function buildTaskGenerationPrompt(options?: TaskPromptOptions): string;

/**
 * Validate that a task conforms to the required schema
 * 
 * @param task - Task object to validate
 * @returns Validation result with errors if any
 */
export function validateTaskSchema(task: Task): TaskValidation;

/**
 * Validate an array of tasks
 * 
 * @param tasks - Array of task objects to validate
 * @returns Validation result with task-specific errors
 */
export function validateTaskList(tasks: Task[]): TaskListValidation;

/**
 * Extract summary metadata from RAG chunks
 * 
 * @param ragChunks - Array of RAG chunk objects
 * @returns Summary metadata
 */
export function extractRAGMetadata(ragChunks: RAGChunk[]): RAGMetadata;

/**
 * Format RAG chunks for embedding in the prompt
 * 
 * @param ragChunks - Array of RAG chunk objects
 * @returns Formatted RAG chunks section
 */
export function formatRAGChunks(ragChunks: RAGChunk[]): string;

/**
 * Format the task schema section for the prompt
 * 
 * @param projectId - Project ID to include in schema
 * @returns Formatted task schema section
 */
export function formatTaskSchema(projectId?: number | null): string;

/**
 * Default export containing all functions
 */
declare const _default: {
  buildTaskGenerationPrompt: typeof buildTaskGenerationPrompt;
  validateTaskSchema: typeof validateTaskSchema;
  validateTaskList: typeof validateTaskList;
  extractRAGMetadata: typeof extractRAGMetadata;
  formatRAGChunks: typeof formatRAGChunks;
  formatTaskSchema: typeof formatTaskSchema;
  TASK_SCHEMA: typeof TASK_SCHEMA;
};

export default _default;
