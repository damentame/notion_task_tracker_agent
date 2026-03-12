/**
 * RAG-Enhanced Task Generator
 * Main component that generates tasks using RAG context
 */

import { retrieveTaskGenerationContext } from './rag_retrieval.js';
import { buildTaskGenerationPrompt } from './task_generation_prompt.js';
import { validateTask, computeTaskFields } from '../schema/task_schema.js';

/**
 * Task Generation Result
 */
export class TaskGenerationResult {
  constructor(tasks, ragContext, metadata = {}) {
    this.tasks = tasks;
    this.ragContext = ragContext;
    this.metadata = {
      total_tasks: tasks.length,
      tasks_with_constraints: tasks.filter(t => t.has_constraints).length,
      tasks_with_success_criteria: tasks.filter(t => t.has_success_criteria).length,
      total_chunks_used: ragContext.chunks.length,
      documents_referenced: ragContext.getDocumentIds().length,
      ...metadata
    };
    this.validationResults = [];
  }

  /**
   * Validate all generated tasks
   */
  validate() {
    this.validationResults = this.tasks.map(task => ({
      task_name: task.task_name,
      ...validateTask(task)
    }));

    return {
      allValid: this.validationResults.every(r => r.valid),
      results: this.validationResults
    };
  }

  /**
   * Get tasks that failed validation
   */
  getInvalidTasks() {
    return this.validationResults.filter(r => !r.valid);
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const validation = this.validate();
    
    return {
      ...this.metadata,
      valid_tasks: this.validationResults.filter(r => r.valid).length,
      invalid_tasks: this.validationResults.filter(r => !r.valid).length,
      all_tasks_valid: validation.allValid
    };
  }
}

/**
 * Main Task Generator Class
 */
export class TaskGenerator {
  constructor(options = {}) {
    this.options = {
      validateBeforeReturn: true,
      autoComputeFields: true,
      strictMode: true, // Reject tasks without proper justification
      ...options
    };
  }

  /**
   * Generate tasks for a project using RAG context
   * @param {number} projectId - Project identifier
   * @param {string} taskQuery - Optional task generation query
   * @param {Object} options - Additional options
   * @returns {TaskGenerationResult} - Generated tasks with metadata
   */
  async generateTasks(projectId, taskQuery = null, options = {}) {
    // Step 1: Retrieve RAG context
    console.log(`[TaskGenerator] Retrieving RAG context for project ${projectId}...`);
    const ragContext = await retrieveTaskGenerationContext(projectId, taskQuery);

    if (ragContext.chunks.length === 0) {
      throw new Error('No RAG chunks found for project. Cannot generate tasks without source requirements.');
    }

    console.log(`[TaskGenerator] Retrieved ${ragContext.chunks.length} chunks from ${ragContext.getDocumentIds().length} documents`);

    // Step 2: Build task generation prompt
    console.log('[TaskGenerator] Building task generation prompt...');
    const prompt = buildTaskGenerationPrompt(ragContext, {
      project_id: projectId,
      high_level_query: taskQuery,
      ...options
    });

    // Step 3: Generate tasks (in production, this would call an LLM API)
    console.log('[TaskGenerator] Generating tasks...');
    const generatedTasks = await this._generateTasksFromPrompt(prompt, ragContext);

    // Step 4: Post-process tasks
    console.log('[TaskGenerator] Post-processing tasks...');
    const processedTasks = this._postProcessTasks(generatedTasks, projectId, ragContext);

    // Step 5: Create result object
    const result = new TaskGenerationResult(processedTasks, ragContext, {
      prompt_length: prompt.length,
      generation_timestamp: new Date().toISOString()
    });

    // Step 6: Validate if required
    if (this.options.validateBeforeReturn) {
      const validation = result.validate();
      if (!validation.allValid && this.options.strictMode) {
        const invalidTasks = result.getInvalidTasks();
        console.warn(`[TaskGenerator] ${invalidTasks.length} tasks failed validation:`, invalidTasks);
        throw new Error(`Task generation validation failed. ${invalidTasks.length} tasks are invalid.`);
      }
    }

    console.log(`[TaskGenerator] Successfully generated ${result.tasks.length} tasks`);
    return result;
  }

