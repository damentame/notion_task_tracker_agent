/**
 * Task Manager Module
 * 
 * Business logic layer for task management operations.
 * Provides high-level interface for creating, updating, querying, and deleting tasks.
 * 
 * @module core/task-manager
 */

import notionClient from './notion-client.js';
import Validator from './validator.js';
import config from './config.js';
import logger from './logger.js';
import { NotFoundError, ValidationError } from './errors.js';

class TaskManager {
  constructor() {
    this.notionClient = notionClient;
    this.config = config;
    this.logger = logger.child('TaskManager');
    this.databaseId = null;
  }

  /**
   * Initialize the task manager
   */
  initialize() {
    this.databaseId = this.config.get('notion.databaseId');
    this.notionClient.initialize();
    this.logger.debug('Task manager initialized');
  }

  /**
   * Ensure task manager is initialized
   */
  ensureInitialized() {
    if (!this.databaseId) {
      this.initialize();
    }
  }

  /**
   * Build Notion properties from task data
   * 
   * @param {Object} taskData - Task data
   * @returns {Object} Notion properties object
   */
  buildTaskProperties(taskData) {
    const properties = {
      Task: {
        title: [
          {
            text: { content: taskData.title },
          },
        ],
      },
      Status: {
        status: { name: taskData.status || 'To-do' },
      },
    };

    if (taskData.notes !== undefined) {
      properties.Notes = {
        rich_text: [
          {
            text: { content: taskData.notes || '' },
          },
        ],
      };
    }

    if (taskData.assignedTo !== undefined) {
      properties['Assigned To'] = {
        people: [],
      };
    }

    return properties;
  }

  /**
   * Parse task from Notion page
   * 
   * @param {Object} page - Notion page object
   * @returns {Object} Parsed task data
   */
  parseTask(page) {
    const properties = page.properties;

    const task = {
      id: page.id,
      title: this.extractTitle(properties.Task),
      status: this.extractStatus(properties.Status),
      notes: this.extractRichText(properties.Notes),
      assignedTo: this.extractPeople(properties['Assigned To']),
      createdTime: page.created_time,
      lastEditedTime: page.last_edited_time,
      url: page.url,
    };

    return task;
  }

  /**
   * Extract title from Notion title property
   * 
   * @param {Object} titleProperty - Notion title property
   * @returns {string} Title text
   */
  extractTitle(titleProperty) {
    if (!titleProperty || !titleProperty.title || titleProperty.title.length === 0) {
      return '';
    }
    return titleProperty.title.map(item => item.plain_text).join('');
  }

  /**
   * Extract status from Notion status property
   * 
   * @param {Object} statusProperty - Notion status property
   * @returns {string} Status value
   */
  extractStatus(statusProperty) {
    if (!statusProperty || !statusProperty.status) {
      return '';
    }
    return statusProperty.status.name;
  }

  /**
   * Extract rich text from Notion rich text property
   * 
   * @param {Object} richTextProperty - Notion rich text property
   * @returns {string} Plain text
   */
  extractRichText(richTextProperty) {
    if (!richTextProperty || !richTextProperty.rich_text || richTextProperty.rich_text.length === 0) {
      return '';
    }
    return richTextProperty.rich_text.map(item => item.plain_text).join('');
  }

  /**
   * Extract people from Notion people property
   * 
   * @param {Object} peopleProperty - Notion people property
   * @returns {Array} Array of people
   */
  extractPeople(peopleProperty) {
    if (!peopleProperty || !peopleProperty.people || peopleProperty.people.length === 0) {
      return [];
    }
    return peopleProperty.people.map(person => ({
      id: person.id,
      name: person.name,
    }));
  }

  /**
   * Create a new task
   * 
   * @param {Object} taskData - Task data (title, notes, assignedTo)
   * @returns {Promise<Object>} Created task
   * @throws {ValidationError} If task data is invalid
   * @throws {NotionAPIError} If API call fails
   */
  async createTask(taskData) {
    this.ensureInitialized();

    const validated = Validator.validateTaskData(taskData);
    this.logger.info('Creating task', { title: validated.title });

    const properties = this.buildTaskProperties(validated);
    const page = await this.notionClient.createPage(this.databaseId, properties);

    const task = this.parseTask(page);
    this.logger.info('Task created', { id: task.id, title: task.title });

    return task;
  }

