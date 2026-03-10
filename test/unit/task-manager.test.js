/**
 * Unit tests for Task Manager module
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TaskManager } from '../../src/core/task-manager.js';
import { ValidationError, NotFoundError } from '../../src/core/errors.js';
import config from '../../src/core/config.js';

describe('TaskManager Module', () => {
  let taskManager;
  let mockNotionClient;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NOTION_API_KEY = 'test-api-key';
    process.env.NOTION_DATABASE_ID = 'test-database-id';
    
    config.reset();
    taskManager = new TaskManager();
    
    mockNotionClient = {
      initialize: jest.fn(),
      createPage: jest.fn(),
      updatePage: jest.fn(),
      retrievePage: jest.fn(),
      queryDatabase: jest.fn(),
      archivePage: jest.fn(),
    };
    
    taskManager.notionClient = mockNotionClient;
  });

  afterEach(() => {
    process.env = originalEnv;
    config.reset();
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize task manager', () => {
      taskManager.initialize();
      expect(taskManager.databaseId).toBe('test-database-id');
      expect(mockNotionClient.initialize).toHaveBeenCalled();
    });
  });

  describe('extractTitle', () => {
    it('should extract title from property', () => {
      const property = {
        title: [
          { plain_text: 'Test ' },
          { plain_text: 'Task' },
        ],
      };
      expect(taskManager.extractTitle(property)).toBe('Test Task');
    });

    it('should return empty string for missing title', () => {
      expect(taskManager.extractTitle(null)).toBe('');
      expect(taskManager.extractTitle({})).toBe('');
      expect(taskManager.extractTitle({ title: [] })).toBe('');
    });
  });

  describe('extractStatus', () => {
    it('should extract status from property', () => {
      const property = {
        status: { name: 'Done' },
      };
      expect(taskManager.extractStatus(property)).toBe('Done');
    });

    it('should return empty string for missing status', () => {
      expect(taskManager.extractStatus(null)).toBe('');
      expect(taskManager.extractStatus({})).toBe('');
    });
  });

  describe('extractRichText', () => {
    it('should extract rich text from property', () => {
      const property = {
        rich_text: [
          { plain_text: 'Some ' },
          { plain_text: 'notes' },
        ],
      };
      expect(taskManager.extractRichText(property)).toBe('Some notes');
    });

    it('should return empty string for missing rich text', () => {
      expect(taskManager.extractRichText(null)).toBe('');
      expect(taskManager.extractRichText({})).toBe('');
      expect(taskManager.extractRichText({ rich_text: [] })).toBe('');
    });
  });

  describe('extractPeople', () => {
    it('should extract people from property', () => {
      const property = {
        people: [
          { id: '1', name: 'John' },
          { id: '2', name: 'Jane' },
        ],
      };
      const result = taskManager.extractPeople(property);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: '1', name: 'John' });
    });

    it('should return empty array for missing people', () => {
      expect(taskManager.extractPeople(null)).toEqual([]);
      expect(taskManager.extractPeople({})).toEqual([]);
      expect(taskManager.extractPeople({ people: [] })).toEqual([]);
    });
  });

  describe('buildTaskProperties', () => {
    it('should build properties from task data', () => {
      const taskData = {
        title: 'Test Task',
        status: 'Done',
        notes: 'Some notes',
        assignedTo: 'John',
      };
      
      const properties = taskManager.buildTaskProperties(taskData);
      
      expect(properties.Task.title[0].text.content).toBe('Test Task');
      expect(properties.Status.status.name).toBe('Done');
      expect(properties.Notes.rich_text[0].text.content).toBe('Some notes');
    });

    it('should use default status if not provided', () => {
      const taskData = { title: 'Test Task' };
      const properties = taskManager.buildTaskProperties(taskData);
      expect(properties.Status.status.name).toBe('To-do');
    });
  });

  describe('parseTask', () => {
    it('should parse Notion page to task object', () => {
      const page = {
        id: 'page-123',
        properties: {
          Task: {
            title: [{ plain_text: 'Test Task' }],
          },
          Status: {
            status: { name: 'Done' },
          },
          Notes: {
            rich_text: [{ plain_text: 'Notes' }],
          },
          'Assigned To': {
            people: [],
          },
        },
        created_time: '2024-01-01T00:00:00Z',
        last_edited_time: '2024-01-02T00:00:00Z',
        url: 'https://notion.so/page-123',
      };
      
      const task = taskManager.parseTask(page);
      
      expect(task.id).toBe('page-123');
      expect(task.title).toBe('Test Task');
      expect(task.status).toBe('Done');
      expect(task.notes).toBe('Notes');
      expect(task.url).toBe('https://notion.so/page-123');
    });
  });

  describe('createTask', () => {
    it('should create task with valid data', async () => {
      const taskData = {
        title: 'New Task',
        notes: 'Task notes',
      };
      
      const mockPage = {
        id: 'page-123',
        properties: {
          Task: { title: [{ plain_text: 'New Task' }] },
          Status: { status: { name: 'To-do' } },
          Notes: { rich_text: [{ plain_text: 'Task notes' }] },
          'Assigned To': { people: [] },
        },
        created_time: '2024-01-01T00:00:00Z',
        last_edited_time: '2024-01-01T00:00:00Z',
        url: 'https://notion.so/page-123',
      };
      
      mockNotionClient.createPage.mockResolvedValue(mockPage);
      
      const task = await taskManager.createTask(taskData);
      
      expect(task.id).toBe('page-123');
      expect(task.title).toBe('New Task');
      expect(mockNotionClient.createPage).toHaveBeenCalled();
    });

    it('should throw validation error for invalid data', async () => {
      await expect(taskManager.createTask({}))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('updateTask', () => {
    it('should update task with valid data', async () => {
      const mockPage = {
        id: 'page-123',
        properties: {
          Task: { title: [{ plain_text: 'Updated Task' }] },
          Status: { status: { name: 'Done' } },
          Notes: { rich_text: [] },
          'Assigned To': { people: [] },
        },
        created_time: '2024-01-01T00:00:00Z',
        last_edited_time: '2024-01-02T00:00:00Z',
        url: 'https://notion.so/page-123',
      };
      
      mockNotionClient.updatePage.mockResolvedValue(mockPage);
      
      const task = await taskManager.updateTask('12345678-1234-1234-1234-123456789abc', {
        title: 'Updated Task',
        status: 'Done',
      });
      
      expect(task.title).toBe('Updated Task');
      expect(task.status).toBe('Done');
      expect(mockNotionClient.updatePage).toHaveBeenCalled();
    });

    it('should throw validation error for invalid task ID', async () => {
      await expect(taskManager.updateTask('invalid-id', { status: 'Done' }))
        .rejects.toThrow(ValidationError);
    });

    it('should throw validation error for invalid status', async () => {
      await expect(taskManager.updateTask('12345678-1234-1234-1234-123456789abc', { status: 'Invalid' }))
        .rejects.toThrow(ValidationError);
    });

    it('should throw error when no properties to update', async () => {
      await expect(taskManager.updateTask('12345678-1234-1234-1234-123456789abc', {}))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('getTask', () => {
    it('should retrieve task by ID', async () => {
      const mockPage = {
        id: 'page-123',
        properties: {
          Task: { title: [{ plain_text: 'Test Task' }] },
          Status: { status: { name: 'To-do' } },
          Notes: { rich_text: [] },
          'Assigned To': { people: [] },
        },
        created_time: '2024-01-01T00:00:00Z',
        last_edited_time: '2024-01-01T00:00:00Z',
        url: 'https://notion.so/page-123',
      };
      
      mockNotionClient.retrievePage.mockResolvedValue(mockPage);
      
      const task = await taskManager.getTask('12345678-1234-1234-1234-123456789abc');
      
      expect(task.title).toBe('Test Task');
      expect(mockNotionClient.retrievePage).toHaveBeenCalled();
    });

    it('should throw NotFoundError for 404 response', async () => {
      const error = new Error('Not found');
      error.statusCode = 404;
      mockNotionClient.retrievePage.mockRejectedValue(error);
      
      await expect(taskManager.getTask('12345678-1234-1234-1234-123456789abc'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('listTasks', () => {
    it('should list all tasks', async () => {
      const mockResponse = {
        results: [
          {
            id: 'page-1',
            properties: {
              Task: { title: [{ plain_text: 'Task 1' }] },
              Status: { status: { name: 'To-do' } },
              Notes: { rich_text: [] },
              'Assigned To': { people: [] },
            },
            created_time: '2024-01-01T00:00:00Z',
            last_edited_time: '2024-01-01T00:00:00Z',
            url: 'https://notion.so/page-1',
          },
        ],
      };
      
      mockNotionClient.queryDatabase.mockResolvedValue(mockResponse);
      
      const tasks = await taskManager.listTasks();
      
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Task 1');
      expect(mockNotionClient.queryDatabase).toHaveBeenCalled();
    });

    it('should filter tasks by status', async () => {
      mockNotionClient.queryDatabase.mockResolvedValue({ results: [] });
      
      await taskManager.listTasks({ status: 'Done' });
      
      expect(mockNotionClient.queryDatabase).toHaveBeenCalledWith(
        'test-database-id',
        expect.objectContaining({
          filter: {
            property: 'Status',
            status: { equals: 'Done' },
          },
        })
      );
    });

    it('should limit number of results', async () => {
      mockNotionClient.queryDatabase.mockResolvedValue({ results: [] });
      
      await taskManager.listTasks({ limit: 10 });
      
      expect(mockNotionClient.queryDatabase).toHaveBeenCalledWith(
        'test-database-id',
        expect.objectContaining({ page_size: 10 })
      );
    });
  });

  describe('deleteTask', () => {
    it('should archive task', async () => {
      mockNotionClient.archivePage.mockResolvedValue({});
      
      await taskManager.deleteTask('12345678-1234-1234-1234-123456789abc');
      
      expect(mockNotionClient.archivePage).toHaveBeenCalledWith('12345678-1234-1234-1234-123456789abc');
    });

    it('should throw NotFoundError for 404 response', async () => {
      const error = new Error('Not found');
      error.statusCode = 404;
      mockNotionClient.archivePage.mockRejectedValue(error);
      
      await expect(taskManager.deleteTask('12345678-1234-1234-1234-123456789abc'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status', async () => {
      const mockPage = {
        id: 'page-123',
        properties: {
          Task: { title: [{ plain_text: 'Test Task' }] },
          Status: { status: { name: 'Done' } },
          Notes: { rich_text: [] },
          'Assigned To': { people: [] },
        },
        created_time: '2024-01-01T00:00:00Z',
        last_edited_time: '2024-01-02T00:00:00Z',
        url: 'https://notion.so/page-123',
      };
      
      mockNotionClient.updatePage.mockResolvedValue(mockPage);
      
      const task = await taskManager.updateTaskStatus('12345678-1234-1234-1234-123456789abc', 'Done');
      
      expect(task.status).toBe('Done');
    });
  });
});
