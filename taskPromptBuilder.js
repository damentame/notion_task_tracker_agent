/**
 * RAG-Aligned Task Generation Prompt Builder
 * 
 * Builds task generation instruction prompts that embed RAG chunks directly
 * and enforce strict DB schema alignment for the main.task table.
 * 
 * This module constructs prompts that include:
 * - High-level query/objective
 * - Strict requirement sourcing rules
 * - Complete task schema matching DB main.task structure
 * - RAG context with document_id, chunk_id, requirement_type, constraints, success_criteria
 */

/**
 * Task Schema Definition (mirrors DB main.task table)
 */
export const TASK_SCHEMA = {
  task_name: "string - short imperative title (e.g., 'Implement authentication middleware')",
  task_type: "string - high-level category (e.g., 'implementation', 'design', 'testing', 'research', 'migration')",
  description: "string - multi-paragraph explanation referencing specific requirement text, intent, scope, and edge cases",
  parameters: "object - structured inputs or configuration needed by engineers or tools",
  status: "string - initial status; use 'PENDING' for all newly created tasks",
  priority: "integer - 1 is highest priority, larger numbers are lower priority (default: 3 if no indicators present)",
  task_notes: "string - additional free-form notes (risks, open questions, trade-offs)",
  task_data: {
    requirement_snippets: "array of strings - verbatim snippets from project_document text that justify this task",
    requirement_type: "string - from chunk metadata (e.g., 'functional', 'constraint', 'acceptance_criteria', 'general')",
    constraints: "array of strings - explicit constraints extracted from requirement text",
    success_criteria: "array of strings - explicit success/acceptance criteria sentences",
    execution_complexity: "string - estimated complexity level (e.g., 'low', 'medium', 'high', 'very_high')",
    project_id: "integer - project identifier",
    document_ids: "array of integers - all document_id values from chunks that informed this task",
    chunk_ids: "array of integers - all chunk_id values from chunks that informed this task",
  },
  dependencies: "array of strings - task_name of other tasks that must be completed first",
};

/**
 * Format RAG chunks for embedding in the prompt
 * 
 * @param {Array} ragChunks - Array of RAG chunk objects
 * @returns {string} Formatted RAG chunks section
 */
export function formatRAGChunks(ragChunks) {
  if (!ragChunks || ragChunks.length === 0) {
    return "No RAG chunks provided.";
  }

  let formatted = "RAG CHUNKS (Project Document Requirements):\n\n";
  
  ragChunks.forEach((chunk, index) => {
    formatted += `--- CHUNK ${index + 1} ---\n`;
    formatted += `Document ID: ${chunk.document_id || "N/A"}\n`;
    formatted += `Chunk ID: ${chunk.chunk_id || "N/A"}\n`;
    formatted += `Requirement Type: ${chunk.requirement_type || "general"}\n`;
    formatted += `Has Constraints: ${chunk.has_constraints ? "YES" : "NO"}\n`;
    formatted += `Has Success Criteria: ${chunk.has_success_criteria ? "YES" : "NO"}\n`;
    
    if (chunk.project_id) {
      formatted += `Project ID: ${chunk.project_id}\n`;
    }
    
    if (chunk.document_name) {
      formatted += `Document Name: ${chunk.document_name}\n`;
    }
    
    if (chunk.similarity_score !== undefined) {
      formatted += `Similarity Score: ${chunk.similarity_score.toFixed(4)}\n`;
    }
    
    formatted += `\nContent:\n${chunk.content || chunk.chunk_text || ""}\n\n`;
    
    if (chunk.extracted_constraints && chunk.extracted_constraints.length > 0) {
      formatted += `Extracted Constraints:\n`;
      chunk.extracted_constraints.forEach(constraint => {
        formatted += `  - ${constraint}\n`;
      });
      formatted += "\n";
    }
    
    if (chunk.extracted_success_criteria && chunk.extracted_success_criteria.length > 0) {
      formatted += `Extracted Success Criteria:\n`;
      chunk.extracted_success_criteria.forEach(criteria => {
        formatted += `  - ${criteria}\n`;
      });
      formatted += "\n";
    }
    
    formatted += "---\n\n";
  });
  
  return formatted;
}

