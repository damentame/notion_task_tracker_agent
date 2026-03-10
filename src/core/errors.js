/**
 * Error Handler Module
 * 
 * Provides custom error classes and centralized error handling.
 * Implements a hierarchy of error types for different failure scenarios.
 * 
 * @module core/errors
 */

/**
 * Base application error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
    };
  }
}

/**
 * Configuration error - thrown when configuration is invalid or missing
 */
class ConfigError extends AppError {
  constructor(message) {
    super(message, 500, true);
  }
}

/**
 * Validation error - thrown when input validation fails
 */
class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, true);
    this.details = details;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      details: this.details,
    };
  }
}

/**
 * API error - thrown when external API calls fail
 */
class APIError extends AppError {
  constructor(message, statusCode = 500, originalError = null) {
    super(message, statusCode, true);
    this.originalError = originalError;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      originalError: this.originalError ? {
        message: this.originalError.message,
        code: this.originalError.code,
      } : null,
    };
  }
}

/**
 * Notion API specific error
 */
class NotionAPIError extends APIError {
  constructor(message, statusCode = 500, notionError = null) {
    super(message, statusCode, notionError);
    this.notionError = notionError;
  }

  static fromNotionError(error) {
    const statusCode = error.status || 500;
    const message = error.message || 'Notion API error';
    return new NotionAPIError(message, statusCode, error);
  }
}

/**
 * Not found error - thrown when a resource is not found
 */
class NotFoundError extends AppError {
  constructor(resource, identifier) {
    super(`${resource} not found: ${identifier}`, 404, true);
    this.resource = resource;
    this.identifier = identifier;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      resource: this.resource,
      identifier: this.identifier,
    };
  }
}

/**
 * Error handler class for centralized error processing
 */
class ErrorHandler {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Handle an error
   * 
   * @param {Error} error - Error to handle
   * @param {boolean} exit - Whether to exit process on error
   */
  handle(error, exit = false) {
    if (this.isOperationalError(error)) {
      this.logger.error(error.message, {
        name: error.name,
        statusCode: error.statusCode,
        stack: error.stack,
      });
    } else {
      this.logger.error('Unexpected error occurred', {
        message: error.message,
        stack: error.stack,
      });
    }

    if (exit || !this.isOperationalError(error)) {
      process.exit(1);
    }
  }

  /**
   * Check if error is operational (expected) or programming error
   * 
   * @param {Error} error - Error to check
   * @returns {boolean} True if operational error
   */
  isOperationalError(error) {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * Handle promise rejection
   * 
   * @param {Error} reason - Rejection reason
   */
  handleRejection(reason) {
    this.logger.error('Unhandled Promise Rejection', {
      reason: reason.message || reason,
      stack: reason.stack,
    });
    throw reason;
  }

  /**
   * Handle uncaught exception
   * 
   * @param {Error} error - Uncaught exception
   */
  handleException(error) {
    this.logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }

  /**
   * Register global error handlers
   */
  registerGlobalHandlers() {
    process.on('unhandledRejection', (reason) => {
      this.handleRejection(reason);
    });

    process.on('uncaughtException', (error) => {
      this.handleException(error);
    });
  }
}

export {
  AppError,
  ConfigError,
  ValidationError,
  APIError,
  NotionAPIError,
  NotFoundError,
  ErrorHandler,
};

export default ErrorHandler;
