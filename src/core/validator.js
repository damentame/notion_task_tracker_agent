/**
 * Validator Module
 * 
 * Provides input validation and data sanitization utilities.
 * Ensures data integrity before processing.
 * 
 * @module core/validator
 */

import { ValidationError } from './errors.js';

class Validator {
  /**
   * Validate that a value is a non-empty string
   * 
   * @param {*} value - Value to validate
   * @param {string} fieldName - Name of field for error message
   * @throws {ValidationError} If validation fails
   */
  static requireString(value, fieldName) {
    if (typeof value !== 'string') {
      throw new ValidationError(
        `${fieldName} must be a string`,
        { field: fieldName, type: 'string', received: typeof value }
      );
    }
    if (value.trim().length === 0) {
      throw new ValidationError(
        `${fieldName} cannot be empty`,
        { field: fieldName, type: 'non-empty' }
      );
    }
    return value.trim();
  }

  /**
   * Validate that a value is a string with optional empty allowed
   * 
   * @param {*} value - Value to validate
   * @param {string} fieldName - Name of field for error message
   * @throws {ValidationError} If validation fails
   */
  static optionalString(value, fieldName) {
    if (value === undefined || value === null || value === '') {
      return '';
    }
    if (typeof value !== 'string') {
      throw new ValidationError(
        `${fieldName} must be a string`,
        { field: fieldName, type: 'string', received: typeof value }
      );
    }
    return value.trim();
  }

  /**
   * Validate that a value is a number
   * 
   * @param {*} value - Value to validate
   * @param {string} fieldName - Name of field for error message
   * @throws {ValidationError} If validation fails
   */
  static requireNumber(value, fieldName) {
    const num = Number(value);
    if (isNaN(num)) {
      throw new ValidationError(
        `${fieldName} must be a number`,
        { field: fieldName, type: 'number', received: typeof value }
      );
    }
    return num;
  }

  /**
   * Validate that a value is a boolean
   * 
   * @param {*} value - Value to validate
   * @param {string} fieldName - Name of field for error message
   * @throws {ValidationError} If validation fails
   */
  static requireBoolean(value, fieldName) {
    if (typeof value !== 'boolean') {
      throw new ValidationError(
        `${fieldName} must be a boolean`,
        { field: fieldName, type: 'boolean', received: typeof value }
      );
    }
    return value;
  }

  /**
   * Validate that a value is one of allowed values
   * 
   * @param {*} value - Value to validate
   * @param {Array} allowed - Array of allowed values
   * @param {string} fieldName - Name of field for error message
   * @throws {ValidationError} If validation fails
   */
  static requireEnum(value, allowed, fieldName) {
    if (!allowed.includes(value)) {
      throw new ValidationError(
        `${fieldName} must be one of: ${allowed.join(', ')}`,
        { field: fieldName, type: 'enum', allowed, received: value }
      );
    }
    return value;
  }

  /**
   * Validate string length constraints
   * 
   * @param {string} value - String to validate
   * @param {Object} options - Options with min and max length
   * @param {string} fieldName - Name of field for error message
   * @throws {ValidationError} If validation fails
   */
  static validateLength(value, options, fieldName) {
    const { min, max } = options;
    const length = value.length;

    if (min !== undefined && length < min) {
      throw new ValidationError(
        `${fieldName} must be at least ${min} characters`,
        { field: fieldName, type: 'min-length', min, length }
      );
    }

    if (max !== undefined && length > max) {
      throw new ValidationError(
        `${fieldName} must be at most ${max} characters`,
        { field: fieldName, type: 'max-length', max, length }
      );
    }

    return value;
  }

  /**
   * Validate a Notion page ID format
   * 
   * @param {string} pageId - Page ID to validate
   * @throws {ValidationError} If validation fails
   */
  static validateNotionPageId(pageId) {
    this.requireString(pageId, 'pageId');
    
    const pattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    const cleanId = pageId.replace(/-/g, '');
    
    if (cleanId.length !== 32 || !pattern.test(pageId)) {
      throw new ValidationError(
        'Invalid Notion page ID format',
        { field: 'pageId', expected: 'UUID format', received: pageId }
      );
    }

    return pageId;
  }

  /**
   * Validate task data structure
   * 
   * @param {Object} taskData - Task data to validate
   * @throws {ValidationError} If validation fails
   */
  static validateTaskData(taskData) {
    if (!taskData || typeof taskData !== 'object') {
      throw new ValidationError('Task data must be an object');
    }

    const validated = {
      title: this.requireString(taskData.title, 'title'),
      notes: this.optionalString(taskData.notes, 'notes'),
      assignedTo: this.optionalString(taskData.assignedTo, 'assignedTo'),
    };

    this.validateLength(validated.title, { min: 1, max: 2000 }, 'title');

    if (validated.notes) {
      this.validateLength(validated.notes, { max: 2000 }, 'notes');
    }

    return validated;
  }

  /**
   * Validate task status value
   * 
   * @param {string} status - Status to validate
   * @throws {ValidationError} If validation fails
   */
  static validateTaskStatus(status) {
    const allowedStatuses = ['To-do', 'In Progress', 'Done', 'Blocked'];
    return this.requireEnum(status, allowedStatuses, 'status');
  }

  /**
   * Sanitize string input by removing potentially dangerous characters
   * 
   * @param {string} input - Input to sanitize
   * @returns {string} Sanitized string
   */
  static sanitizeString(input) {
    if (typeof input !== 'string') {
      return '';
    }
    return input
      .trim()
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  }
}

export default Validator;
export { Validator };