/**
 * Format the task schema section for the prompt
 * 
 * @param {number|null} projectId - Project ID to include in schema
 * @returns {string} Formatted task schema section
 */
export function formatTaskSchema(projectId = null) {
  const projectIdValue = projectId !== null ? projectId : "use the project_id from the RAG chunks";
  
  return `TASK SCHEMA (MIRRORS DB main.task AND RELATED JSON FIELDS):

Each task MUST be returned as a JSON object with the following structure:

{
  "task_name": "string - short imperative title (e.g., 'Implement authentication middleware')",
  "task_type": "string - high-level category (e.g., 'implementation', 'design', 'testing', 'research', 'migration')",
  "description": "string - multi-paragraph explanation that:
    - references the specific requirement text it implements
    - explains the intent, scope, and any important edge cases",
  "parameters": {
    // object containing any structured inputs or configuration that engineers or tools will need
  },
  "status": "PENDING",
  "priority": "integer - where 1 is highest priority and larger numbers are lower priority.
    - Derive this from priority indicators in the text (e.g., 'critical', 'high', 'low') when present.
    - If no priority indicators are present, default to 3.",
  "task_notes": "string - additional free-form notes (risks, open questions, trade-offs)",
  "task_data": {
    "requirement_snippets": [
      "array of strings - each is a verbatim snippet from the project_document text that justifies this task"
    ],
    "requirement_type": "string - use the requirement_type field from the chunk when available (e.g., 'functional', 'constraint', 'acceptance_criteria', 'general')",
    "constraints": [
      "array of strings - explicit constraints extracted from the requirement text"
    ],
    "success_criteria": [
      "array of strings - explicit success/acceptance criteria sentences"
    ],
    "execution_complexity": "string - estimated complexity level: 'low', 'medium', 'high', or 'very_high'",
    "project_id": ${projectIdValue},
    "document_ids": [
      "array of integers - all document_id values from chunks that informed this task"
    ],
    "chunk_ids": [
      "array of integers - all chunk_id values from chunks that informed this task"
    ]
  },
  "dependencies": [
    "array of strings - each entry is the task_name of another task that must be completed first"
  ]
}

CRITICAL SCHEMA REQUIREMENTS:
- ALL fields listed above are REQUIRED unless explicitly marked optional
- task_data.execution_complexity MUST be one of: 'low', 'medium', 'high', 'very_high'
- task_data.document_ids and task_data.chunk_ids MUST be populated from the RAG chunks that informed each task
- task_data.requirement_snippets MUST contain verbatim quotes from the RAG chunk content
- task_data.constraints and task_data.success_criteria MUST be extracted from the requirement text, not invented
- dependencies MUST reference task_name values of other tasks in the generated list
- priority MUST be an integer (1 = highest, larger = lower priority)`;
}

/**
 * Build a complete RAG-aligned task generation prompt
 * 
 * @param {Object} options - Configuration options
 * @param {Array} options.ragChunks - RAG retrieval results with chunks
 * @param {string} options.taskQuery - High-level task query/objective (optional)
 * @param {number} options.projectId - Project ID (optional)
 * @param {number} options.documentId - Document ID (optional)
 * @param {string} options.agentId - Cursor agent ID (optional)
 * @param {string} options.dbAgentId - DB agent_id for traceability (optional)
 * @param {string} options.agentInstanceId - Agent instance ID used during planning (optional)
 * @returns {string} Complete task generation prompt
 */
