# API Reference

Complete API documentation for all core modules.

## Table of Contents

- [Config Module](#config-module)
- [Logger Module](#logger-module)
- [Error Handler Module](#error-handler-module)
- [Validator Module](#validator-module)
- [Notion Client Module](#notion-client-module)
- [Task Manager Module](#task-manager-module)

---

## Config Module

Manages application configuration from environment variables.

### Importing

```javascript
import config from './core/config.js';
```

### Methods

#### `load()`

Load configuration from environment variables.

**Returns**: `Object` - Configuration object

**Throws**: `Error` - If required configuration is missing

**Example**:
```javascript
const cfg = config.load();
console.log(cfg.notion.apiKey);
```

---

#### `get(path, defaultValue)`

Get a configuration value by path.

**Parameters**:
- `path` (string): Dot-notation path (e.g., 'notion.apiKey')
- `defaultValue` (*): Default value if not found (optional)

**Returns**: `*` - Configuration value

**Example**:
```javascript
const apiKey = config.get('notion.apiKey');
const logLevel = config.get('app.logLevel', 'info');
```

---

#### `set(path, value)`

Set a configuration value (for testing purposes).

**Parameters**:
- `path` (string): Dot-notation path
- `value` (*): Value to set

**Example**:
```javascript
config.set('notion.apiKey', 'new-key');
```

---

#### `getAll()`

Get complete configuration object.

**Returns**: `Object` - Complete configuration object (deep copy)

**Example**:
```javascript
const allConfig = config.getAll();
```

---

#### `reset()`

Reset configuration (for testing purposes).

**Example**:
```javascript
config.reset();
```

---

## Logger Module

Provides structured logging with different log levels.

### Importing

```javascript
import logger, { Logger } from './core/logger.js';
```

### Constructor Options

```javascript
const logger = new Logger({
  level: 'info',           // Log level (error, warn, info, debug)
  prefix: 'MyModule',      // Prefix for log messages
  enableColors: true,      // Enable colored output
  enableTimestamp: true,   // Include timestamps
});
```

### Methods

#### `setLevel(level)`

Set the log level.

**Parameters**:
- `level` (string): Log level (error, warn, info, debug)

**Throws**: `Error` - If log level is invalid

**Example**:
```javascript
logger.setLevel('debug');
```

---

#### `error(message, meta)`

Log at error level.

**Parameters**:
- `message` (string): Message to log
- `meta` (Object): Additional metadata (optional)

**Example**:
```javascript
logger.error('Operation failed', { error: error.message, userId: '123' });
```

---

#### `warn(message, meta)`

Log at warn level.

**Parameters**:
- `message` (string): Message to log
- `meta` (Object): Additional metadata (optional)

**Example**:
```javascript
logger.warn('Deprecated feature used', { feature: 'oldMethod' });
```

---

#### `info(message, meta)`

Log at info level.

**Parameters**:
- `message` (string): Message to log
- `meta` (Object): Additional metadata (optional)

**Example**:
```javascript
logger.info('Task created', { id: '123', title: 'New Task' });
```

---

#### `debug(message, meta)`

Log at debug level.

**Parameters**:
- `message` (string): Message to log
- `meta` (Object): Additional metadata (optional)

**Example**:
```javascript
logger.debug('Processing step', { step: 1, total: 5 });
```

---

#### `child(prefix)`

Create a child logger with a prefix.

**Parameters**:
- `prefix` (string): Prefix for child logger

**Returns**: `Logger` - New logger instance

**Example**:
```javascript
const taskLogger = logger.child('TaskManager');
taskLogger.info('Task created');
// Output: [TIMESTAMP] INFO [TaskManager] Task created
```

---

## Error Handler Module

Provides custom error classes and centralized error handling.

### Importing

```javascript
import {
  AppError,
  ConfigError,
  ValidationError,
  APIError,
  NotionAPIError,
  NotFoundError,
  ErrorHandler,
} from './core/errors.js';
```

### Error Classes

#### `AppError`

Base application error class.

**Constructor**:
```javascript
new AppError(message, statusCode = 500, isOperational = true)
```

**Methods**:
- `toJSON()`: Convert error to JSON object

**Example**:
```javascript
throw new AppError('Something went wrong', 500);
```

---

#### `ConfigError`

Configuration error.

**Constructor**:
```javascript
new ConfigError(message)
```

**Example**:
```javascript
throw new ConfigError('Missing API key');
```

---

#### `ValidationError`

Input validation error.

**Constructor**:
```javascript
new ValidationError(message, details = {})
```

**Properties**:
- `details` (Object): Validation error details

**Example**:
```javascript
throw new ValidationError('Invalid email', { field: 'email', reason: 'format' });
```

---

#### `APIError`

External API error.

**Constructor**:
```javascript
new APIError(message, statusCode = 500, originalError = null)
```

**Example**:
```javascript
throw new APIError('API request failed', 503, originalError);
```

---

#### `NotionAPIError`

Notion-specific API error.

**Constructor**:
```javascript
new NotionAPIError(message, statusCode = 500, notionError = null)
```

**Static Methods**:
- `fromNotionError(error)`: Create from Notion error object

**Example**:
```javascript
throw NotionAPIError.fromNotionError(notionError);
```

---

#### `NotFoundError`

Resource not found error.

**Constructor**:
```javascript
new NotFoundError(resource, identifier)
```

**Example**:
```javascript
throw new NotFoundError('Task', 'task-123');
```

---

### ErrorHandler

Centralized error handler.

**Constructor**:
```javascript
const errorHandler = new ErrorHandler(logger);
```

**Methods**:

#### `handle(error, exit)`

Handle an error.

**Parameters**:
- `error` (Error): Error to handle
- `exit` (boolean): Whether to exit process (optional, default: false)

**Example**:
```javascript
errorHandler.handle(error);
```

---

#### `isOperationalError(error)`

Check if error is operational.

**Parameters**:
- `error` (Error): Error to check

**Returns**: `boolean` - True if operational error

**Example**:
```javascript
if (errorHandler.isOperationalError(error)) {
  // Handle gracefully
}
```

---

#### `registerGlobalHandlers()`

Register global error handlers.

**Example**:
```javascript
errorHandler.registerGlobalHandlers();
```

---

## Validator Module

Provides input validation and data sanitization utilities.

### Importing

```javascript
import Validator from './core/validator.js';
```

### Methods

#### `requireString(value, fieldName)`

Validate that a value is a non-empty string.

**Parameters**:
- `value` (*): Value to validate
- `fieldName` (string): Name of field for error message

**Returns**: `string` - Trimmed string

**Throws**: `ValidationError` - If validation fails

**Example**:
```javascript
const title = Validator.requireString(input.title, 'title');
```

---

#### `optionalString(value, fieldName)`

Validate that a value is a string (empty allowed).

**Parameters**:
- `value` (*): Value to validate
- `fieldName` (string): Name of field for error message

**Returns**: `string` - Trimmed string or empty string

**Throws**: `ValidationError` - If validation fails

**Example**:
```javascript
const notes = Validator.optionalString(input.notes, 'notes');
```

---

#### `requireNumber(value, fieldName)`

Validate that a value is a number.

**Parameters**:
- `value` (*): Value to validate
- `fieldName` (string): Name of field for error message

**Returns**: `number` - Numeric value

**Throws**: `ValidationError` - If validation fails

**Example**:
```javascript
const count = Validator.requireNumber(input.count, 'count');
```

---

#### `requireBoolean(value, fieldName)`

Validate that a value is a boolean.

**Parameters**:
- `value` (*): Value to validate
- `fieldName` (string): Name of field for error message

**Returns**: `boolean` - Boolean value

**Throws**: `ValidationError` - If validation fails

---

#### `requireEnum(value, allowed, fieldName)`

Validate that a value is one of allowed values.

**Parameters**:
- `value` (*): Value to validate
- `allowed` (Array): Array of allowed values
- `fieldName` (string): Name of field for error message

**Returns**: `*` - Validated value

**Throws**: `ValidationError` - If validation fails

**Example**:
```javascript
const status = Validator.requireEnum(input.status, ['active', 'inactive'], 'status');
```

---

#### `validateLength(value, options, fieldName)`

Validate string length constraints.

**Parameters**:
- `value` (string): String to validate
- `options` (Object): Options with min and max length
- `fieldName` (string): Name of field for error message

**Returns**: `string` - Validated string

**Throws**: `ValidationError` - If validation fails

**Example**:
```javascript
const title = Validator.validateLength(input.title, { min: 1, max: 100 }, 'title');
```

---

#### `validateNotionPageId(pageId)`

Validate a Notion page ID format.

**Parameters**:
- `pageId` (string): Page ID to validate

**Returns**: `string` - Validated page ID

**Throws**: `ValidationError` - If validation fails

**Example**:
```javascript
const pageId = Validator.validateNotionPageId(input.pageId);
```

---

#### `validateTaskData(taskData)`

Validate task data structure.

**Parameters**:
- `taskData` (Object): Task data to validate

**Returns**: `Object` - Validated task data

**Throws**: `ValidationError` - If validation fails

**Example**:
```javascript
const validated = Validator.validateTaskData({
  title: 'Task Title',
  notes: 'Optional notes',
});
```

---

#### `validateTaskStatus(status)`

Validate task status value.

**Parameters**:
- `status` (string): Status to validate

**Returns**: `string` - Validated status

**Throws**: `ValidationError` - If validation fails

**Allowed Values**: 'To-do', 'In Progress', 'Done', 'Blocked'

**Example**:
```javascript
const status = Validator.validateTaskStatus('Done');
```

---

#### `sanitizeString(input)`

Sanitize string input by removing dangerous characters.

**Parameters**:
- `input` (string): Input to sanitize

**Returns**: `string` - Sanitized string

**Example**:
```javascript
const clean = Validator.sanitizeString(userInput);
```

---

## Notion Client Module

Wrapper around the Notion API with error handling and retry logic.

### Importing

```javascript
import notionClient from './core/notion-client.js';
```

### Methods

#### `initialize()`

Initialize the Notion client.

**Throws**: `ConfigError` - If configuration is invalid

**Example**:
```javascript
notionClient.initialize();
```

---

#### `createPage(databaseId, properties)`

Create a page in a database.

**Parameters**:
- `databaseId` (string): Database ID
- `properties` (Object): Page properties

**Returns**: `Promise<Object>` - Created page

**Throws**: `NotionAPIError` - If API call fails

**Example**:
```javascript
const page = await notionClient.createPage('db-123', {
  Task: { title: [{ text: { content: 'New Task' } }] },
});
```

---

#### `updatePage(pageId, properties)`

Update a page.

**Parameters**:
- `pageId` (string): Page ID
- `properties` (Object): Properties to update

**Returns**: `Promise<Object>` - Updated page

**Throws**: `NotionAPIError` - If API call fails

**Example**:
```javascript
await notionClient.updatePage('page-123', {
  Status: { status: { name: 'Done' } },
});
```

---

#### `retrievePage(pageId)`

Retrieve a page.

**Parameters**:
- `pageId` (string): Page ID

**Returns**: `Promise<Object>` - Page data

**Throws**: `NotionAPIError` - If API call fails

**Example**:
```javascript
const page = await notionClient.retrievePage('page-123');
```

---

#### `queryDatabase(databaseId, options)`

Query a database.

**Parameters**:
- `databaseId` (string): Database ID
- `options` (Object): Query options (filter, sorts, etc.)

**Returns**: `Promise<Object>` - Query results

**Throws**: `NotionAPIError` - If API call fails

**Example**:
```javascript
const results = await notionClient.queryDatabase('db-123', {
  filter: { property: 'Status', status: { equals: 'Done' } },
});
```

---

#### `retrieveDatabase(databaseId)`

Retrieve database metadata.

**Parameters**:
- `databaseId` (string): Database ID

**Returns**: `Promise<Object>` - Database metadata

**Throws**: `NotionAPIError` - If API call fails

---

#### `archivePage(pageId)`

Archive (delete) a page.

**Parameters**:
- `pageId` (string): Page ID

**Returns**: `Promise<Object>` - Archived page

**Throws**: `NotionAPIError` - If API call fails

**Example**:
```javascript
await notionClient.archivePage('page-123');
```

---

## Task Manager Module

Business logic layer for task management operations.

### Importing

```javascript
import taskManager from './core/task-manager.js';
```

### Methods

#### `initialize()`

Initialize the task manager.

**Example**:
```javascript
taskManager.initialize();
```

---

#### `createTask(taskData)`

Create a new task.

**Parameters**:
- `taskData` (Object): Task data
  - `title` (string): Task title (required)
  - `notes` (string): Task notes (optional)
  - `assignedTo` (string): Assignee (optional)

**Returns**: `Promise<Object>` - Created task

**Throws**: 
- `ValidationError` - If task data is invalid
- `NotionAPIError` - If API call fails

**Example**:
```javascript
const task = await taskManager.createTask({
  title: 'Complete documentation',
  notes: 'Write API reference',
});
```

---

#### `updateTask(taskId, updates)`

Update a task.

**Parameters**:
- `taskId` (string): Task ID (page ID)
- `updates` (Object): Properties to update
  - `title` (string): New title (optional)
  - `status` (string): New status (optional)
  - `notes` (string): New notes (optional)

**Returns**: `Promise<Object>` - Updated task

**Throws**: 
- `ValidationError` - If update data is invalid
- `NotionAPIError` - If API call fails

**Example**:
```javascript
const task = await taskManager.updateTask('task-123', {
  status: 'Done',
  notes: 'Completed successfully',
});
```

---

#### `getTask(taskId)`

Get a task by ID.

**Parameters**:
- `taskId` (string): Task ID (page ID)

**Returns**: `Promise<Object>` - Task data

**Throws**: 
- `ValidationError` - If task ID is invalid
- `NotFoundError` - If task not found
- `NotionAPIError` - If API call fails

**Example**:
```javascript
const task = await taskManager.getTask('task-123');
```

---

#### `listTasks(options)`

List tasks with optional filters.

**Parameters**:
- `options` (Object): Query options (optional)
  - `status` (string): Filter by status
  - `limit` (number): Maximum number of tasks to return

**Returns**: `Promise<Array>` - Array of tasks

**Throws**: `NotionAPIError` - If API call fails

**Example**:
```javascript
const tasks = await taskManager.listTasks({ status: 'To-do', limit: 10 });
```

---

#### `deleteTask(taskId)`

Delete (archive) a task.

**Parameters**:
- `taskId` (string): Task ID (page ID)

**Returns**: `Promise<void>`

**Throws**: 
- `ValidationError` - If task ID is invalid
- `NotFoundError` - If task not found
- `NotionAPIError` - If API call fails

**Example**:
```javascript
await taskManager.deleteTask('task-123');
```

---

#### `updateTaskStatus(taskId, status)`

Update task status.

**Parameters**:
- `taskId` (string): Task ID (page ID)
- `status` (string): New status

**Returns**: `Promise<Object>` - Updated task

**Throws**: 
- `ValidationError` - If parameters are invalid
- `NotionAPIError` - If API call fails

**Example**:
```javascript
await taskManager.updateTaskStatus('task-123', 'Done');
```

---

## Task Object Structure

Task objects returned by Task Manager methods have the following structure:

```javascript
{
  id: 'page-123',                          // Notion page ID
  title: 'Task Title',                     // Task title
  status: 'To-do',                         // Task status
  notes: 'Task notes',                     // Task notes
  assignedTo: [],                          // Array of assigned people
  createdTime: '2024-01-01T00:00:00Z',     // Creation timestamp
  lastEditedTime: '2024-01-02T00:00:00Z',  // Last edit timestamp
  url: 'https://notion.so/page-123'        // Notion page URL
}
```

## Complete Usage Example

```javascript
import { 
  config, 
  logger, 
  taskManager, 
  ErrorHandler,
  ValidationError 
} from './src/index.js';

// Initialize
const errorHandler = new ErrorHandler(logger);
errorHandler.registerGlobalHandlers();

async function main() {
  try {
    // Load configuration
    config.load();
    logger.setLevel(config.get('app.logLevel', 'info'));
    
    // Create a task
    const task = await taskManager.createTask({
      title: 'Implement new feature',
      notes: 'Add user authentication',
    });
    
    logger.info('Task created', { id: task.id });
    
    // Update status
    await taskManager.updateTaskStatus(task.id, 'In Progress');
    
    // List tasks
    const tasks = await taskManager.listTasks({ status: 'In Progress' });
    logger.info(`Found ${tasks.length} tasks in progress`);
    
  } catch (error) {
    errorHandler.handle(error);
  }
}

main();
```