  /**
   * Generate tasks from prompt
   * In production, this would call OpenAI, Anthropic, or similar LLM API
   * For now, this creates example tasks based on the RAG chunks
   */
  async _generateTasksFromPrompt(prompt, ragContext) {
    // This is a mock implementation that creates example tasks
    // In production, you would call an LLM API here:
    // const response = await openai.chat.completions.create({
    //   model: "gpt-4",
    //   messages: [{ role: "user", content: prompt }]
    // });
    // return JSON.parse(response.choices[0].message.content);

    const chunks = ragContext.chunks;
    const tasks = [];

    // If no chunks, return empty
    if (chunks.length === 0) {
      return [];
    }

    // Group chunks by semantic type
    const requirementChunks = chunks.filter(c => 
      c.metadata?.semantic_type === 'requirement' ||
      c.metadata?.semantic_type === 'specification'
    );

    // If no specific requirement chunks, use all chunks
    const chunksToProcess = requirementChunks.length > 0 ? requirementChunks : chunks;

    // Generate a task for each major requirement chunk
    chunksToProcess.slice(0, 5).forEach((chunk, idx) => {
      const constraintChunks = chunks.filter(c => c.metadata?.has_constraints);
      const successChunks = chunks.filter(c => c.metadata?.has_success_criteria);

      const constraints = constraintChunks.length > 0 
        ? constraintChunks[0].metadata.extracted_constraints || []
        : [];

      const successCriteria = successChunks.length > 0
        ? successChunks[0].metadata.extracted_success_criteria || []
        : [];

      tasks.push({
        task_name: `Implement requirement from ${chunk.metadata?.document_name || 'document'} - Task ${idx + 1}`,
        description: `Implement the requirement specified in chunk ${chunk.chunk_id}: ${chunk.content.substring(0, 200)}...`,
        constraints: constraints.slice(0, 3),
        success_criteria: successCriteria.slice(0, 3),
        has_constraints: constraints.length > 0,
        has_success_criteria: successCriteria.length > 0,
        project_id: chunk.project_id,
        document_ids: [chunk.document_id],
        chunk_ids: [chunk.chunk_id],
        dependencies: [],
        requirement_snippets: [chunk.content.substring(0, 300)],
        priority: 'medium',
        estimated_complexity: 'moderate'
      });
    });

    return tasks;
  }

  /**
   * Post-process generated tasks
   */
  _postProcessTasks(tasks, projectId, ragContext) {
    return tasks.map(task => {
      // Auto-compute fields if enabled
      if (this.options.autoComputeFields) {
        task = computeTaskFields(task);
      }

      // Ensure project_id is set
      if (!task.project_id) {
        task.project_id = projectId;
      }

      // Ensure arrays are initialized
      task.constraints = task.constraints || [];
      task.success_criteria = task.success_criteria || [];
      task.document_ids = task.document_ids || [];
      task.chunk_ids = task.chunk_ids || [];
      task.dependencies = task.dependencies || [];
      task.requirement_snippets = task.requirement_snippets || [];

      return task;
    });
  }

  /**
   * Generate tasks with custom RAG result (for testing)
   */
  async generateTasksFromRAG(ragResult, projectId, taskQuery = null) {
    const prompt = buildTaskGenerationPrompt(ragResult, {
      project_id: projectId,
      high_level_query: taskQuery
    });

    const generatedTasks = await this._generateTasksFromPrompt(prompt, ragResult);
    const processedTasks = this._postProcessTasks(generatedTasks, projectId, ragResult);

    return new TaskGenerationResult(processedTasks, ragResult);
  }
}

/**
 * Convenience function to generate tasks
 */
export async function generateTasks(projectId, taskQuery = null, options = {}) {
  const generator = new TaskGenerator(options);
  return await generator.generateTasks(projectId, taskQuery, options);
}

/**
 * Validate that generated tasks are justified by RAG chunks
 */
export function validateTaskJustification(task, ragContext) {
  const errors = [];
  const warnings = [];

  // Check that chunk_ids reference actual chunks
  const validChunkIds = ragContext.getChunkIds();
  const invalidChunkIds = task.chunk_ids.filter(id => !validChunkIds.includes(id));
  
  if (invalidChunkIds.length > 0) {
    errors.push(`Task references non-existent chunk IDs: ${invalidChunkIds.join(', ')}`);
  }

  // Check that document_ids reference actual documents
  const validDocIds = ragContext.getDocumentIds();
  const invalidDocIds = task.document_ids.filter(id => !validDocIds.includes(id));
  
  if (invalidDocIds.length > 0) {
    errors.push(`Task references non-existent document IDs: ${invalidDocIds.join(', ')}`);
  }

  // Check that requirement snippets exist in chunks
  if (task.requirement_snippets) {
    task.requirement_snippets.forEach(snippet => {
      const found = ragContext.chunks.some(chunk => 
        chunk.content.includes(snippet.substring(0, 50))
      );
      
      if (!found) {
        warnings.push(`Requirement snippet not found in RAG chunks: "${snippet.substring(0, 50)}..."`);
      }
    });
  }

  // Check constraints are justified
  if (task.constraints && task.constraints.length > 0) {
    const constraintChunks = ragContext.getConstraintChunks();
    if (constraintChunks.length === 0) {
      warnings.push('Task has constraints but no constraint chunks were retrieved');
    }
  }

  // Check success criteria are justified
  if (task.success_criteria && task.success_criteria.length > 0) {
    const successChunks = ragContext.getSuccessCriteriaChunks();
    if (successChunks.length === 0) {
      warnings.push('Task has success criteria but no success criteria chunks were retrieved');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