export function buildTaskGenerationPrompt(options = {}) {
  const {
    ragChunks = [],
    taskQuery = null,
    projectId = null,
    documentId = null,
    agentId = null,
    dbAgentId = null,
    agentInstanceId = null,
  } = options;

  // Default objective if no task query provided
  const defaultObjective = 
    "Generate an exhaustive, implementation-ready task list for this project " +
    "based strictly on the provided project_document requirements and context.";
  
  const highLevelQuery = taskQuery || defaultObjective;

  // Build the complete prompt
  const prompt = `You are generating a detailed task plan for project_id=${projectId || 'UNKNOWN'} based ONLY on the requirements and context provided in the RAG chunks.

PRIMARY OBJECTIVE:
${highLevelQuery}

STRICT REQUIREMENT SOURCE:
- Every task MUST be directly justified by one or more requirement snippets taken from the project_document content represented in the RAG chunks.
- Do NOT invent requirements, constraints, or success criteria that are not explicitly present or clearly implied by that content.
- Each task MUST reference specific RAG chunks via document_ids and chunk_ids arrays.
- Each task MUST include verbatim requirement_snippets from the RAG chunk content that justify its existence.

REQUIREMENT TRACEABILITY:
- For each task you generate, you MUST populate:
  - task_data.document_ids: array of all document_id values from chunks that informed this task
  - task_data.chunk_ids: array of all chunk_id values from chunks that informed this task
  - task_data.requirement_snippets: array of verbatim text snippets from those chunks
- This ensures complete traceability from generated tasks back to source requirements.

${formatRAGChunks(ragChunks)}

${formatTaskSchema(projectId)}

TASK GENERATION INSTRUCTIONS:
1. Read through ALL RAG chunks carefully to understand the complete project scope
2. Identify distinct, actionable tasks that directly implement the requirements
3. For each task:
   a. Extract verbatim requirement snippets that justify the task
   b. Identify all constraints from the requirement text
   c. Identify all success criteria from the requirement text
   d. Determine execution complexity based on scope and technical difficulty
   e. Record all document_ids and chunk_ids that informed the task
   f. Identify dependencies on other tasks (if any)
4. Ensure tasks are:
   - Implementation-ready: clear enough for a developer to execute
   - Exhaustive: cover all requirements from the RAG chunks
   - Non-overlapping: each requirement aspect is covered by exactly one task
   - Properly ordered: dependencies reflect the natural execution sequence

OUTPUT FORMAT:
Return a JSON array of task objects, each conforming exactly to the schema above.

Example structure:
[
  {
    "task_name": "Implement user authentication API",
    "task_type": "implementation",
    "description": "Implement REST API endpoints for user authentication as specified in the requirements...",
    "parameters": {
      "endpoints": ["/api/auth/login", "/api/auth/logout"],
      "authentication_method": "JWT"
    },
    "status": "PENDING",
    "priority": 1,
    "task_notes": "Consider rate limiting for login attempts",
    "task_data": {
      "requirement_snippets": [
        "The system must provide secure user authentication via JWT tokens",
        "Login endpoint must validate credentials and return a token"
      ],
      "requirement_type": "functional",
      "constraints": [
        "Must use JWT tokens",
        "Must validate credentials before issuing tokens"
      ],
      "success_criteria": [
        "User can successfully log in with valid credentials",
        "Invalid credentials return appropriate error",
        "JWT token is returned on successful authentication"
      ],
      "execution_complexity": "medium",
      "project_id": ${projectId || 'null'},
      "document_ids": [1, 2],
      "chunk_ids": [5, 7, 12],
    },
    "dependencies": []
  }
]

CRITICAL REMINDERS:
- Base ALL tasks on the RAG chunks provided above
- Do NOT add tasks for requirements not present in the chunks
- ALWAYS populate document_ids and chunk_ids for traceability
- ALWAYS extract verbatim requirement_snippets
- ALWAYS identify constraints and success_criteria from the text
- ALWAYS assess execution_complexity
- Return valid JSON that can be parsed programmatically`;

  return prompt;
}

/**
 * Validate that a generated task conforms to the required schema
 * 
 * @param {Object} task - Task object to validate
 * @returns {Object} Validation result with { valid: boolean, errors: string[] }
 */
