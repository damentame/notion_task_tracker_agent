/**
 * RAG Validation System
 * Validates that generated tasks are properly justified by RAG chunks
 */

import { validateTask } from '../schema/task_schema.js';
import { validateTaskJustification } from '../rag/task_generator.js';

/**
 * Comprehensive validation result
 */
export class ValidationResult {
  constructor(taskName) {
    this.taskName = taskName;
    this.schemaValid = false;
    this.justificationValid = false;
    this.errors = [];
    this.warnings = [];
    this.passed = false;
  }

  addError(error) {
    this.errors.push(error);
  }

  addWarning(warning) {
    this.warnings.push(warning);
  }

  finalize() {
    this.passed = this.schemaValid && this.justificationValid && this.errors.length === 0;
  }

  toString() {
    const status = this.passed ? '✓ PASSED' : '✗ FAILED';
    let output = `${status}: ${this.taskName}\n`;
    
    if (this.errors.length > 0) {
      output += `  Errors:\n`;
      this.errors.forEach(e => output += `    - ${e}\n`);
    }
    
    if (this.warnings.length > 0) {
      output += `  Warnings:\n`;
      this.warnings.forEach(w => output += `    - ${w}\n`);
    }
    
    return output;
  }
}

/**
 * Validation report for multiple tasks
 */
export class ValidationReport {
  constructor(tasks, ragContext) {
    this.tasks = tasks;
    this.ragContext = ragContext;
    this.results = [];
    this.timestamp = new Date().toISOString();
  }

  addResult(result) {
    this.results.push(result);
  }

  getSummary() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalErrors = this.results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = this.results.reduce((sum, r) => sum + r.warnings.length, 0);

    return {
      total_tasks: this.tasks.length,
      passed,
      failed,
      pass_rate: this.tasks.length > 0 ? (passed / this.tasks.length * 100).toFixed(1) : 0,
      total_errors: totalErrors,
      total_warnings: totalWarnings,
      timestamp: this.timestamp
    };
  }

  toString() {
    const summary = this.getSummary();
    let output = `\n=== VALIDATION REPORT ===\n`;
    output += `Total Tasks: ${summary.total_tasks}\n`;
    output += `Passed: ${summary.passed} (${summary.pass_rate}%)\n`;
    output += `Failed: ${summary.failed}\n`;
    output += `Total Errors: ${summary.total_errors}\n`;
    output += `Total Warnings: ${summary.total_warnings}\n`;
    output += `Timestamp: ${summary.timestamp}\n`;
    output += `\n`;

    this.results.forEach(result => {
      output += result.toString() + '\n';
    });

    return output;
  }
}

/**
 * Main RAG validator
 */
export class RAGValidator {
  constructor(options = {}) {
    this.options = {
      strictMode: true,
      requireSnippets: true,
      requireChunkReferences: true,
      requireDocumentReferences: true,
      validateConstraints: true,
      validateSuccessCriteria: true,
      ...options
    };
  }

  /**
   * Validate a single task against RAG context
   */
  validateTask(task, ragContext) {
    const result = new ValidationResult(task.task_name);

    // 1. Schema validation
    const schemaValidation = validateTask(task);
    result.schemaValid = schemaValidation.valid;
    
    if (!schemaValidation.valid) {
      schemaValidation.errors.forEach(e => result.addError(`Schema: ${e}`));
    }

    // 2. RAG justification validation
    const justificationValidation = validateTaskJustification(task, ragContext);
    result.justificationValid = justificationValidation.valid;
    
    if (!justificationValidation.valid) {
      justificationValidation.errors.forEach(e => result.addError(`Justification: ${e}`));
    }
    
    justificationValidation.warnings.forEach(w => result.addWarning(w));

    // 3. Additional strict validations
    if (this.options.strictMode) {
      this._strictValidation(task, ragContext, result);
    }

    result.finalize();
    return result;
  }

  /**
   * Validate multiple tasks
   */
  validateTasks(tasks, ragContext) {
    const report = new ValidationReport(tasks, ragContext);

    tasks.forEach(task => {
      const result = this.validateTask(task, ragContext);
      report.addResult(result);
    });

    return report;
  }

