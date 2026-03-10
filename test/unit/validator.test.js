/**
 * Unit tests for Validator module
 */

import { describe, it, expect } from '@jest/globals';
import Validator from '../../src/core/validator.js';
import { ValidationError } from '../../src/core/errors.js';

describe('Validator Module', () => {
  describe('requireString', () => {
    it('should validate and return trimmed string', () => {
      const result = Validator.requireString('  test  ', 'field');
      expect(result).toBe('test');
    });

    it('should throw error for non-string values', () => {
      expect(() => Validator.requireString(123, 'field'))
        .toThrow(ValidationError);
      expect(() => Validator.requireString(null, 'field'))
        .toThrow(ValidationError);
      expect(() => Validator.requireString(undefined, 'field'))
        .toThrow(ValidationError);
    });

    it('should throw error for empty strings', () => {
      expect(() => Validator.requireString('', 'field'))
        .toThrow(ValidationError);
      expect(() => Validator.requireString('   ', 'field'))
        .toThrow(ValidationError);
    });

    it('should include field name in error message', () => {
      expect(() => Validator.requireString(123, 'email'))
        .toThrow(/email/);
    });
  });

  describe('optionalString', () => {
    it('should return empty string for undefined/null', () => {
      expect(Validator.optionalString(undefined, 'field')).toBe('');
      expect(Validator.optionalString(null, 'field')).toBe('');
      expect(Validator.optionalString('', 'field')).toBe('');
    });

    it('should validate and return trimmed string', () => {
      const result = Validator.optionalString('  test  ', 'field');
      expect(result).toBe('test');
    });

    it('should throw error for non-string values', () => {
      expect(() => Validator.optionalString(123, 'field'))
        .toThrow(ValidationError);
    });
  });

  describe('requireNumber', () => {
    it('should validate and return number', () => {
      expect(Validator.requireNumber(123, 'field')).toBe(123);
      expect(Validator.requireNumber('456', 'field')).toBe(456);
      expect(Validator.requireNumber(0, 'field')).toBe(0);
    });

    it('should throw error for non-numeric values', () => {
      expect(() => Validator.requireNumber('abc', 'field'))
        .toThrow(ValidationError);
      expect(() => Validator.requireNumber({}, 'field'))
        .toThrow(ValidationError);
    });
  });

  describe('requireBoolean', () => {
    it('should validate boolean values', () => {
      expect(Validator.requireBoolean(true, 'field')).toBe(true);
      expect(Validator.requireBoolean(false, 'field')).toBe(false);
    });

    it('should throw error for non-boolean values', () => {
      expect(() => Validator.requireBoolean(1, 'field'))
        .toThrow(ValidationError);
      expect(() => Validator.requireBoolean('true', 'field'))
        .toThrow(ValidationError);
    });
  });

  describe('requireEnum', () => {
    const allowed = ['option1', 'option2', 'option3'];

    it('should validate allowed values', () => {
      expect(Validator.requireEnum('option1', allowed, 'field')).toBe('option1');
      expect(Validator.requireEnum('option2', allowed, 'field')).toBe('option2');
    });

    it('should throw error for values not in allowed list', () => {
      expect(() => Validator.requireEnum('invalid', allowed, 'field'))
        .toThrow(ValidationError);
    });

    it('should include allowed values in error message', () => {
      try {
        Validator.requireEnum('invalid', allowed, 'field');
      } catch (error) {
        expect(error.message).toContain('option1');
        expect(error.message).toContain('option2');
        expect(error.message).toContain('option3');
      }
    });
  });

  describe('validateLength', () => {
    it('should validate minimum length', () => {
      const result = Validator.validateLength('test', { min: 2 }, 'field');
      expect(result).toBe('test');
    });

    it('should throw error for strings below minimum length', () => {
      expect(() => Validator.validateLength('a', { min: 2 }, 'field'))
        .toThrow(ValidationError);
    });

    it('should validate maximum length', () => {
      const result = Validator.validateLength('test', { max: 10 }, 'field');
      expect(result).toBe('test');
    });

    it('should throw error for strings above maximum length', () => {
      expect(() => Validator.validateLength('test', { max: 2 }, 'field'))
        .toThrow(ValidationError);
    });

    it('should validate both min and max', () => {
      const result = Validator.validateLength('test', { min: 2, max: 10 }, 'field');
      expect(result).toBe('test');
    });
  });

  describe('validateNotionPageId', () => {
    it('should validate valid UUID format', () => {
      const validId = '12345678-1234-1234-1234-123456789abc';
      const result = Validator.validateNotionPageId(validId);
      expect(result).toBe(validId);
    });

    it('should throw error for invalid UUID format', () => {
      expect(() => Validator.validateNotionPageId('invalid-id'))
        .toThrow(ValidationError);
      expect(() => Validator.validateNotionPageId('12345678'))
        .toThrow(ValidationError);
    });

    it('should throw error for non-string values', () => {
      expect(() => Validator.validateNotionPageId(123))
        .toThrow(ValidationError);
    });
  });

  describe('validateTaskData', () => {
    it('should validate valid task data', () => {
      const taskData = {
        title: 'Test Task',
        notes: 'Some notes',
        assignedTo: 'John',
      };
      
      const result = Validator.validateTaskData(taskData);
      
      expect(result.title).toBe('Test Task');
      expect(result.notes).toBe('Some notes');
      expect(result.assignedTo).toBe('John');
    });

    it('should handle optional fields', () => {
      const taskData = { title: 'Test Task' };
      const result = Validator.validateTaskData(taskData);
      
      expect(result.title).toBe('Test Task');
      expect(result.notes).toBe('');
      expect(result.assignedTo).toBe('');
    });

    it('should throw error for missing title', () => {
      expect(() => Validator.validateTaskData({}))
        .toThrow(ValidationError);
    });

    it('should throw error for invalid task data type', () => {
      expect(() => Validator.validateTaskData(null))
        .toThrow(ValidationError);
      expect(() => Validator.validateTaskData('string'))
        .toThrow(ValidationError);
    });

    it('should enforce title length constraints', () => {
      const taskData = { title: 'a'.repeat(2001) };
      expect(() => Validator.validateTaskData(taskData))
        .toThrow(ValidationError);
    });

    it('should enforce notes length constraints', () => {
      const taskData = {
        title: 'Test',
        notes: 'a'.repeat(2001),
      };
      expect(() => Validator.validateTaskData(taskData))
        .toThrow(ValidationError);
    });
  });

  describe('validateTaskStatus', () => {
    it('should validate allowed status values', () => {
      expect(Validator.validateTaskStatus('To-do')).toBe('To-do');
      expect(Validator.validateTaskStatus('In Progress')).toBe('In Progress');
      expect(Validator.validateTaskStatus('Done')).toBe('Done');
      expect(Validator.validateTaskStatus('Blocked')).toBe('Blocked');
    });

    it('should throw error for invalid status', () => {
      expect(() => Validator.validateTaskStatus('Invalid'))
        .toThrow(ValidationError);
    });
  });

  describe('sanitizeString', () => {
    it('should remove control characters', () => {
      const input = 'test\x00\x08string';
      const result = Validator.sanitizeString(input);
      expect(result).toBe('teststring');
    });

    it('should trim whitespace', () => {
      const result = Validator.sanitizeString('  test  ');
      expect(result).toBe('test');
    });

    it('should return empty string for non-string input', () => {
      expect(Validator.sanitizeString(123)).toBe('');
      expect(Validator.sanitizeString(null)).toBe('');
    });

    it('should preserve valid characters', () => {
      const input = 'Test String 123!@#';
      const result = Validator.sanitizeString(input);
      expect(result).toBe(input);
    });
  });
});
