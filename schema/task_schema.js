/**
 * Task Schema Definition
 * Aligned with main.task database schema requirements for RAG-enhanced task generation
 */

export const TaskSchema = {
  /**
   * Core task fields that must be populated
   */
  fields: {
    task_name: {
      type: 'string',
      required: true,
      description: 'Clear, concise task name',
      maxLength: 200
    },
    description: {
      type: 'string',
      required: true,
      description: 'Detailed task description with implementation guidance'
    },
    constraints: {
      type: 'array',
      items: 'string',
      required: false,
      description: 'Explicit constraints extracted from requirement text'
    },
    success_criteria: {
      type: 'array',
      items: 'string',
      required: false,
      description: 'Explicit success/acceptance criteria sentences'
    },
    has_constraints: {
      type: 'boolean',
      required: true,
      description: 'True if task has explicit constraints',
      computed: (task) => task.constraints && task.constraints.length > 0
    },
    has_success_criteria: {
      type: 'boolean',
      required: true,
      description: 'True if task has explicit success criteria',
      computed: (task) => task.success_criteria && task.success_criteria.length > 0
    },
    project_id: {
      type: 'integer',
      required: false,
      description: 'Project identifier from RAG chunks'
    },
    document_ids: {
      type: 'array',
      items: 'integer',
      required: true,
      description: 'All document_id values from chunks that informed this task'
    },
    chunk_ids: {
      type: 'array',
      items: 'integer',
      required: true,
      description: 'All chunk_id values from chunks that informed this task'
    },
    dependencies: {
      type: 'array',
      items: 'string',
      required: false,
      description: 'Task names of other tasks that must be completed first'
    },
    requirement_snippets: {
      type: 'array',
      items: 'string',
      required: true,
      description: 'Direct quotes from RAG chunks that justify this task'
    },
    priority: {
      type: 'string',
      enum: ['high', 'medium', 'low'],
      required: false,
      default: 'medium'
    },
    estimated_complexity: {
      type: 'string',
      enum: ['simple', 'moderate', 'complex'],
      required: false
    }
  },

  /**
   * Validation rules for generated tasks
   */
  validation: {
    /**
     * Ensure task has at least one requirement snippet justification
     */
    requireJustification: (task) => {
      return task.requirement_snippets && task.requirement_snippets.length > 0;
    },

    /**
     * Ensure chunk references are provided
     */
    requireChunkReferences: (task) => {
      return task.chunk_ids && task.chunk_ids.length > 0;
    },

    /**
     * Ensure document references are provided
     */
    requireDocumentReferences: (task) => {
      return task.document_ids && task.document_ids.length > 0;
    },

    /**
     * Validate that constraints flag matches actual constraints
     */
    validateConstraintsFlag: (task) => {
      const hasConstraints = task.constraints && task.constraints.length > 0;
      return task.has_constraints === hasConstraints;
    },

    /**
     * Validate that success criteria flag matches actual criteria
     */
    validateSuccessCriteriaFlag: (task) => {
      const hasCriteria = task.success_criteria && task.success_criteria.length > 0;
      return task.has_success_criteria === hasCriteria;
    }
  }
};

/**
 * Validate a task object against the schema
 * @param {Object} task - Task object to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateTask(task) {
  const errors = [];

  // Check required fields
  for (const [fieldName, fieldSpec] of Object.entries(TaskSchema.fields)) {
    if (fieldSpec.required && !task[fieldName]) {
      errors.push(`Missing required field: ${fieldName}`);
    }
  }

  // Run validation rules
  for (const [ruleName, ruleFunc] of Object.entries(TaskSchema.validation)) {
    if (!ruleFunc(task)) {
      errors.push(`Validation failed: ${ruleName}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Compute derived fields for a task
 * @param {Object} task - Task object
 * @returns {Object} - Task with computed fields
 */
export function computeTaskFields(task) {
  return {
    ...task,
    has_constraints: task.constraints && task.constraints.length > 0,
    has_success_criteria: task.success_criteria && task.success_criteria.length > 0
  };
}