  /**
   * Strict validation rules
   */
  _strictValidation(task, ragContext, result) {
    // Require requirement snippets
    if (this.options.requireSnippets) {
      if (!task.requirement_snippets || task.requirement_snippets.length === 0) {
        result.addError('No requirement snippets provided - task not justified');
      }
    }

    // Require chunk references
    if (this.options.requireChunkReferences) {
      if (!task.chunk_ids || task.chunk_ids.length === 0) {
        result.addError('No chunk references provided - cannot trace to source');
      }
    }

    // Require document references
    if (this.options.requireDocumentReferences) {
      if (!task.document_ids || task.document_ids.length === 0) {
        result.addError('No document references provided - cannot trace to source');
      }
    }

    // Validate constraints extraction
    if (this.options.validateConstraints && task.has_constraints) {
      if (!task.constraints || task.constraints.length === 0) {
        result.addError('has_constraints is true but constraints array is empty');
      }

      // Check that constraints appear to be from RAG content
      if (task.constraints) {
        task.constraints.forEach(constraint => {
          if (constraint.length < 10) {
            result.addWarning(`Constraint seems too short: "${constraint}"`);
          }
        });
      }
    }

    // Validate success criteria extraction
    if (this.options.validateSuccessCriteria && task.has_success_criteria) {
      if (!task.success_criteria || task.success_criteria.length === 0) {
        result.addError('has_success_criteria is true but success_criteria array is empty');
      }

      // Check that success criteria appear to be from RAG content
      if (task.success_criteria) {
        task.success_criteria.forEach(criterion => {
          if (criterion.length < 10) {
            result.addWarning(`Success criterion seems too short: "${criterion}"`);
          }
        });
      }
    }

    // Validate requirement snippets are actual quotes
    if (task.requirement_snippets) {
      task.requirement_snippets.forEach((snippet, idx) => {
        if (snippet.length < 20) {
          result.addWarning(`Requirement snippet ${idx + 1} is very short: "${snippet}"`);
        }

        // Check if snippet appears in any chunk
        const foundInChunk = ragContext.chunks.some(chunk => 
          this._normalizeText(chunk.content).includes(this._normalizeText(snippet.substring(0, 30)))
        );

        if (!foundInChunk) {
          result.addWarning(`Requirement snippet ${idx + 1} not found in RAG chunks (may be paraphrased)`);
        }
      });
    }
  }

  /**
   * Normalize text for comparison
   */
  _normalizeText(text) {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  /**
   * Validate RAG chunk quality before task generation
   */
  validateRAGChunks(ragContext) {
    const issues = [];
    const warnings = [];

    if (!ragContext || !ragContext.chunks) {
      issues.push('RAG context is null or has no chunks');
      return { valid: false, issues, warnings };
    }

    if (ragContext.chunks.length === 0) {
      issues.push('No RAG chunks available - cannot generate tasks');
      return { valid: false, issues, warnings };
    }

    // Check chunk quality
    ragContext.chunks.forEach((chunk, idx) => {
      if (!chunk.content || chunk.content.length < 50) {
        warnings.push(`Chunk ${chunk.chunk_id || idx} has very short content (< 50 chars)`);
      }

      if (!chunk.chunk_id) {
        warnings.push(`Chunk ${idx} is missing chunk_id`);
      }

      if (!chunk.document_id) {
        warnings.push(`Chunk ${chunk.chunk_id || idx} is missing document_id`);
      }

      if (!chunk.metadata) {
        warnings.push(`Chunk ${chunk.chunk_id || idx} is missing metadata`);
      }
    });

    // Check for diversity
    const documentIds = new Set(ragContext.chunks.map(c => c.document_id));
    if (documentIds.size === 1 && ragContext.chunks.length > 5) {
      warnings.push('All chunks come from a single document - may lack context diversity');
    }

    // Check for constraint/success criteria coverage
    const hasConstraints = ragContext.chunks.some(c => c.metadata?.has_constraints);
    const hasSuccessCriteria = ragContext.chunks.some(c => c.metadata?.has_success_criteria);

    if (!hasConstraints) {
      warnings.push('No chunks contain explicit constraints - generated tasks may lack constraints');
    }

    if (!hasSuccessCriteria) {
      warnings.push('No chunks contain success criteria - generated tasks may lack acceptance criteria');
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      metadata: {
        total_chunks: ragContext.chunks.length,
        unique_documents: documentIds.size,
        has_constraints: hasConstraints,
        has_success_criteria: hasSuccessCriteria
      }
    };
  }
}

/**
 * Convenience function to validate tasks
 */
export function validateGeneratedTasks(tasks, ragContext, options = {}) {
  const validator = new RAGValidator(options);
  return validator.validateTasks(tasks, ragContext);
}

/**
 * Convenience function to validate RAG chunks
 */
export function validateRAGContext(ragContext) {
  const validator = new RAGValidator();
  return validator.validateRAGChunks(ragContext);
}