export function validateTaskSchema(task) {
  const errors = [];

  // Required top-level fields
  if (!task.task_name || typeof task.task_name !== 'string') {
    errors.push("Missing or invalid task_name");
  }
  if (!task.task_type || typeof task.task_type !== 'string') {
    errors.push("Missing or invalid task_type");
  }
  if (!task.description || typeof task.description !== 'string') {
    errors.push("Missing or invalid description");
  }
  if (!task.parameters || typeof task.parameters !== 'object') {
    errors.push("Missing or invalid parameters");
  }
  if (!task.status || typeof task.status !== 'string') {
    errors.push("Missing or invalid status");
  }
  if (typeof task.priority !== 'number' || task.priority < 1) {
    errors.push("Missing or invalid priority (must be integer >= 1)");
  }
  if (!Array.isArray(task.dependencies)) {
    errors.push("Missing or invalid dependencies (must be array)");
  }

  // Required task_data fields
  if (!task.task_data || typeof task.task_data !== 'object') {
    errors.push("Missing task_data object");
  } else {
    const td = task.task_data;
    
    if (!Array.isArray(td.requirement_snippets) || td.requirement_snippets.length === 0) {
      errors.push("task_data.requirement_snippets must be non-empty array");
    }
    if (!td.requirement_type || typeof td.requirement_type !== 'string') {
      errors.push("Missing or invalid task_data.requirement_type");
    }
    if (!Array.isArray(td.constraints)) {
      errors.push("task_data.constraints must be array");
    }
    if (!Array.isArray(td.success_criteria)) {
      errors.push("task_data.success_criteria must be array");
    }
    if (!['low', 'medium', 'high', 'very_high'].includes(td.execution_complexity)) {
      errors.push("task_data.execution_complexity must be one of: low, medium, high, very_high");
    }
    if (!Array.isArray(td.document_ids) || td.document_ids.length === 0) {
      errors.push("task_data.document_ids must be non-empty array");
    }
    if (!Array.isArray(td.chunk_ids) || td.chunk_ids.length === 0) {
      errors.push("task_data.chunk_ids must be non-empty array");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate an array of generated tasks
 * 
 * @param {Array} tasks - Array of task objects to validate
 * @returns {Object} Validation result with { valid: boolean, taskErrors: Array }
 */
export function validateTaskList(tasks) {
  if (!Array.isArray(tasks)) {
    return {
      valid: false,
      taskErrors: [{ error: "Tasks must be an array" }],
    };
  }

  const taskErrors = tasks.map((task, index) => {
    const validation = validateTaskSchema(task);
    return {
      index,
      task_name: task.task_name || `Task ${index + 1}`,
      valid: validation.valid,
      errors: validation.errors,
    };
  });

  const allValid = taskErrors.every(te => te.valid);

  return {
    valid: allValid,
    taskErrors: taskErrors.filter(te => !te.valid),
  };
}

/**
 * Extract metadata from RAG chunks for summary
 * 
 * @param {Array} ragChunks - Array of RAG chunk objects
 * @returns {Object} Summary metadata
 */
export function extractRAGMetadata(ragChunks) {
  if (!ragChunks || ragChunks.length === 0) {
    return {
      totalChunks: 0,
      uniqueDocuments: 0,
      requirementTypes: {},
      hasConstraints: 0,
      hasSuccessCriteria: 0,
    };
  }

  const uniqueDocIds = new Set();
  const requirementTypes = {};
  let hasConstraints = 0;
  let hasSuccessCriteria = 0;

  ragChunks.forEach(chunk => {
    if (chunk.document_id) {
      uniqueDocIds.add(chunk.document_id);
    }
    
    const reqType = chunk.requirement_type || 'general';
    requirementTypes[reqType] = (requirementTypes[reqType] || 0) + 1;
    
    if (chunk.has_constraints) {
      hasConstraints++;
    }
    if (chunk.has_success_criteria) {
      hasSuccessCriteria++;
    }
  });

  return {
    totalChunks: ragChunks.length,
    uniqueDocuments: uniqueDocIds.size,
    requirementTypes,
    hasConstraints,
    hasSuccessCriteria,
  };
}

// Default export for convenience
export default {
  buildTaskGenerationPrompt,
  validateTaskSchema,
  validateTaskList,
  extractRAGMetadata,
  formatRAGChunks,
  formatTaskSchema,
  TASK_SCHEMA,
};
