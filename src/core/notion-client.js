/**
 * Notion Client Module
 * 
 * Wrapper around the Notion API with error handling, retry logic,
 * and simplified interface for task management operations.
 * 
 * @module core/notion-client
 */

import { Client } from '@notionhq/client';
import { NotionAPIError } from './errors.js';
import config from './config.js';
import logger from './logger.js';

class NotionClient {
  constructor(options = {}) {
    this.config = config;
    this.logger = logger.child('NotionClient');
    this.client = null;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  /**
   * Initialize the Notion client
   * 
   * @throws {ConfigError} If configuration is invalid
   */
  initialize() {
    if (this.client) {
      return;
    }

    const apiKey = this.config.get('notion.apiKey');
    const version = this.config.get('notion.version');

    this.client = new Client({
      auth: apiKey,
      notionVersion: version,
    });

    this.logger.debug('Notion client initialized');
  }

  /**
   * Ensure client is initialized
   */
  ensureInitialized() {
    if (!this.client) {
      this.initialize();
    }
  }

  /**
   * Execute an API call with retry logic
   * 
   * @param {Function} apiCall - Function that makes the API call
   * @param {string} operation - Name of operation for logging
   * @returns {Promise<*>} API response
   * @throws {NotionAPIError} If all retry attempts fail
   */
  async executeWithRetry(apiCall, operation) {
    let lastError;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        this.logger.debug(`Executing ${operation} (attempt ${attempt}/${this.retryAttempts})`);
        const result = await apiCall();
        this.logger.debug(`${operation} succeeded`);
        return result;
      } catch (error) {
        lastError = error;
        this.logger.warn(`${operation} failed (attempt ${attempt}/${this.retryAttempts})`, {
          error: error.message,
          code: error.code,
        });

        if (attempt < this.retryAttempts && this.isRetryableError(error)) {
          const delay = this.retryDelay * attempt;
          this.logger.debug(`Retrying after ${delay}ms`);
          await this.sleep(delay);
        } else {
          break;
        }
      }
    }

    throw NotionAPIError.fromNotionError(lastError);
  }

  /**
   * Check if an error is retryable
   * 
   * @param {Error} error - Error to check
   * @returns {boolean} True if error is retryable
   */
  isRetryableError(error) {
    const retryableCodes = [
      'rate_limited',
      'service_unavailable',
      'internal_server_error',
      'ECONNRESET',
      'ETIMEDOUT',
    ];

    if (retryableCodes.includes(error.code)) {
      return true;
    }
    
    if (error.status && error.status >= 500) {
      return true;
    }
    
    return false;
  }

  /**
   * Sleep for specified milliseconds
   * 
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a page in a database
   * 
   * @param {string} databaseId - Database ID
   * @param {Object} properties - Page properties
   * @returns {Promise<Object>} Created page
   * @throws {NotionAPIError} If API call fails
   */
  async createPage(databaseId, properties) {
    this.ensureInitialized();

    return this.executeWithRetry(
      async () => {
        return await this.client.pages.create({
          parent: { database_id: databaseId },
          properties,
        });
      },
      'createPage'
    );
  }

  /**
   * Update a page
   * 
   * @param {string} pageId - Page ID
   * @param {Object} properties - Properties to update
   * @returns {Promise<Object>} Updated page
   * @throws {NotionAPIError} If API call fails
   */
  async updatePage(pageId, properties) {
    this.ensureInitialized();

    return this.executeWithRetry(
      async () => {
        return await this.client.pages.update({
          page_id: pageId,
          properties,
        });
      },
      'updatePage'
    );
  }

  /**
   * Retrieve a page
   * 
   * @param {string} pageId - Page ID
   * @returns {Promise<Object>} Page data
   * @throws {NotionAPIError} If API call fails
   */
  async retrievePage(pageId) {
    this.ensureInitialized();

    return this.executeWithRetry(
      async () => {
        return await this.client.pages.retrieve({
          page_id: pageId,
        });
      },
      'retrievePage'
    );
  }

  /**
   * Query a database
   * 
   * @param {string} databaseId - Database ID
   * @param {Object} options - Query options (filter, sorts, etc.)
   * @returns {Promise<Object>} Query results
   * @throws {NotionAPIError} If API call fails
   */
  async queryDatabase(databaseId, options = {}) {
    this.ensureInitialized();

    return this.executeWithRetry(
      async () => {
        return await this.client.databases.query({
          database_id: databaseId,
          ...options,
        });
      },
      'queryDatabase'
    );
  }

  /**
   * Retrieve database metadata
   * 
   * @param {string} databaseId - Database ID
   * @returns {Promise<Object>} Database metadata
   * @throws {NotionAPIError} If API call fails
   */
  async retrieveDatabase(databaseId) {
    this.ensureInitialized();

    return this.executeWithRetry(
      async () => {
        return await this.client.databases.retrieve({
          database_id: databaseId,
        });
      },
      'retrieveDatabase'
    );
  }

  /**
   * Archive (delete) a page
   * 
   * @param {string} pageId - Page ID
   * @returns {Promise<Object>} Archived page
   * @throws {NotionAPIError} If API call fails
   */
  async archivePage(pageId) {
    this.ensureInitialized();

    return this.executeWithRetry(
      async () => {
        return await this.client.pages.update({
          page_id: pageId,
          archived: true,
        });
      },
      'archivePage'
    );
  }

  /**
   * Get the underlying Notion client (for advanced usage)
   * 
   * @returns {Client} Notion client instance
   */
  getClient() {
    this.ensureInitialized();
    return this.client;
  }
}

// Singleton instance
const notionClient = new NotionClient();

export default notionClient;
export { NotionClient };
