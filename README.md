# Notion Task Manager

A robust, well-architected Node.js library for managing tasks in Notion with comprehensive error handling, validation, and logging.

## Features

- **Modular Architecture**: Clean separation of concerns with well-defined core modules
- **Comprehensive Error Handling**: Custom error types with centralized error management
- **Input Validation**: Robust validation for all user inputs and API data
- **Structured Logging**: Multi-level logging with metadata support
- **Notion API Integration**: Simplified wrapper with retry logic and error handling
- **High Test Coverage**: >97% code coverage with comprehensive unit tests
- **Well Documented**: Complete API reference and architecture documentation

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the project root:

```env
# Required
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_database_id

# Optional
NODE_ENV=development
LOG_LEVEL=info
NOTION_API_VERSION=2022-06-28
```

## Quick Start

```javascript
import { taskManager, logger } from './src/index.js';

// Create a task
const task = await taskManager.createTask({
  title: 'Complete project documentation',
  notes: 'Add README and API docs',
});

logger.info('Task created', { id: task.id });

// Update task status
await taskManager.updateTaskStatus(task.id, 'Done');

// List tasks
const tasks = await taskManager.listTasks({ status: 'To-do' });
console.log(`Found ${tasks.length} tasks`);
```

## Core Modules

- **Config**: Environment-based configuration management
- **Logger**: Structured logging with multiple levels
- **Errors**: Custom error types and centralized error handling
- **Validator**: Input validation and sanitization
- **Notion Client**: Notion API wrapper with retry logic
- **Task Manager**: High-level task management operations

## Documentation

- **[Architecture Guide](./docs/ARCHITECTURE.md)**: System design and patterns
- **[API Reference](./docs/API_REFERENCE.md)**: Complete API documentation
- **[Documentation Index](./docs/README.md)**: Documentation overview

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Code Quality

- **Test Coverage**: >97% overall coverage
- **JSDoc Documentation**: All public APIs documented
- **Error Handling**: Comprehensive error handling throughout
- **Input Validation**: All inputs validated and sanitized

## Project Structure

```
.
âââ src/
â   âââ core/
â   â   âââ config.js          # Configuration management
â   â   âââ logger.js          # Structured logging
â   â   âââ errors.js          # Error handling
â   â   âââ validator.js       # Input validation
â   â   âââ notion-client.js   # Notion API wrapper
â   â   âââ task-manager.js    # Task business logic
â   â   âââ index.js           # Module exports
â   âââ index.js               # Main entry point
âââ test/
â   âââ unit/                  # Unit tests
âââ docs/
â   âââ ARCHITECTURE.md        # Architecture documentation
â   âââ API_REFERENCE.md       # API reference
â   âââ README.md              # Documentation index
âââ package.json
âââ README.md
```

## Development

### Best Practices

1. Always validate input using the Validator module
2. Use structured logging with appropriate log levels
3. Throw custom errors instead of generic Error objects
4. Write tests for all new functionality
5. Document public APIs with JSDoc comments

### Adding New Features

1. Follow the established architecture patterns
2. Add comprehensive tests
3. Update documentation
4. Ensure code coverage remains >80%

## License

ISC
