/**
 * Unit tests for Error Handler module
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  AppError,
  ConfigError,
  ValidationError,
  APIError,
  NotionAPIError,
  NotFoundError,
  ErrorHandler,
} from '../../src/core/errors.js';
import { Logger } from '../../src/core/logger.js';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with message and default values', () => {
      const error = new AppError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('AppError');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should create error with custom status code', () => {
      const error = new AppError('Test error', 404);
      expect(error.statusCode).toBe(404);
    });

    it('should create non-operational error', () => {
      const error = new AppError('Test error', 500, false);
      expect(error.isOperational).toBe(false);
    });

    it('should convert to JSON', () => {
      const error = new AppError('Test error', 400);
      const json = error.toJSON();
      
      expect(json.name).toBe('AppError');
      expect(json.message).toBe('Test error');
      expect(json.statusCode).toBe(400);
      expect(json.isOperational).toBe(true);
    });
  });

  describe('ConfigError', () => {
    it('should create configuration error', () => {
      const error = new ConfigError('Missing API key');
      
      expect(error.message).toBe('Missing API key');
      expect(error.name).toBe('ConfigError');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('ValidationError');
      expect(error.statusCode).toBe(400);
    });

    it('should include validation details', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const error = new ValidationError('Invalid input', details);
      
      expect(error.details).toEqual(details);
    });

    it('should include details in JSON', () => {
      const details = { field: 'email' };
      const error = new ValidationError('Invalid input', details);
      const json = error.toJSON();
      
      expect(json.details).toEqual(details);
    });
  });

  describe('APIError', () => {
    it('should create API error', () => {
      const error = new APIError('API failed');
      
      expect(error.message).toBe('API failed');
      expect(error.name).toBe('APIError');
      expect(error.statusCode).toBe(500);
    });

    it('should store original error', () => {
      const originalError = new Error('Original');
      originalError.code = 'ECONNREFUSED';
      
      const error = new APIError('API failed', 503, originalError);
      expect(error.originalError).toBe(originalError);
    });

    it('should include original error in JSON', () => {
      const originalError = new Error('Original');
      originalError.code = 'ECONNREFUSED';
      
      const error = new APIError('API failed', 503, originalError);
      const json = error.toJSON();
      
      expect(json.originalError).toBeDefined();
      expect(json.originalError.message).toBe('Original');
      expect(json.originalError.code).toBe('ECONNREFUSED');
    });
  });

  describe('NotionAPIError', () => {
    it('should create Notion API error', () => {
      const error = new NotionAPIError('Notion API failed');
      
      expect(error.message).toBe('Notion API failed');
      expect(error.name).toBe('NotionAPIError');
    });

    it('should create from Notion error object', () => {
      const notionError = {
        status: 404,
        message: 'Page not found',
        code: 'object_not_found',
      };
      
      const error = NotionAPIError.fromNotionError(notionError);
      
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Page not found');
      expect(error.notionError).toEqual(notionError);
    });

    it('should handle missing status in Notion error', () => {
      const notionError = { message: 'Error' };
      const error = NotionAPIError.fromNotionError(notionError);
      
      expect(error.statusCode).toBe(500);
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error', () => {
      const error = new NotFoundError('Task', '123');
      
      expect(error.message).toBe('Task not found: 123');
      expect(error.name).toBe('NotFoundError');
      expect(error.statusCode).toBe(404);
      expect(error.resource).toBe('Task');
      expect(error.identifier).toBe('123');
    });

    it('should include resource info in JSON', () => {
      const error = new NotFoundError('Task', '123');
      const json = error.toJSON();
      
      expect(json.resource).toBe('Task');
      expect(json.identifier).toBe('123');
    });
  });
});

describe('ErrorHandler', () => {
  let errorHandler;
  let logger;
  let loggerErrorSpy;
  let processExitSpy;

  beforeEach(() => {
    logger = new Logger({ enableTimestamp: false });
    loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation();
    errorHandler = new ErrorHandler(logger);
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('isOperationalError', () => {
    it('should identify operational errors', () => {
      const error = new AppError('Test');
      expect(errorHandler.isOperationalError(error)).toBe(true);
    });

    it('should identify non-operational errors', () => {
      const error = new AppError('Test', 500, false);
      expect(errorHandler.isOperationalError(error)).toBe(false);
    });

    it('should identify regular errors as non-operational', () => {
      const error = new Error('Test');
      expect(errorHandler.isOperationalError(error)).toBe(false);
    });
  });

  describe('handle', () => {
    it('should log operational errors', () => {
      const error = new ValidationError('Invalid input');
      errorHandler.handle(error);
      
      expect(loggerErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should log and exit on non-operational errors', () => {
      const error = new Error('Unexpected error');
      errorHandler.handle(error);
      
      expect(loggerErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should exit on operational errors when exit flag is true', () => {
      const error = new ValidationError('Invalid input');
      errorHandler.handle(error, true);
      
      expect(loggerErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('handleRejection', () => {
    it('should log rejection and throw', () => {
      const reason = new Error('Rejection reason');
      
      expect(() => errorHandler.handleRejection(reason)).toThrow(reason);
      expect(loggerErrorSpy).toHaveBeenCalled();
    });
  });

  describe('handleException', () => {
    it('should log exception and exit', () => {
      const error = new Error('Uncaught exception');
      errorHandler.handleException(error);
      
      expect(loggerErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });
});
