/**
 * Configuration Module
 * 
 * Manages application configuration including environment variables,
 * API keys, and database IDs. Provides validation and defaults.
 * 
 * @module core/config
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Config {
  constructor() {
    this.loaded = false;
    this.config = {};
  }

  /**
   * Load configuration from environment variables
   * Looks for .env file in project root
   * 
   * @throws {Error} If required configuration is missing
   * @returns {Object} Configuration object
   */
  load() {
    if (this.loaded) {
      return this.config;
    }

    const envPath = join(__dirname, '..', '..', '.env');
    if (existsSync(envPath)) {
      dotenv.config({ path: envPath });
    } else {
      dotenv.config();
    }

    this.config = {
      notion: {
        apiKey: process.env.NOTION_API_KEY,
        databaseId: process.env.NOTION_DATABASE_ID,
        version: process.env.NOTION_API_VERSION || '2022-06-28',
      },
      app: {
        logLevel: process.env.LOG_LEVEL || 'info',
        environment: process.env.NODE_ENV || 'development',
      },
    };

    this.validate();
    this.loaded = true;
    return this.config;
  }

  /**
   * Validate required configuration values
   * 
   * @throws {Error} If required configuration is missing
   */
  validate() {
    const required = [
      { key: 'notion.apiKey', value: this.config.notion.apiKey, name: 'NOTION_API_KEY' },
      { key: 'notion.databaseId', value: this.config.notion.databaseId, name: 'NOTION_DATABASE_ID' },
    ];

    const missing = required.filter(item => !item.value);

    if (missing.length > 0) {
      const missingNames = missing.map(item => item.name).join(', ');
      throw new Error(
        `Missing required configuration: ${missingNames}. ` +
        'Please set these environment variables in your .env file.'
      );
    }
  }

  /**
   * Get a configuration value by path
   * 
   * @param {string} path - Dot-notation path (e.g., 'notion.apiKey')
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Configuration value
   */
  get(path, defaultValue = undefined) {
    if (!this.loaded) {
      this.load();
    }

    const keys = path.split('.');
    let value = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  /**
   * Set a configuration value (for testing purposes)
   * 
   * @param {string} path - Dot-notation path
   * @param {*} value - Value to set
   */
  set(path, value) {
    const keys = path.split('.');
    let obj = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in obj)) {
        obj[key] = {};
      }
      obj = obj[key];
    }

    obj[keys[keys.length - 1]] = value;
  }

  /**
   * Reset configuration (for testing purposes)
   */
  reset() {
    this.loaded = false;
    this.config = {};
  }

  /**
   * Get all configuration
   * 
   * @returns {Object} Complete configuration object
   */
  getAll() {
    if (!this.loaded) {
      this.load();
    }
    return JSON.parse(JSON.stringify(this.config));
  }
}

// Singleton instance
const config = new Config();

export default config;
