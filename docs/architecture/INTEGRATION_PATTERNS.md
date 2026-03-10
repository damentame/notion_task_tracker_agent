# Integration Patterns
## Notion Task Tracker CLI

**Version:** 1.0  
**Date:** March 10, 2026

---

## Table of Contents
1. [Notion API Integration](#notion-api-integration)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Synchronization](#data-synchronization)
4. [Error Handling Patterns](#error-handling-patterns)
5. [Rate Limiting & Throttling](#rate-limiting--throttling)
6. [Caching Strategies](#caching-strategies)
7. [Offline Support](#offline-support)

---

## 1. Notion API Integration

### 1.1 Integration Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLI Application                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              NotionRepository Layer                     │
│  • Request preparation                                  │
│  • Response parsing                                     │
│  • Error handling                                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            Middleware Stack                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Rate Limiter (3 req/sec)                         │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Retry Handler (exponential backoff)              │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Request/Response Logger                          │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Error Transformer                                │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           @notionhq/client SDK                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Notion REST API                            │
│         https://api.notion.com/v1/                      │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Request/Response Flow

#### Create Task Flow
```
1. User Command
   └─> notion-task create "My Task" --status todo

2. CLI Layer Validation
   └─> Validate input parameters

3. TaskService
   └─> Build task object

4. NotionRepository
   └─> Transform to Notion format
   
5. Rate Limiter
   └─> Check quota availability
   
6. API Call
   └─> POST /v1/pages
   
7. Retry Handler (if needed)
   └─> Exponential backoff on errors
   
8. Response Processing
   └─> Transform Notion page to Task model
   
9. Cache Update
   └─> Invalidate related cache entries
   
10. Output Formatting
    └─> Display success message
```

### 1.3 Notion API Client Configuration

```javascript
import { Client } from '@notionhq/client';
import { createRateLimiter } from './utils/rateLimit.js';
import { createRetryHandler } from './utils/retry.js';

export class NotionClientWrapper {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.rateLimiter = createRateLimiter(3); // 3 req/sec
    this.retryHandler = createRetryHandler({
      maxRetries: 3,
      baseDelay: 1000
    });
    
    this.client = new Client({
      auth: apiKey,
      notionVersion: '2022-06-28',
      timeoutMs: options.timeout || 60000,
      fetch: this.createCustomFetch()
    });
  }

  createCustomFetch() {
    return async (url, options) => {
      // Apply rate limiting
      await this.rateLimiter.acquire();
      
      // Apply retry logic
      return this.retryHandler.execute(async () => {
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new NotionAPIError(response);
        }
        
        return response;
      });
    };
  }

  async createPage(params) {
    return this.client.pages.create(params);
  }

  async updatePage(pageId, params) {
    return this.client.pages.update({
      page_id: pageId,
      ...params
    });
  }

  async queryDatabase(databaseId, params) {
    return this.client.databases.query({
      database_id: databaseId,
      ...params
    });
  }

  async getPage(pageId) {
    return this.client.pages.retrieve({ page_id: pageId });
  }
}
```

---

## 2. Authentication & Authorization

### 2.1 API Key Management

#### Storage Strategy
```javascript
import { homedir } from 'os';
import { join } from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { createCipheriv, createDecipheriv } from 'crypto';

export class SecureConfigManager {
  constructor() {
    this.configDir = join(homedir(), '.notion-task-cli');
    this.configFile = join(this.configDir, 'config.json');
    this.encryptionKey = this.deriveEncryptionKey();
  }

  deriveEncryptionKey() {
    // Derive from machine-specific identifiers
    const { platform, arch, hostname } = process;
    const machineId = `${platform}-${arch}-${hostname}`;
    
    // Use PBKDF2 for key derivation
    return pbkdf2Sync(
      machineId,
      'notion-cli-salt',
      100000,
      32,
      'sha256'
    );
  }

  async saveApiKey(apiKey) {
    await mkdir(this.configDir, { recursive: true });
    
    const encrypted = this.encrypt(apiKey);
    const config = {
      version: '1.0',
      credentials: {
        encrypted: encrypted.data,
        iv: encrypted.iv,
        authTag: encrypted.authTag
      },
      createdAt: new Date().toISOString()
    };
    
    await writeFile(
      this.configFile,
      JSON.stringify(config, null, 2),
      { mode: 0o600 } // Owner read/write only
    );
  }

  async loadApiKey() {
    try {
      const configData = await readFile(this.configFile, 'utf8');
      const config = JSON.parse(configData);
      
      return this.decrypt({
        data: config.credentials.encrypted,
        iv: config.credentials.iv,
        authTag: config.credentials.authTag
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new ConfigNotFoundError(
          'No configuration found. Run: notion-task init'
        );
      }
      throw error;
    }
  }

  encrypt(text) {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);
    
    return {
      data: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64')
    };
  }

  decrypt(encrypted) {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(encrypted.iv, 'base64')
    );
    
    decipher.setAuthTag(Buffer.from(encrypted.authTag, 'base64'));
    
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted.data, 'base64')),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  }
}
```

#### Environment Variable Override
```javascript
export class ConfigProvider {
  getApiKey() {
    // 1. Check environment variable (highest priority)
    if (process.env.NOTION_API_KEY) {
      return process.env.NOTION_API_KEY;
    }
    
    // 2. Check config file
    return this.configManager.loadApiKey();
  }

  getDatabaseId() {
    // 1. Check environment variable
    if (process.env.NOTION_DATABASE_ID) {
      return process.env.NOTION_DATABASE_ID;
    }
    
    // 2. Check config file
    return this.configManager.loadDatabaseId();
  }
}
```

### 2.2 Permission Validation

```javascript
export class PermissionValidator {
  async validateAccess(notionClient, databaseId) {
    try {
      // Test read access
      const database = await notionClient.databases.retrieve({
        database_id: databaseId
      });
      
      // Test write access
      await notionClient.databases.query({
        database_id: databaseId,
        page_size: 1
      });
      
      return {
        valid: true,
        permissions: {
          read: true,
          write: true,
          databaseTitle: database.title[0]?.plain_text
        }
      };
    } catch (error) {
      if (error.code === 'object_not_found') {
        throw new ValidationError(
          'Database not found. Check your database ID.'
        );
      }
      
      if (error.code === 'unauthorized') {
        throw new ValidationError(
          'API key does not have access to this database.'
        );
      }
      
      throw error;
    }
  }
}
```

---

## 3. Data Synchronization

### 3.1 Property Mapping

```javascript
export class NotionDataMapper {
  /**
   * Map internal Task model to Notion page properties
   */
  toNotionProperties(task) {
    const properties = {};

    // Title (required)
    if (task.title) {
      properties.Task = {
        title: [{ text: { content: task.title } }]
      };
    }

    // Status
    if (task.status) {
      properties.Status = {
        status: { name: this.mapStatus(task.status) }
      };
    }

    // Assignees
    if (task.assignees && task.assignees.length > 0) {
      properties['Assigned To'] = {
        people: task.assignees.map(id => ({ id }))
      };
    }

    // Due Date
    if (task.dueDate) {
      properties['Due Date'] = {
        date: { start: task.dueDate.toISOString().split('T')[0] }
      };
    }

    // Priority
    if (task.priority) {
      properties.Priority = {
        select: { name: task.priority }
      };
    }

    // Notes
    if (task.notes) {
      properties.Notes = {
        rich_text: [{ text: { content: task.notes } }]
      };
    }

    // Tags
    if (task.tags && task.tags.length > 0) {
      properties.Tags = {
        multi_select: task.tags.map(tag => ({ name: tag }))
      };
    }

    return properties;
  }

  /**
   * Map Notion page to internal Task model
   */
  fromNotionPage(page) {
    return {
      id: page.id,
      title: this.extractTitle(page.properties.Task),
      status: this.extractStatus(page.properties.Status),
      assignees: this.extractPeople(page.properties['Assigned To']),
      dueDate: this.extractDate(page.properties['Due Date']),
      priority: this.extractSelect(page.properties.Priority),
      notes: this.extractRichText(page.properties.Notes),
      tags: this.extractMultiSelect(page.properties.Tags),
      createdAt: new Date(page.created_time),
      updatedAt: new Date(page.last_edited_time),
      url: page.url
    };
  }

  // Helper extraction methods
  extractTitle(property) {
    if (!property?.title?.[0]) return '';
    return property.title[0].plain_text;
  }

  extractStatus(property) {
    return property?.status?.name || 'Unknown';
  }

  extractPeople(property) {
    if (!property?.people) return [];
    return property.people.map(person => person.id);
  }

  extractDate(property) {
    if (!property?.date?.start) return null;
    return new Date(property.date.start);
  }

  extractSelect(property) {
    return property?.select?.name || null;
  }

  extractRichText(property) {
    if (!property?.rich_text?.[0]) return '';
    return property.rich_text
      .map(rt => rt.plain_text)
      .join('');
  }

  extractMultiSelect(property) {
    if (!property?.multi_select) return [];
    return property.multi_select.map(item => item.name);
  }

  // Status mapping
  mapStatus(status) {
    const statusMap = {
      'todo': 'To-do',
      'in-progress': 'In Progress',
      'done': 'Done',
      'blocked': 'Blocked'
    };
    return statusMap[status.toLowerCase()] || status;
  }
}
```

### 3.2 Incremental Sync

```javascript
export class IncrementalSyncManager {
  constructor(notionRepository, cacheService) {
    this.notionRepository = notionRepository;
    this.cacheService = cacheService;
  }

  async syncUpdates(databaseId) {
    const lastSyncTime = await this.cacheService.get('last_sync_time');
    const now = new Date();

    // Query for updates since last sync
    const filter = lastSyncTime ? {
      timestamp: 'last_edited_time',
      last_edited_time: {
        after: lastSyncTime.toISOString()
      }
    } : undefined;

    const results = await this.notionRepository.queryDatabase(
      databaseId,
      filter
    );

    // Update cache
    for (const page of results) {
      await this.cacheService.set(
        `task:${page.id}`,
        page,
        300 // 5 minutes TTL
      );
    }

    // Update last sync time
    await this.cacheService.set('last_sync_time', now);

    return {
      synced: results.length,
      timestamp: now
    };
  }
}
```

---

## 4. Error Handling Patterns

### 4.1 Error Classification

```javascript
export class NotionErrorHandler {
  handleError(error) {
    // Notion API errors
    if (error.code) {
      switch (error.code) {
        case 'unauthorized':
          return new AuthenticationError(
            'Invalid API key. Run: notion-task config --api-key <key>'
          );
        
        case 'restricted_resource':
          return new AuthorizationError(
            'API key does not have access to this resource.'
          );
        
        case 'object_not_found':
          return new NotFoundError(
            'Database or page not found. Check your IDs.'
          );
        
        case 'validation_error':
          return new ValidationError(
            `Invalid data: ${error.message}`
          );
        
        case 'rate_limited':
          return new RateLimitError(
            'Rate limit exceeded. Please wait and try again.'
          );
        
        case 'internal_server_error':
        case 'service_unavailable':
          return new NotionServiceError(
            'Notion service is temporarily unavailable.'
          );
        
        default:
          return new NotionAPIError(
            `Notion API error: ${error.message}`,
            error
          );
      }
    }

    // Network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new NetworkError(
        'Cannot connect to Notion API. Check your internet connection.'
      );
    }

    // Timeout errors
    if (error.code === 'ETIMEDOUT') {
      return new TimeoutError(
        'Request timed out. Please try again.'
      );
    }

    // Unknown errors
    return new UnknownError(
      `An unexpected error occurred: ${error.message}`,
      error
    );
  }

  getUserFriendlyMessage(error) {
    return {
      message: error.message,
      suggestion: this.getSuggestion(error),
      details: error.details,
      recoverable: error.recoverable
    };
  }

  getSuggestion(error) {
    if (error instanceof AuthenticationError) {
      return 'Verify your API key in ~/.notion-task-cli/config.json';
    }
    
    if (error instanceof NotFoundError) {
      return 'Verify your database ID with: notion-task config --show';
    }
    
    if (error instanceof RateLimitError) {
      return 'Wait a few seconds and try again';
    }
    
    if (error instanceof NetworkError) {
      return 'Check your internet connection';
    }
    
    return 'Use --verbose flag for more details';
  }
}
```

---

## 5. Rate Limiting & Throttling

### 5.1 Token Bucket Implementation

```javascript
export class TokenBucket {
  constructor(capacity = 3, refillRate = 3) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate; // tokens per second
    this.lastRefill = Date.now();
    this.queue = [];
  }

  async acquire() {
    this.refill();

    if (this.tokens > 0) {
      this.tokens--;
      return Promise.resolve();
    }

    // Wait in queue
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this.processQueue();
    });
  }

  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = Math.floor(elapsed * this.refillRate);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  processQueue() {
    if (this.queue.length === 0) return;

    const timer = setInterval(() => {
      this.refill();

      while (this.tokens > 0 && this.queue.length > 0) {
        this.tokens--;
        const resolve = this.queue.shift();
        resolve();
      }

      if (this.queue.length === 0) {
        clearInterval(timer);
      }
    }, 1000 / this.refillRate);
  }
}
```

### 5.2 Adaptive Rate Limiting

```javascript
export class AdaptiveRateLimiter {
  constructor() {
    this.baseRate = 3; // requests per second
    this.currentRate = 3;
    this.consecutiveErrors = 0;
    this.bucket = new TokenBucket(this.currentRate, this.currentRate);
  }

  async execute(fn) {
    await this.bucket.acquire();

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      if (error.code === 'rate_limited') {
        this.onRateLimit();
      }
      throw error;
    }
  }

  onSuccess() {
    // Gradually increase rate back to baseline
    if (this.currentRate < this.baseRate) {
      this.currentRate += 0.1;
      this.updateBucket();
    }
    this.consecutiveErrors = 0;
  }

  onRateLimit() {
    // Reduce rate
    this.consecutiveErrors++;
    this.currentRate = Math.max(1, this.currentRate * 0.5);
    this.updateBucket();
  }

  updateBucket() {
    this.bucket = new TokenBucket(this.currentRate, this.currentRate);
  }
}
```

---

## 6. Caching Strategies

### 6.1 Multi-Level Cache

```javascript
export class MultiLevelCache {
  constructor() {
    // Level 1: Memory cache (fast, volatile)
    this.memoryCache = new NodeCache({
      stdTTL: 300,
      checkperiod: 60
    });

    // Level 2: File cache (slower, persistent)
    this.fileCache = new FileCache({
      directory: join(homedir(), '.notion-task-cli', 'cache'),
      maxAge: 3600000 // 1 hour
    });
  }

  async get(key) {
    // Try memory cache first
    let value = this.memoryCache.get(key);
    if (value !== undefined) {
      return value;
    }

    // Try file cache
    value = await this.fileCache.get(key);
    if (value !== undefined) {
      // Promote to memory cache
      this.memoryCache.set(key, value);
      return value;
    }

    return null;
  }

  async set(key, value, ttl) {
    // Write to both caches
    this.memoryCache.set(key, value, ttl);
    await this.fileCache.set(key, value, ttl);
  }

  async invalidate(pattern) {
    // Invalidate in both caches
    const keys = this.memoryCache.keys();
    const matchingKeys = keys.filter(k => k.includes(pattern));
    
    this.memoryCache.del(matchingKeys);
    await this.fileCache.invalidate(pattern);
  }
}
```

### 6.2 Cache Invalidation Strategy

```javascript
export class CacheInvalidationManager {
  constructor(cache) {
    this.cache = cache;
  }

  async onTaskCreated(task) {
    // Invalidate list caches
    await this.cache.invalidate('task:list');
    await this.cache.invalidate('task:query');
  }

  async onTaskUpdated(taskId) {
    // Invalidate specific task
    await this.cache.invalidate(`task:${taskId}`);
    
    // Invalidate list caches
    await this.cache.invalidate('task:list');
    await this.cache.invalidate('task:query');
  }

  async onTaskDeleted(taskId) {
    // Remove specific task
    await this.cache.invalidate(`task:${taskId}`);
    
    // Invalidate list caches
    await this.cache.invalidate('task:list');
    await this.cache.invalidate('task:query');
  }

  async onBulkOperation() {
    // Clear all task-related caches
    await this.cache.invalidate('task:');
  }
}
```

---

## 7. Offline Support

### 7.1 Offline Detection

```javascript
export class ConnectivityManager {
  constructor() {
    this.isOnline = true;
    this.listeners = [];
  }

  async checkConnectivity() {
    try {
      await fetch('https://api.notion.com/v1', {
        method: 'HEAD',
        timeout: 5000
      });
      this.setOnlineStatus(true);
      return true;
    } catch (error) {
      this.setOnlineStatus(false);
      return false;
    }
  }

  setOnlineStatus(status) {
    if (this.isOnline !== status) {
      this.isOnline = status;
      this.notifyListeners(status);
    }
  }

  onStatusChange(callback) {
    this.listeners.push(callback);
  }

  notifyListeners(status) {
    this.listeners.forEach(callback => callback(status));
  }
}
```

### 7.2 Offline Queue

```javascript
export class OfflineQueue {
  constructor(storage) {
    this.storage = storage;
    this.queue = [];
  }

  async enqueue(operation) {
    const entry = {
      id: generateId(),
      operation,
      timestamp: new Date(),
      retries: 0
    };

    this.queue.push(entry);
    await this.persist();
  }

  async processQueue() {
    while (this.queue.length > 0) {
      const entry = this.queue[0];

      try {
        await entry.operation();
        this.queue.shift();
        await this.persist();
      } catch (error) {
        entry.retries++;
        
        if (entry.retries >= 3) {
          // Remove failed operation
          this.queue.shift();
          await this.logFailure(entry, error);
        } else {
          // Retry later
          break;
        }
      }
    }
  }

  async persist() {
    await this.storage.write('offline_queue', this.queue);
  }

  async load() {
    this.queue = await this.storage.read('offline_queue') || [];
  }
}
```

---

## Summary

This integration patterns document provides detailed implementation guidance for:

1. **Notion API Integration**: Complete client setup with middleware
2. **Authentication**: Secure credential management
3. **Data Synchronization**: Bidirectional data mapping
4. **Error Handling**: Comprehensive error classification
5. **Rate Limiting**: Adaptive throttling strategies
6. **Caching**: Multi-level caching with smart invalidation
7. **Offline Support**: Queue-based offline operations

These patterns ensure reliable, secure, and performant integration with Notion's API while providing excellent user experience.

---

*Last Updated: March 10, 2026*
