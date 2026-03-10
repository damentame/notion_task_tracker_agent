# Implementation Guide
## Notion Task Tracker CLI

**Version:** 1.0  
**Date:** March 10, 2026  
**Audience:** Backend/CLI Developers

This guide provides step-by-step instructions for implementing the system architecture.

---

## Table of Contents
1. [Project Setup](#project-setup)
2. [Implementation Phases](#implementation-phases)
3. [Component Implementation Order](#component-implementation-order)
4. [Code Structure](#code-structure)
5. [Testing Strategy](#testing-strategy)
6. [Quality Gates](#quality-gates)

---

## 1. Project Setup

### 1.1 Initialize Project Structure

```bash
# Create directory structure
mkdir -p src/{cli/commands,services,repositories,models,utils,config}
mkdir -p tests/{unit,integration,fixtures}
mkdir -p docs/{api,user-guide}

# Initialize git flow
git checkout -b feature/architecture-implementation
```

### 1.2 Install Dependencies

```bash
# Core dependencies
npm install @notionhq/client@^5.1.0
npm install dotenv@^17.0.0
npm install commander@^12.0.0
npm install chalk@^5.3.0
npm install inquirer@^9.2.0
npm install ora@^7.0.0
npm install conf@^12.0.0
npm install node-cache@^5.1.2
npm install winston@^3.11.0
npm install joi@^17.11.0
npm install date-fns@^3.0.0

# Development dependencies
npm install --save-dev eslint@^8.56.0
npm install --save-dev prettier@^3.1.1
npm install --save-dev jest@^29.7.0
npm install --save-dev nock@^13.5.0
npm install --save-dev husky@^8.0.3
npm install --save-dev lint-staged@^15.2.0
npm install --save-dev @types/node@^20.10.0
```

### 1.3 Configure Development Tools

#### ESLint Configuration (`.eslintrc.json`)
```json
{
  "env": {
    "node": true,
    "es2022": true,
    "jest": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "rules": {
    "no-console": "off",
    "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

#### Prettier Configuration (`.prettierrc`)
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 80,
  "tabWidth": 2
}
```

#### Jest Configuration (`jest.config.js`)
```javascript
export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

---

## 2. Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Set up core infrastructure and utilities

#### Tasks:
1. ✅ Project structure setup
2. ✅ Dependency installation
3. ✅ Configuration management
4. ✅ Error handling framework
5. ✅ Logger implementation
6. ✅ Utility functions

#### Deliverables:
- Working project structure
- Configuration system
- Logging system
- Error classes
- Unit tests for utilities

---

### Phase 2: Data Layer (Week 1-2)
**Goal**: Implement data access and Notion integration

#### Tasks:
1. ✅ Notion client wrapper
2. ✅ NotionRepository implementation
3. ✅ ConfigRepository implementation
4. ✅ CacheRepository implementation
5. ✅ Data mappers
6. ✅ Rate limiter
7. ✅ Retry handler

#### Deliverables:
- Working Notion integration
- Repository pattern implemented
- Integration tests with Notion API
- Mock data for testing

#### Implementation Order:

##### 2.1 Error Classes (`src/utils/errors.js`)
```javascript
export class BaseError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotionAPIError extends BaseError {}
export class ValidationError extends BaseError {}
export class ConfigError extends BaseError {}
export class NetworkError extends BaseError {}
// ... more error classes
```

##### 2.2 Logger (`src/utils/logger.js`)
```javascript
import winston from 'winston';
import { join } from 'path';
import { homedir } from 'os';

const logDir = join(homedir(), '.notion-task-cli', 'logs');

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: join(logDir, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: join(logDir, 'combined.log'),
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
```

##### 2.3 Rate Limiter (`src/utils/rateLimit.js`)
```javascript
export class RateLimiter {
  constructor(requestsPerSecond = 3) {
    this.requestsPerSecond = requestsPerSecond;
    this.interval = 1000 / requestsPerSecond;
    this.lastRequest = 0;
    this.queue = [];
  }

  async acquire() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;

    if (timeSinceLastRequest >= this.interval) {
      this.lastRequest = now;
      return Promise.resolve();
    }

    const delay = this.interval - timeSinceLastRequest;
    return new Promise((resolve) => {
      setTimeout(() => {
        this.lastRequest = Date.now();
        resolve();
      }, delay);
    });
  }
}
```

##### 2.4 Notion Repository (`src/repositories/NotionRepository.js`)
```javascript
import { Client } from '@notionhq/client';
import { logger } from '../utils/logger.js';
import { NotionAPIError } from '../utils/errors.js';

export class NotionRepository {
  constructor(apiKey) {
    this.client = new Client({
      auth: apiKey,
      notionVersion: '2022-06-28',
    });
  }

  async createPage(databaseId, properties) {
    try {
      logger.debug('Creating page', { databaseId });
      const response = await this.client.pages.create({
        parent: { database_id: databaseId },
        properties,
      });
      logger.info('Page created', { pageId: response.id });
      return response;
    } catch (error) {
      logger.error('Failed to create page', { error: error.message });
      throw new NotionAPIError('Failed to create page', { error });
    }
  }

  async updatePage(pageId, properties) {
    try {
      logger.debug('Updating page', { pageId });
      const response = await this.client.pages.update({
        page_id: pageId,
        properties,
      });
      logger.info('Page updated', { pageId });
      return response;
    } catch (error) {
      logger.error('Failed to update page', { error: error.message });
      throw new NotionAPIError('Failed to update page', { error });
    }
  }

  async queryDatabase(databaseId, filter, sorts) {
    try {
      logger.debug('Querying database', { databaseId });
      const response = await this.client.databases.query({
        database_id: databaseId,
        filter,
        sorts,
      });
      logger.info('Database queried', {
        databaseId,
        resultCount: response.results.length,
      });
      return response.results;
    } catch (error) {
      logger.error('Failed to query database', { error: error.message });
      throw new NotionAPIError('Failed to query database', { error });
    }
  }

  async getPage(pageId) {
    try {
      logger.debug('Getting page', { pageId });
      const response = await this.client.pages.retrieve({ page_id: pageId });
      logger.info('Page retrieved', { pageId });
      return response;
    } catch (error) {
      logger.error('Failed to get page', { error: error.message });
      throw new NotionAPIError('Failed to get page', { error });
    }
  }
}
```

---

### Phase 3: Business Logic (Week 2)
**Goal**: Implement service layer with business logic

#### Tasks:
1. ✅ TaskService implementation
2. ✅ ConfigService implementation
3. ✅ CacheService implementation
4. ✅ ValidationService implementation
5. ✅ Data mapping logic
6. ✅ Business rule enforcement

#### Deliverables:
- Service layer complete
- Unit tests for services
- Integration tests
- Business logic validated

##### 3.1 TaskService (`src/services/TaskService.js`)
```javascript
import { logger } from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';

export class TaskService {
  constructor(notionRepository, cacheService, dataMapper) {
    this.notionRepository = notionRepository;
    this.cacheService = cacheService;
    this.dataMapper = dataMapper;
  }

  async createTask(databaseId, taskData) {
    logger.info('Creating task', { title: taskData.title });

    // Validate task data
    this.validateTaskData(taskData);

    // Map to Notion properties
    const properties = this.dataMapper.toNotionProperties(taskData);

    // Create in Notion
    const page = await this.notionRepository.createPage(
      databaseId,
      properties
    );

    // Map to domain model
    const task = this.dataMapper.fromNotionPage(page);

    // Invalidate cache
    await this.cacheService.invalidate('task:list');

    return task;
  }

  async updateTask(pageId, updates) {
    logger.info('Updating task', { pageId });

    // Map to Notion properties
    const properties = this.dataMapper.toNotionProperties(updates);

    // Update in Notion
    const page = await this.notionRepository.updatePage(pageId, properties);

    // Map to domain model
    const task = this.dataMapper.fromNotionPage(page);

    // Invalidate cache
    await this.cacheService.invalidate(`task:${pageId}`);
    await this.cacheService.invalidate('task:list');

    return task;
  }

  async listTasks(databaseId, filter = {}) {
    logger.info('Listing tasks', { filter });

    // Check cache
    const cacheKey = `task:list:${JSON.stringify(filter)}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      logger.debug('Returning cached tasks');
      return cached;
    }

    // Query Notion
    const notionFilter = this.dataMapper.toNotionFilter(filter);
    const pages = await this.notionRepository.queryDatabase(
      databaseId,
      notionFilter
    );

    // Map to domain models
    const tasks = pages.map((page) => this.dataMapper.fromNotionPage(page));

    // Cache results
    await this.cacheService.set(cacheKey, tasks, 300); // 5 min TTL

    return tasks;
  }

  validateTaskData(taskData) {
    if (!taskData.title || taskData.title.trim() === '') {
      throw new ValidationError('Task title is required');
    }
    if (taskData.title.length > 2000) {
      throw new ValidationError('Task title must be less than 2000 characters');
    }
  }
}
```

---

### Phase 4: CLI Layer (Week 2-3)
**Goal**: Implement command-line interface

#### Tasks:
1. ✅ CLI framework setup
2. ✅ Command implementations
3. ✅ Input/output formatting
4. ✅ Interactive prompts
5. ✅ Help documentation
6. ✅ Error display

#### Deliverables:
- Working CLI commands
- User documentation
- Manual testing completed
- Demo-ready application

##### 4.1 Main CLI (`src/cli/index.js`)
```javascript
#!/usr/bin/env node

import { Command } from 'commander';
import { createCommand } from './commands/create.js';
import { updateCommand } from './commands/update.js';
import { listCommand } from './commands/list.js';
import { configCommand } from './commands/config.js';

const program = new Command();

program
  .name('notion-task')
  .description('CLI tool for managing Notion tasks')
  .version('1.0.0');

program.addCommand(createCommand);
program.addCommand(updateCommand);
program.addCommand(listCommand);
program.addCommand(configCommand);

program.parse();
```

##### 4.2 Create Command (`src/cli/commands/create.js`)
```javascript
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { TaskService } from '../../services/TaskService.js';
import { ConfigService } from '../../services/ConfigService.js';
import { NotionRepository } from '../../repositories/NotionRepository.js';

export const createCommand = new Command('create')
  .description('Create a new task')
  .argument('<title>', 'Task title')
  .option('-s, --status <status>', 'Task status', 'To-do')
  .option('-p, --priority <priority>', 'Task priority')
  .option('-d, --due-date <date>', 'Due date (YYYY-MM-DD)')
  .option('-n, --notes <notes>', 'Task notes')
  .option('-t, --tags <tags>', 'Comma-separated tags')
  .action(async (title, options) => {
    const spinner = ora('Creating task...').start();

    try {
      // Load config
      const configService = new ConfigService();
      const config = await configService.load();

      // Initialize services
      const notionRepo = new NotionRepository(config.apiKey);
      const taskService = new TaskService(notionRepo);

      // Parse options
      const taskData = {
        title,
        status: options.status,
        priority: options.priority,
        dueDate: options.dueDate ? new Date(options.dueDate) : null,
        notes: options.notes,
        tags: options.tags ? options.tags.split(',') : [],
      };

      // Create task
      const task = await taskService.createTask(config.databaseId, taskData);

      spinner.succeed(chalk.green('Task created successfully!'));
      console.log(chalk.blue('Task ID:'), task.id);
      console.log(chalk.blue('Title:'), task.title);
      console.log(chalk.blue('Status:'), task.status);
      console.log(chalk.blue('URL:'), task.url);
    } catch (error) {
      spinner.fail(chalk.red('Failed to create task'));
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });
```

---

### Phase 5: Testing & Quality (Week 3)
**Goal**: Comprehensive testing and quality assurance

#### Tasks:
1. ✅ Unit test coverage (>80%)
2. ✅ Integration tests
3. ✅ End-to-end tests
4. ✅ Performance testing
5. ✅ Security audit
6. ✅ Code review

#### Test Structure:

##### Unit Test Example (`tests/unit/services/TaskService.test.js`)
```javascript
import { jest } from '@jest/globals';
import { TaskService } from '../../../src/services/TaskService.js';

describe('TaskService', () => {
  let taskService;
  let mockNotionRepo;
  let mockCacheService;
  let mockDataMapper;

  beforeEach(() => {
    mockNotionRepo = {
      createPage: jest.fn(),
      updatePage: jest.fn(),
      queryDatabase: jest.fn(),
    };

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      invalidate: jest.fn(),
    };

    mockDataMapper = {
      toNotionProperties: jest.fn(),
      fromNotionPage: jest.fn(),
    };

    taskService = new TaskService(
      mockNotionRepo,
      mockCacheService,
      mockDataMapper
    );
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const taskData = { title: 'Test Task' };
      const mockPage = { id: '123', properties: {} };
      const mockTask = { id: '123', title: 'Test Task' };

      mockDataMapper.toNotionProperties.mockReturnValue({});
      mockNotionRepo.createPage.mockResolvedValue(mockPage);
      mockDataMapper.fromNotionPage.mockReturnValue(mockTask);

      const result = await taskService.createTask('db-123', taskData);

      expect(result).toEqual(mockTask);
      expect(mockNotionRepo.createPage).toHaveBeenCalledWith('db-123', {});
      expect(mockCacheService.invalidate).toHaveBeenCalledWith('task:list');
    });

    it('should throw error for empty title', async () => {
      await expect(
        taskService.createTask('db-123', { title: '' })
      ).rejects.toThrow('Task title is required');
    });
  });
});
```

##### Integration Test Example (`tests/integration/notion.test.js`)
```javascript
import { NotionRepository } from '../../src/repositories/NotionRepository.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

describe('Notion Integration', () => {
  let notionRepo;
  const testDatabaseId = process.env.TEST_DATABASE_ID;

  beforeAll(() => {
    notionRepo = new NotionRepository(process.env.NOTION_API_KEY);
  });

  it('should create and retrieve a page', async () => {
    const properties = {
      Task: {
        title: [{ text: { content: 'Integration Test Task' } }],
      },
    };

    const page = await notionRepo.createPage(testDatabaseId, properties);
    expect(page.id).toBeDefined();

    const retrieved = await notionRepo.getPage(page.id);
    expect(retrieved.id).toBe(page.id);
  });
});
```

---

### Phase 6: Documentation & Deployment (Week 3-4)
**Goal**: Complete documentation and deployment setup

#### Tasks:
1. ✅ API documentation
2. ✅ User guide
3. ✅ README updates
4. ✅ npm package configuration
5. ✅ CI/CD pipeline
6. ✅ Release preparation

---

## 3. Component Implementation Order

```
Week 1:
├── Error classes
├── Logger
├── Config management
├── Rate limiter
├── Retry handler
└── Notion client wrapper

Week 2:
├── Repositories (Notion, Config, Cache)
├── Data mappers
├── Services (Task, Config, Cache, Validation)
├── Business logic
└── Unit tests

Week 3:
├── CLI framework
├── Commands (create, update, list, get, delete, config)
├── Output formatters
├── Interactive prompts
├── Integration tests
└── E2E tests

Week 4:
├── Documentation
├── Performance optimization
├── Security audit
├── npm package setup
└── Release
```

---

## 4. Code Structure

### 4.1 Directory Layout
```
src/
├── cli/
│   ├── commands/
│   │   ├── create.js
│   │   ├── update.js
│   │   ├── list.js
│   │   ├── get.js
│   │   ├── delete.js
│   │   └── config.js
│   ├── formatters/
│   │   ├── table.js
│   │   ├── json.js
│   │   └── yaml.js
│   └── index.js
├── services/
│   ├── TaskService.js
│   ├── ConfigService.js
│   ├── CacheService.js
│   └── ValidationService.js
├── repositories/
│   ├── NotionRepository.js
│   ├── ConfigRepository.js
│   └── CacheRepository.js
├── models/
│   ├── Task.js
│   ├── Config.js
│   └── Filter.js
├── utils/
│   ├── logger.js
│   ├── errors.js
│   ├── rateLimit.js
│   ├── retry.js
│   ├── dataMapper.js
│   └── validation.js
├── config/
│   ├── constants.js
│   └── defaults.js
└── index.js
```

---

## 5. Testing Strategy

### 5.1 Test Pyramid
```
        E2E Tests (10%)
        ---------------
       Integration Tests (30%)
      -----------------------
     Unit Tests (60%)
    -----------------------
```

### 5.2 Test Coverage Goals
- **Overall**: 80%+
- **Services**: 90%+
- **Repositories**: 85%+
- **Utilities**: 95%+
- **CLI Commands**: 70%+

### 5.3 Testing Commands
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- TaskService.test.js

# Run in watch mode
npm test -- --watch

# Run integration tests only
npm run test:integration
```

---

## 6. Quality Gates

### 6.1 Pre-Commit Checks
- ✅ Linting (ESLint)
- ✅ Formatting (Prettier)
- ✅ Unit tests pass

### 6.2 Pre-Push Checks
- ✅ All tests pass
- ✅ Coverage thresholds met
- ✅ No security vulnerabilities (npm audit)

### 6.3 Pre-Merge Checks
- ✅ Code review approved
- ✅ Integration tests pass
- ✅ Documentation updated
- ✅ Changelog entry added

### 6.4 Release Checks
- ✅ All tests pass
- ✅ Manual testing completed
- ✅ Performance benchmarks met
- ✅ Security audit passed
- ✅ Documentation complete

---

## 7. Development Workflow

### 7.1 Feature Development
```bash
# 1. Create feature branch
git checkout -b feature/task-creation

# 2. Implement feature with tests
# 3. Run tests locally
npm test

# 4. Commit changes
git add .
git commit -m "feat: implement task creation"

# 5. Push and create PR
git push origin feature/task-creation
```

### 7.2 Code Review Checklist
- [ ] Code follows style guide
- [ ] Tests included and passing
- [ ] Documentation updated
- [ ] No console.log() statements
- [ ] Error handling appropriate
- [ ] Performance considered
- [ ] Security reviewed

---

## 8. Troubleshooting

### Common Issues

#### Issue: "Cannot find module"
**Solution**: Ensure all imports use `.js` extension for ESM

#### Issue: Rate limit errors
**Solution**: Check rate limiter configuration, ensure 3 req/sec limit

#### Issue: API key not found
**Solution**: Run `notion-task config` to set up credentials

#### Issue: Tests failing with "fetch is not defined"
**Solution**: Use Node.js 18+ which includes fetch globally

---

## 9. Performance Optimization

### 9.1 Profiling
```javascript
import { performance } from 'perf_hooks';

const start = performance.now();
// ... operation
const end = performance.now();
console.log(`Operation took ${end - start}ms`);
```

### 9.2 Optimization Targets
- Command response: < 2 seconds
- Cold start: < 1 second
- Memory usage: < 50MB
- Cache hit rate: > 80%

---

## Conclusion

Follow this implementation guide to build the Notion Task Tracker CLI systematically. Each phase builds on the previous one, ensuring a solid foundation for a reliable, maintainable application.

For questions or clarifications, refer to:
- [System Architecture](./SYSTEM_ARCHITECTURE.md)
- [Integration Patterns](./INTEGRATION_PATTERNS.md)
- [Technical Decisions](./TECHNICAL_DECISIONS.md)

---

*Last Updated: March 10, 2026*
