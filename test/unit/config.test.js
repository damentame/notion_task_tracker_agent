/**
 * Unit tests for Config module
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import config from '../../src/core/config.js';

describe('Config Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    config.reset();
  });

  afterEach(() => {
    process.env = originalEnv;
    config.reset();
  });

  describe('load', () => {
    it('should load configuration from environment variables', () => {
      process.env.NOTION_API_KEY = 'test-api-key';
      process.env.NOTION_DATABASE_ID = 'test-database-id';

      const cfg = config.load();

      expect(cfg.notion.apiKey).toBe('test-api-key');
      expect(cfg.notion.databaseId).toBe('test-database-id');
    });

    it('should use default values for optional configuration', () => {
      process.env.NOTION_API_KEY = 'test-api-key';
      process.env.NOTION_DATABASE_ID = 'test-database-id';
      delete process.env.NODE_ENV;

      const cfg = config.load();

      expect(cfg.notion.version).toBe('2022-06-28');
      expect(cfg.app.logLevel).toBe('info');
      expect(cfg.app.environment).toBe('development');
    });

    it('should throw error if required configuration is missing', () => {
      delete process.env.NOTION_API_KEY;
      delete process.env.NOTION_DATABASE_ID;

      expect(() => config.load()).toThrow('Missing required configuration');
    });

    it('should throw error if NOTION_API_KEY is missing', () => {
      delete process.env.NOTION_API_KEY;
      process.env.NOTION_DATABASE_ID = 'test-database-id';

      expect(() => config.load()).toThrow('NOTION_API_KEY');
    });

    it('should throw error if NOTION_DATABASE_ID is missing', () => {
      process.env.NOTION_API_KEY = 'test-api-key';
      delete process.env.NOTION_DATABASE_ID;

      expect(() => config.load()).toThrow('NOTION_DATABASE_ID');
    });

    it('should only load once (singleton behavior)', () => {
      process.env.NOTION_API_KEY = 'test-api-key';
      process.env.NOTION_DATABASE_ID = 'test-database-id';

      const cfg1 = config.load();
      process.env.NOTION_API_KEY = 'changed-api-key';
      const cfg2 = config.load();

      expect(cfg1.notion.apiKey).toBe(cfg2.notion.apiKey);
      expect(cfg2.notion.apiKey).toBe('test-api-key');
    });
  });

  describe('get', () => {
    beforeEach(() => {
      process.env.NOTION_API_KEY = 'test-api-key';
      process.env.NOTION_DATABASE_ID = 'test-database-id';
    });

    it('should get configuration value by path', () => {
      expect(config.get('notion.apiKey')).toBe('test-api-key');
      expect(config.get('notion.databaseId')).toBe('test-database-id');
    });

    it('should return default value for non-existent path', () => {
      expect(config.get('non.existent.path', 'default')).toBe('default');
    });

    it('should return undefined for non-existent path without default', () => {
      expect(config.get('non.existent.path')).toBeUndefined();
    });

    it('should handle nested paths', () => {
      expect(config.get('app.logLevel')).toBe('info');
      const env = config.get('app.environment');
      expect(['development', 'test']).toContain(env);
    });

    it('should auto-load if not loaded', () => {
      config.reset();
      const value = config.get('notion.apiKey');
      expect(value).toBe('test-api-key');
    });
  });

  describe('set', () => {
    beforeEach(() => {
      process.env.NOTION_API_KEY = 'test-api-key';
      process.env.NOTION_DATABASE_ID = 'test-database-id';
      config.load();
    });

    it('should set configuration value', () => {
      config.set('notion.apiKey', 'new-key');
      expect(config.get('notion.apiKey')).toBe('new-key');
    });

    it('should create nested paths', () => {
      config.set('new.nested.value', 'test');
      expect(config.get('new.nested.value')).toBe('test');
    });
  });

  describe('getAll', () => {
    beforeEach(() => {
      process.env.NOTION_API_KEY = 'test-api-key';
      process.env.NOTION_DATABASE_ID = 'test-database-id';
    });

    it('should return complete configuration object', () => {
      const cfg = config.getAll();
      expect(cfg).toHaveProperty('notion');
      expect(cfg).toHaveProperty('app');
      expect(cfg.notion).toHaveProperty('apiKey');
      expect(cfg.notion).toHaveProperty('databaseId');
    });

    it('should return a copy of configuration', () => {
      const cfg = config.getAll();
      cfg.notion.apiKey = 'modified';
      expect(config.get('notion.apiKey')).toBe('test-api-key');
    });
  });

  describe('reset', () => {
    it('should reset configuration state', () => {
      process.env.NOTION_API_KEY = 'test-api-key';
      process.env.NOTION_DATABASE_ID = 'test-database-id';
      
      config.load();
      config.reset();
      
      expect(config.loaded).toBe(false);
      expect(Object.keys(config.config).length).toBe(0);
    });
  });
});
