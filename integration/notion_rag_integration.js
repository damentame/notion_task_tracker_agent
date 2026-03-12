/**
 * Notion RAG Integration
 * Integrates RAG-enhanced task generation with Notion task manager
 */

import { createTask, updateTask } from '../index.js';
import { generateTasks } from '../rag/task_generator.js';
import { validateGeneratedTasks } from '../validation/rag_validation.js';
import { chunkStore } from '../rag/rag_retrieval.js';
import { chunkDocument } from '../rag/chunk_structure.js';

/**
 * RAG-enhanced Notion task creation
 */
export class NotionRAGIntegration {
  constructor(options = {}) {
    this.options = {
      validateBeforeCreation: true,
      createNotionTasks: true,
      includeMetadataInNotes: true,
      ...options
    };
  }

  /**
   * Process a project document and generate tasks
   * @param {Object} document - Project document
   * @param {number} projectId - Project ID
   * @returns {Object} - Processing result
   */
  async processDocument(document, projectId) {
    console.log(`[NotionRAG] Processing document: ${document.name}`);

    // Step 1: Chunk the document
    const chunks = chunkDocument(document.content, {
      document_id: document.id,
      project_id: projectId,
      chunkSize: 1000,
      overlap: 200
    });

    console.log(`[NotionRAG] Created ${chunks.length} chunks`);

    // Step 2: Add chunks to store with metadata
    const enrichedChunks = chunkStore.addDocument(document, chunks);

    // Step 3: Generate tasks using RAG
    const taskResult = await generateTasks(projectId, document.taskQuery || null, {
      validateBeforeReturn: this.options.validateBeforeCreation,
      strictMode: false // Allow warnings but continue
    });

    console.log(`[NotionRAG] Generated ${taskResult.tasks.length} tasks`);

    // Step 4: Validate tasks
    let validationReport = null;
    if (this.options.validateBeforeCreation) {
      validationReport = validateGeneratedTasks(taskResult.tasks, taskResult.ragContext);
      console.log(`[NotionRAG] Validation: ${validationReport.getSummary().passed}/${validationReport.getSummary().total_tasks} passed`);
    }

    // Step 5: Create Notion tasks
    const notionTasks = [];
    if (this.options.createNotionTasks) {
      for (const task of taskResult.tasks) {
        try {
          const notionId = await this.createNotionTask(task);
          notionTasks.push({ task, notionId });
        } catch (error) {
          console.error(`[NotionRAG] Failed to create Notion task: ${task.task_name}`, error);
        }
      }
    }

    return {
      document,
      chunks: enrichedChunks,
      generatedTasks: taskResult.tasks,
      notionTasks,
      validationReport,
      summary: {
        chunks_created: enrichedChunks.length,
        tasks_generated: taskResult.tasks.length,
        notion_tasks_created: notionTasks.length,
        validation_passed: validationReport ? validationReport.getSummary().passed : null
      }
    };
  }

  /**
   * Create a Notion task from a generated task object
   */
  async createNotionTask(task) {
    const notes = this.options.includeMetadataInNotes 
      ? this._buildTaskNotes(task)
      : task.description;

    const title = task.task_name.substring(0, 200); // Notion title limit

    return await createTask(title, "Agent", notes);
  }

  /**
   * Build detailed notes for Notion task
   */
  _buildTaskNotes(task) {
    let notes = `${task.description}\n\n`;

    if (task.constraints && task.constraints.length > 0) {
      notes += `CONSTRAINTS:\n`;
      task.constraints.forEach(c => notes += `• ${c}\n`);
      notes += `\n`;
    }

    if (task.success_criteria && task.success_criteria.length > 0) {
      notes += `SUCCESS CRITERIA:\n`;
      task.success_criteria.forEach(sc => notes += `• ${sc}\n`);
      notes += `\n`;
    }

    if (task.dependencies && task.dependencies.length > 0) {
      notes += `DEPENDENCIES:\n`;
      task.dependencies.forEach(d => notes += `• ${d}\n`);
      notes += `\n`;
    }

    notes += `METADATA:\n`;
    notes += `• Project ID: ${task.project_id}\n`;
    notes += `• Documents: ${task.document_ids.join(', ')}\n`;
    notes += `• Chunks: ${task.chunk_ids.join(', ')}\n`;
    notes += `• Priority: ${task.priority || 'medium'}\n`;
    notes += `• Complexity: ${task.estimated_complexity || 'unknown'}\n`;

    if (task.requirement_snippets && task.requirement_snippets.length > 0) {
      notes += `\nREQUIREMENT SOURCES:\n`;
      task.requirement_snippets.slice(0, 2).forEach((snippet, idx) => {
        notes += `${idx + 1}. "${snippet.substring(0, 150)}..."\n`;
      });
    }

    return notes.substring(0, 2000); // Notion notes limit
  }

  /**
   * Update existing Notion task with task completion data
   */
  async completeNotionTask(notionId, completionNotes = "") {
    return await updateTask(notionId, "Done", completionNotes);
  }

  /**
   * Batch process multiple documents
   */
  async processDocuments(documents, projectId) {
    const results = [];

    for (const document of documents) {
      try {
        const result = await this.processDocument(document, projectId);
        results.push(result);
      } catch (error) {
        console.error(`[NotionRAG] Failed to process document: ${document.name}`, error);
        results.push({
          document,
          error: error.message,
          success: false
        });
      }
    }

    const summary = {
      total_documents: documents.length,
      successful: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      total_tasks: results.reduce((sum, r) => sum + (r.generatedTasks?.length || 0), 0),
      total_chunks: results.reduce((sum, r) => sum + (r.chunks?.length || 0), 0)
    };

    return { results, summary };
  }
}

/**
 * Convenience function to process a single document
 */
export async function processProjectDocument(document, projectId, options = {}) {
  const integration = new NotionRAGIntegration(options);
  return await integration.processDocument(document, projectId);
}

/**
 * Convenience function to process multiple documents
 */
export async function processProjectDocuments(documents, projectId, options = {}) {
  const integration = new NotionRAGIntegration(options);
  return await integration.processDocuments(documents, projectId);
}

/**
 * Example document structure for reference
 */
export const ExampleDocument = {
  id: 1,
  name: "Product Requirements Document",
  type: "requirement",
  project_id: 1,
  content: `
    The system must implement user authentication with the following requirements:
    
    CONSTRAINTS:
    - Must use JWT tokens with 24-hour expiration
    - Must not store passwords in plain text
    - Must implement rate limiting (5 attempts per minute)
    - Must support OAuth2 for Google and GitHub
    
    SUCCESS CRITERIA:
    - Users can successfully log in with valid credentials
    - Invalid login attempts are blocked after 5 tries
    - JWT tokens expire after 24 hours and require re-authentication
    - OAuth2 login works for both Google and GitHub accounts
    
    REQUIREMENTS:
    1. Implement JWT-based authentication system
    2. Add password hashing using bcrypt (minimum 10 rounds)
    3. Create rate limiting middleware
    4. Integrate OAuth2 providers
    5. Build login and registration endpoints
    6. Implement token refresh mechanism
  `,
  taskQuery: "Generate implementation tasks for user authentication system"
};
