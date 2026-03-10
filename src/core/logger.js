/**
 * Logger Module
 * 
 * Provides structured logging with different log levels.
 * Supports console output with formatting and timestamps.
 * 
 * @module core/logger
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const LOG_COLORS = {
  error: '\x1b[31m',
  warn: '\x1b[33m',
  info: '\x1b[36m',
  debug: '\x1b[90m',
  reset: '\x1b[0m',
};

class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.prefix = options.prefix || '';
    this.enableColors = options.enableColors !== false;
    this.enableTimestamp = options.enableTimestamp !== false;
  }

  /**
   * Set the log level
   * 
   * @param {string} level - Log level (error, warn, info, debug)
   */
  setLevel(level) {
    if (!(level in LOG_LEVELS)) {
      throw new Error(`Invalid log level: ${level}`);
    }
    this.level = level;
  }

  /**
   * Check if a log level should be output
   * 
   * @param {string} level - Log level to check
   * @returns {boolean} True if should log
   */
  shouldLog(level) {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.level];
  }

  /**
   * Format a log message
   * 
   * @param {string} level - Log level
   * @param {string} message - Message to format
   * @param {Object} meta - Additional metadata
   * @returns {string} Formatted message
   */
  format(level, message, meta = {}) {
    const parts = [];

    if (this.enableTimestamp) {
      const timestamp = new Date().toISOString();
      parts.push(`[${timestamp}]`);
    }

    const levelStr = level.toUpperCase().padEnd(5);
    if (this.enableColors) {
      parts.push(`${LOG_COLORS[level]}${levelStr}${LOG_COLORS.reset}`);
    } else {
      parts.push(levelStr);
    }

    if (this.prefix) {
      parts.push(`[${this.prefix}]`);
    }

    parts.push(message);

    let formatted = parts.join(' ');

    if (Object.keys(meta).length > 0) {
      formatted += '\n' + JSON.stringify(meta, null, 2);
    }

    return formatted;
  }

  /**
   * Log at error level
   * 
   * @param {string} message - Message to log
   * @param {Object} meta - Additional metadata
   */
  error(message, meta = {}) {
    if (this.shouldLog('error')) {
      console.error(this.format('error', message, meta));
    }
  }

  /**
   * Log at warn level
   * 
   * @param {string} message - Message to log
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', message, meta));
    }
  }

  /**
   * Log at info level
   * 
   * @param {string} message - Message to log
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      console.log(this.format('info', message, meta));
    }
  }

  /**
   * Log at debug level
   * 
   * @param {string} message - Message to log
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      console.log(this.format('debug', message, meta));
    }
  }

  /**
   * Create a child logger with a prefix
   * 
   * @param {string} prefix - Prefix for child logger
   * @returns {Logger} New logger instance
   */
  child(prefix) {
    const childPrefix = this.prefix ? `${this.prefix}:${prefix}` : prefix;
    return new Logger({
      level: this.level,
      prefix: childPrefix,
      enableColors: this.enableColors,
      enableTimestamp: this.enableTimestamp,
    });
  }
}

// Default logger instance
const logger = new Logger();

export default logger;
export { Logger };
