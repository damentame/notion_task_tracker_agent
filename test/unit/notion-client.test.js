/**
 * Unit tests for Notion Client module
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NotionClient } from '../../src/core/notion-client.js';
import { NotionAPIError } from '../../src/core/errors.js';
import config from '../../src/core/config.js';

describe('NotionClient Module', () => {
  let notionClient;
  let mockClient;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NOTION_API_KEY = 'test-api-key';
    process.env.NOTION_DATABASE_ID = 'test-database-id';
    
    config.reset();
    notionClient = new NotionClient({ retryAttempts: 2, retryDelay: 100 });
    
    mockClient = {
      pages: {
        create: jest.fn(),
        update: jest.fn(),
        retrieve: jest.fn(),
      },
      databases: {
        query: jest.fn(),
        retrieve: jest.fn(),
      },
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    config.reset();
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize Notion client with config', () => {
      notionClient.initialize();
      expect(notionClient.client).toBeDefined();
    });

    it('should only initialize once', () => {
      notionClient.initialize();
      const client1 = notionClient.client;
      notionClient.initialize();
      const client2 = notionClient.client;
      expect(client1).toBe(client2);
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable error codes', () => {
      expect(notionClient.isRetryableError({ code: 'rate_limited' })).toBe(true);
      expect(notionClient.isRetryableError({ code: 'service_unavailable' })).toBe(true);
      expect(notionClient.isRetryableError({ code: 'internal_server_error' })).toBe(true);
      expect(notionClient.isRetryableError({ code: 'ECONNRESET' })).toBe(true);
    });

    it('should identify retryable status codes', () => {
      expect(notionClient.isRetryableError({ status: 500 })).toBe(true);
      expect(notionClient.isRetryableError({ status: 503 })).toBe(true);
    });

    it('should identify non-retryable errors', () => {
      expect(notionClient.isRetryableError({ code: 'unauthorized' })).toBe(false);
      expect(notionClient.isRetryableError({ status: 400 })).toBe(false);
    });
  });

  describe('executeWithRetry', () => {
    it('should execute successful API call', async () => {
      const mockCall = jest.fn().mockResolvedValue({ success: true });
      const result = await notionClient.executeWithRetry(mockCall, 'test');
      
      expect(result).toEqual({ success: true });
      expect(mockCall).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const mockCall = jest.fn()
        .mockRejectedValueOnce({ code: 'rate_limited', message: 'Rate limited' })
        .mockResolvedValueOnce({ success: true });
      
      const result = await notionClient.executeWithRetry(mockCall, 'test');
      
      expect(result).toEqual({ success: true });
      expect(mockCall).toHaveBeenCalledTimes(2);
    });

    it('should throw after all retries exhausted', async () => {
      const mockCall = jest.fn()
        .mockRejectedValue({ code: 'rate_limited', message: 'Rate limited' });
      
      await expect(notionClient.executeWithRetry(mockCall, 'test'))
        .rejects.toThrow(NotionAPIError);
      
      expect(mockCall).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const mockCall = jest.fn()
        .mockRejectedValue({ status: 400, message: 'Bad request' });
      
      await expect(notionClient.executeWithRetry(mockCall, 'test'))
        .rejects.toThrow(NotionAPIError);
      
      expect(mockCall).toHaveBeenCalledTimes(1);
    });
  });

  describe('createPage', () => {
    it('should create page in database', async () => {
      notionClient.client = mockClient;
      const properties = { title: [{ text: { content: 'Test' } }] };
      const expectedPage = { id: 'page-123', properties };
      
      mockClient.pages.create.mockResolvedValue(expectedPage);
      
      const result = await notionClient.createPage('db-123', properties);
      
      expect(result).toEqual(expectedPage);
      expect(mockClient.pages.create).toHaveBeenCalledWith({
        parent: { database_id: 'db-123' },
        properties,
      });
    });
  });

  describe('updatePage', () => {
    it('should update page properties', async () => {
      notionClient.client = mockClient;
      const properties = { status: { name: 'Done' } };
      const expectedPage = { id: 'page-123', properties };
      
      mockClient.pages.update.mockResolvedValue(expectedPage);
      
      const result = await notionClient.updatePage('page-123', properties);
      
      expect(result).toEqual(expectedPage);
      expect(mockClient.pages.update).toHaveBeenCalledWith({
        page_id: 'page-123',
        properties,
      });
    });
  });

  describe('retrievePage', () => {
    it('should retrieve page by ID', async () => {
      notionClient.client = mockClient;
      const expectedPage = { id: 'page-123' };
      
      mockClient.pages.retrieve.mockResolvedValue(expectedPage);
      
      const result = await notionClient.retrievePage('page-123');
      
      expect(result).toEqual(expectedPage);
      expect(mockClient.pages.retrieve).toHaveBeenCalledWith({
        page_id: 'page-123',
      });
    });
  });

  describe('queryDatabase', () => {
    it('should query database with options', async () => {
      notionClient.client = mockClient;
      const options = { filter: { property: 'Status' } };
      const expectedResults = { results: [] };
      
      mockClient.databases.query.mockResolvedValue(expectedResults);
      
      const result = await notionClient.queryDatabase('db-123', options);
      
      expect(result).toEqual(expectedResults);
      expect(mockClient.databases.query).toHaveBeenCalledWith({
        database_id: 'db-123',
        ...options,
      });
    });
  });

  describe('retrieveDatabase', () => {
    it('should retrieve database metadata', async () => {
      notionClient.client = mockClient;
      const expectedDb = { id: 'db-123' };
      
      mockClient.databases.retrieve.mockResolvedValue(expectedDb);
      
      const result = await notionClient.retrieveDatabase('db-123');
      
      expect(result).toEqual(expectedDb);
      expect(mockClient.databases.retrieve).toHaveBeenCalledWith({
        database_id: 'db-123',
      });
    });
  });

  describe('archivePage', () => {
    it('should archive page', async () => {
      notionClient.client = mockClient;
      const expectedPage = { id: 'page-123', archived: true };
      
      mockClient.pages.update.mockResolvedValue(expectedPage);
      
      const result = await notionClient.archivePage('page-123');
      
      expect(result).toEqual(expectedPage);
      expect(mockClient.pages.update).toHaveBeenCalledWith({
        page_id: 'page-123',
        archived: true,
      });
    });
  });

  describe('getClient', () => {
    it('should return underlying client', () => {
      notionClient.initialize();
      const client = notionClient.getClient();
      expect(client).toBe(notionClient.client);
    });

    it('should initialize if not already initialized', () => {
      const client = notionClient.getClient();
      expect(client).toBeDefined();
      expect(notionClient.client).toBeDefined();
    });
  });
});
