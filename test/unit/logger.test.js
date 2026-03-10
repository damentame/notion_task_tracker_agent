/**
 * Unit tests for Logger module
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Logger } from '../../src/core/logger.js';

describe('Logger Module', () => {
  let logger;
  let consoleSpy;

  beforeEach(() => {
    logger = new Logger({ enableTimestamp: false });
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
    };
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
  });

  describe('log levels', () => {
    it('should log error messages at error level', () => {
      logger.setLevel('error');
      
      logger.error('Error message');
      logger.warn('Warn message');
      logger.info('Info message');
      logger.debug('Debug message');

      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
      expect(consoleSpy.warn).toHaveBeenCalledTimes(0);
      expect(consoleSpy.log).toHaveBeenCalledTimes(0);
    });

    it('should log error and warn at warn level', () => {
      logger.setLevel('warn');
      
      logger.error('Error message');
      logger.warn('Warn message');
      logger.info('Info message');
      logger.debug('Debug message');

      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
      expect(consoleSpy.log).toHaveBeenCalledTimes(0);
    });

    it('should log error, warn, and info at info level', () => {
      logger.setLevel('info');
      
      logger.error('Error message');
      logger.warn('Warn message');
      logger.info('Info message');
      logger.debug('Debug message');

      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
    });

    it('should log all messages at debug level', () => {
      logger.setLevel('debug');
      
      logger.error('Error message');
      logger.warn('Warn message');
      logger.info('Info message');
      logger.debug('Debug message');

      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
      expect(consoleSpy.log).toHaveBeenCalledTimes(2);
    });

    it('should throw error for invalid log level', () => {
      expect(() => logger.setLevel('invalid')).toThrow('Invalid log level');
    });
  });

  describe('formatting', () => {
    it('should format messages with level', () => {
      logger.setLevel('info');
      logger.info('Test message');

      expect(consoleSpy.log).toHaveBeenCalled();
      const call = consoleSpy.log.mock.calls[0][0];
      expect(call).toContain('INFO');
      expect(call).toContain('Test message');
    });

    it('should include metadata in formatted output', () => {
      logger.setLevel('info');
      logger.info('Test message', { key: 'value' });

      expect(consoleSpy.log).toHaveBeenCalled();
      const call = consoleSpy.log.mock.calls[0][0];
      expect(call).toContain('Test message');
      expect(call).toContain('key');
      expect(call).toContain('value');
    });

    it('should include prefix when set', () => {
      const prefixedLogger = new Logger({ 
        prefix: 'TEST',
        enableTimestamp: false,
      });
      prefixedLogger.setLevel('info');
      prefixedLogger.info('Message');

      expect(consoleSpy.log).toHaveBeenCalled();
      const call = consoleSpy.log.mock.calls[0][0];
      expect(call).toContain('[TEST]');
    });

    it('should disable colors when enableColors is false', () => {
      const noColorLogger = new Logger({ 
        enableColors: false,
        enableTimestamp: false,
      });
      noColorLogger.setLevel('info');
      noColorLogger.info('Message');

      expect(consoleSpy.log).toHaveBeenCalled();
      const call = consoleSpy.log.mock.calls[0][0];
      expect(call).not.toContain('\x1b[');
    });
  });

  describe('child logger', () => {
    it('should create child logger with prefix', () => {
      logger.setLevel('info');
      const child = logger.child('CHILD');
      child.info('Message');

      expect(consoleSpy.log).toHaveBeenCalled();
      const call = consoleSpy.log.mock.calls[0][0];
      expect(call).toContain('[CHILD]');
    });

    it('should chain prefixes for nested children', () => {
      const parent = new Logger({ 
        prefix: 'PARENT',
        enableTimestamp: false,
      });
      parent.setLevel('info');
      
      const child = parent.child('CHILD');
      child.info('Message');

      expect(consoleSpy.log).toHaveBeenCalled();
      const call = consoleSpy.log.mock.calls[0][0];
      expect(call).toContain('[PARENT:CHILD]');
    });

    it('should inherit log level from parent', () => {
      logger.setLevel('error');
      const child = logger.child('CHILD');
      
      child.error('Error');
      child.info('Info');

      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
      expect(consoleSpy.log).toHaveBeenCalledTimes(0);
    });
  });

  describe('shouldLog', () => {
    it('should return true for appropriate log levels', () => {
      logger.setLevel('info');
      
      expect(logger.shouldLog('error')).toBe(true);
      expect(logger.shouldLog('warn')).toBe(true);
      expect(logger.shouldLog('info')).toBe(true);
      expect(logger.shouldLog('debug')).toBe(false);
    });
  });
});