  /**
   * Update a task
   * 
   * @param {string} taskId - Task ID (page ID)
   * @param {Object} updates - Properties to update
   * @returns {Promise<Object>} Updated task
   * @throws {ValidationError} If update data is invalid
   * @throws {NotionAPIError} If API call fails
   */
  async updateTask(taskId, updates) {
    this.ensureInitialized();

    Validator.validateNotionPageId(taskId);
    this.logger.info('Updating task', { id: taskId });

    const properties = {};

    if (updates.title !== undefined) {
      Validator.requireString(updates.title, 'title');
      properties.Task = {
        title: [{ text: { content: updates.title } }],
      };
    }

    if (updates.status !== undefined) {
      const validStatus = Validator.validateTaskStatus(updates.status);
      properties.Status = {
        status: { name: validStatus },
      };
    }

    if (updates.notes !== undefined) {
      const notes = Validator.optionalString(updates.notes, 'notes');
      properties.Notes = {
        rich_text: [{ text: { content: notes } }],
      };
    }

    if (Object.keys(properties).length === 0) {
      throw new ValidationError('No valid properties to update');
    }

    const page = await this.notionClient.updatePage(taskId, properties);
    const task = this.parseTask(page);

    this.logger.info('Task updated', { id: task.id });
    return task;
  }

  /**
   * Get a task by ID
   * 
   * @param {string} taskId - Task ID (page ID)
   * @returns {Promise<Object>} Task data
   * @throws {ValidationError} If task ID is invalid
   * @throws {NotFoundError} If task not found
   * @throws {NotionAPIError} If API call fails
   */
  async getTask(taskId) {
    this.ensureInitialized();

    Validator.validateNotionPageId(taskId);
    this.logger.debug('Retrieving task', { id: taskId });

    try {
      const page = await this.notionClient.retrievePage(taskId);
      const task = this.parseTask(page);

      this.logger.debug('Task retrieved', { id: task.id });
      return task;
    } catch (error) {
      if (error.statusCode === 404) {
        throw new NotFoundError('Task', taskId);
      }
      throw error;
    }
  }

  /**
   * List tasks with optional filters
   * 
   * @param {Object} options - Query options
   * @param {string} options.status - Filter by status
   * @param {number} options.limit - Maximum number of tasks to return
   * @returns {Promise<Array>} Array of tasks
   * @throws {NotionAPIError} If API call fails
   */
  async listTasks(options = {}) {
    this.ensureInitialized();

    this.logger.debug('Listing tasks', options);

    const queryOptions = {};

    if (options.status) {
      Validator.validateTaskStatus(options.status);
      queryOptions.filter = {
        property: 'Status',
        status: {
          equals: options.status,
        },
      };
    }

    if (options.limit) {
      queryOptions.page_size = Math.min(options.limit, 100);
    }

    const response = await this.notionClient.queryDatabase(this.databaseId, queryOptions);
    const tasks = response.results.map(page => this.parseTask(page));

    this.logger.debug(`Retrieved ${tasks.length} tasks`);
    return tasks;
  }

  /**
   * Delete (archive) a task
   * 
   * @param {string} taskId - Task ID (page ID)
   * @returns {Promise<void>}
   * @throws {ValidationError} If task ID is invalid
   * @throws {NotFoundError} If task not found
   * @throws {NotionAPIError} If API call fails
   */
  async deleteTask(taskId) {
    this.ensureInitialized();

    Validator.validateNotionPageId(taskId);
    this.logger.info('Deleting task', { id: taskId });

    try {
      await this.notionClient.archivePage(taskId);
      this.logger.info('Task deleted', { id: taskId });
    } catch (error) {
      if (error.statusCode === 404) {
        throw new NotFoundError('Task', taskId);
      }
      throw error;
    }
  }

  /**
   * Update task status
   * 
   * @param {string} taskId - Task ID (page ID)
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated task
   * @throws {ValidationError} If parameters are invalid
   * @throws {NotionAPIError} If API call fails
   */
  async updateTaskStatus(taskId, status) {
    return this.updateTask(taskId, { status });
  }
}

// Singleton instance
const taskManager = new TaskManager();

export default taskManager;
export { TaskManager };
