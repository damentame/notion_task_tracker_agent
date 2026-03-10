# Core Module Architecture

## Overview

The Notion Task Manager is built on a modular architecture that separates concerns into distinct, testable components. This architecture follows best practices for maintainability, scalability, and testability.

## Architecture Principles

1. **Separation of Concerns**: Each module has a single, well-defined responsibility
2. **Dependency Injection**: Modules are loosely coupled and easily testable
3. **Error Handling**: Centralized error handling with custom error types
4. **Logging**: Structured logging throughout the application
5. **Validation**: Input validation at all entry points
6. **Configuration Management**: Environment-based configuration

## Module Structure

```
src/
âââ core/
    âââ config.js          # Configuration management
    âââ logger.js          # Structured logging
    âââ errors.js          # Custom error classes and error handler
    âââ validator.js       # Input validation utilities
    âââ notion-client.js   # Notion API wrapper
    âââ task-manager.js    # Task business logic
    âââ index.js           # Module exports
```

## Core Modules

### 1. Configuration Module (`config.js`)

**Purpose**: Manages application configuration from environment variables.

**Key Features**:
- Environment variable loading via dotenv
- Configuration validation
- Singleton pattern for consistent configuration access
- Support for nested configuration paths

**Usage**:
```javascript
import config from './core/config.js';

const apiKey = config.get('notion.apiKey');
const allConfig = config.getAll();
```

### 2. Logger Module (`logger.js`)

**Purpose**: Provides structured logging with different log levels.

**Key Features**:
- Multiple log levels (error, warn, info, debug)
- Colored console output
- Timestamps
- Metadata support
- Child loggers with prefixes

**Usage**:
```javascript
import logger from './core/logger.js';

logger.info('Task created', { id: '123', title: 'New Task' });
logger.error('Operation failed', { error: error.message });

const childLogger = logger.child('TaskManager');
childLogger.debug('Processing task');
```

### 3. Error Handler Module (`errors.js`)

**Purpose**: Provides custom error classes and centralized error handling.

**Key Features**:
- Hierarchy of error types
- Operational vs programming error distinction
- Error serialization
- Global error handler registration

**Error Types**:
- `AppError`: Base application error
- `ConfigError`: Configuration errors
- `ValidationError`: Input validation errors
- `APIError`: External API errors
- `NotionAPIError`: Notion-specific API errors
- `NotFoundError`: Resource not found errors

**Usage**:
```javascript
import { ValidationError, ErrorHandler } from './core/errors.js';

throw new ValidationError('Invalid input', { field: 'email' });

const errorHandler = new ErrorHandler(logger);
errorHandler.handle(error);
```

### 4. Validator Module (`validator.js`)

**Purpose**: Provides input validation and data sanitization utilities.

**Key Features**:
- Type validation (string, number, boolean)
- Enum validation
- Length constraints
- Notion-specific validation (page IDs, statuses)
- Task data validation
- String sanitization

**Usage**:
```javascript
import Validator from './core/validator.js';

const title = Validator.requireString(input.title, 'title');
const status = Validator.validateTaskStatus(input.status);
const taskData = Validator.validateTaskData(rawData);
```

### 5. Notion Client Module (`notion-client.js`)

**Purpose**: Wrapper around the Notion API with error handling and retry logic.

**Key Features**:
- Automatic retry for transient failures
- Error handling and conversion to custom errors
- Rate limit handling
- Simplified API interface
- Connection pooling

**Usage**:
```javascript
import notionClient from './core/notion-client.js';

const page = await notionClient.createPage(databaseId, properties);
const results = await notionClient.queryDatabase(databaseId, options);
await notionClient.updatePage(pageId, properties);
```

### 6. Task Manager Module (`task-manager.js`)

**Purpose**: Business logic layer for task management operations.

**Key Features**:
- High-level task CRUD operations
- Notion property mapping
- Task data parsing
- Status management
- Query and filtering

**Usage**:
```javascript
import taskManager from './core/task-manager.js';

const task = await taskManager.createTask({
  title: 'New Task',
  notes: 'Task description',
});

await taskManager.updateTaskStatus(taskId, 'Done');
const tasks = await taskManager.listTasks({ status: 'To-do' });
```

## Data Flow

```
User Input
    â
Validator (validates input)
    â
Task Manager (business logic)
    â
Notion Client (API wrapper)
    â
Notion API
```

## Error Handling Flow

```
Error Occurs
    â
Custom Error Created
    â
Logger Records Error
    â
Error Handler Processes
    â
Response/Exit
```

## Testing Strategy

### Unit Tests
- All core modules have comprehensive unit tests
- Mock external dependencies (Notion API)
- Test error conditions and edge cases
- Achieve >80% code coverage

### Test Structure
```
test/
âââ unit/
    âââ config.test.js
    âââ logger.test.js
    âââ errors.test.js
    âââ validator.test.js
    âââ notion-client.test.js
    âââ task-manager.test.js
```

## Configuration

Configuration is managed through environment variables:

```env
# Required
NOTION_API_KEY=secret_xxx
NOTION_DATABASE_ID=xxx

# Optional
NODE_ENV=development
LOG_LEVEL=info
NOTION_API_VERSION=2022-06-28
```

## Performance Considerations

1. **Retry Logic**: Automatic retry for transient failures with exponential backoff
2. **Connection Pooling**: Reuse of Notion client connections
3. **Lazy Initialization**: Modules initialize only when needed
4. **Efficient Parsing**: Optimized Notion response parsing

## Security Considerations

1. **Environment Variables**: Sensitive data stored in environment variables
2. **Input Validation**: All user input is validated and sanitized
3. **Error Messages**: Error messages don't expose sensitive information
4. **API Key Management**: API keys never logged or exposed

## Extension Points

The architecture supports easy extension:

1. **New Task Properties**: Add property builders in task-manager.js
2. **New Validation Rules**: Add validators in validator.js
3. **Custom Error Types**: Extend AppError class
4. **Additional API Methods**: Extend notion-client.js

## Best Practices for Developers

1. **Always validate input** using the Validator module
2. **Use structured logging** with appropriate log levels
3. **Throw custom errors** instead of generic Error objects
4. **Write tests** for all new functionality
5. **Document public APIs** with JSDoc comments
6. **Handle errors gracefully** using try-catch blocks
7. **Use singleton instances** for shared resources (config, logger, etc.)

## Future Enhancements

Potential areas for enhancement:

1. **Caching Layer**: Cache frequently accessed tasks
2. **Batch Operations**: Support bulk task operations
3. **Webhooks**: React to Notion changes
4. **CLI Interface**: Command-line interface for task management
5. **Additional Databases**: Support multiple Notion databases
6. **Custom Properties**: Support for custom Notion properties
