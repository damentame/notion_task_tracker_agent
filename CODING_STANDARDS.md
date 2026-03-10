# Coding Standards & Quality Guidelines

## Overview

This document defines the coding conventions, quality standards, and best practices for the Notion Task Manager CLI project. These standards ensure code maintainability, security, and consistency across the team.

## Table of Contents

1. [General Principles](#general-principles)
2. [JavaScript/Node.js Standards](#javascriptnodejs-standards)
3. [Code Organization](#code-organization)
4. [Naming Conventions](#naming-conventions)
5. [Documentation](#documentation)
6. [Error Handling](#error-handling)
7. [Security Standards](#security-standards)
8. [Performance Guidelines](#performance-guidelines)
9. [Testing Standards](#testing-standards)
10. [Git Practices](#git-practices)

---

## General Principles

### Core Values

1. **Readability over Cleverness:** Write code that is easy to understand
2. **Simplicity over Complexity:** Choose the simplest solution that works
3. **Consistency:** Follow established patterns in the codebase
4. **Maintainability:** Write code that is easy to modify and extend
5. **Security First:** Always consider security implications

### Code Review Philosophy

- Code is read 10x more than it's written
- Optimize for the next developer (including future you)
- If it needs a comment to explain, consider refactoring first
- Every line of code is a liability to maintain

---

## JavaScript/Node.js Standards

### General JavaScript Style

**ES Modules:**

```javascript
// ✅ Good: Use ES6 import/export
import { Client } from "@notionhq/client";
export async function createTask() {}

// ❌ Bad: Don't use CommonJS in new code
const { Client } = require("@notionhq/client");
module.exports = { createTask };
```

**Variable Declaration:**

```javascript
// ✅ Good: Use const by default, let when reassignment needed
const apiKey = process.env.NOTION_API_KEY;
let retryCount = 0;

// ❌ Bad: Don't use var
var apiKey = process.env.NOTION_API_KEY;
```

**Arrow Functions:**

```javascript
// ✅ Good: Use arrow functions for callbacks and short functions
const numbers = [1, 2, 3].map(n => n * 2);
const add = (a, b) => a + b;

// ✅ Good: Use regular functions for methods and when 'this' binding matters
class TaskManager {
  async createTask(title) {
    // method body
  }
}
```

**Async/Await:**

```javascript
// ✅ Good: Use async/await for asynchronous code
async function fetchTask(id) {
  try {
    const response = await notion.pages.retrieve({ page_id: id });
    return response;
  } catch (error) {
    handleError(error);
  }
}

// ❌ Bad: Avoid nested promises when possible
function fetchTask(id) {
  return notion.pages
    .retrieve({ page_id: id })
    .then(response => {
      return response;
    })
    .catch(error => {
      handleError(error);
    });
}
```

**Destructuring:**

```javascript
// ✅ Good: Use destructuring for clarity
const { title, status, assignee } = task.properties;
const [firstTask, ...remainingTasks] = tasks;

// ❌ Avoid: Repeated property access
const title = task.properties.title;
const status = task.properties.status;
const assignee = task.properties.assignee;
```

**Template Literals:**

```javascript
// ✅ Good: Use template literals for string interpolation
const message = `Task "${title}" assigned to ${assignee}`;

// ❌ Bad: String concatenation
const message = 'Task "' + title + '" assigned to ' + assignee;
```

### Code Quality Rules

**Function Length:**

- Functions should be < 50 lines
- If longer, consider extracting helper functions
- Each function should do one thing well

**File Length:**

- Files should be < 300 lines
- Split large files into multiple modules

**Cyclomatic Complexity:**

- Maximum complexity of 10 per function
- Reduce nested conditionals

**Nesting Depth:**

- Maximum 3 levels of nesting
- Use early returns to reduce nesting

```javascript
// ✅ Good: Early returns reduce nesting
async function processTask(taskId) {
  if (!taskId) {
    throw new Error("Task ID is required");
  }

  const task = await fetchTask(taskId);
  if (!task) {
    throw new Error("Task not found");
  }

  return await updateTask(task);
}

// ❌ Bad: Deep nesting
async function processTask(taskId) {
  if (taskId) {
    const task = await fetchTask(taskId);
    if (task) {
      return await updateTask(task);
    } else {
      throw new Error("Task not found");
    }
  } else {
    throw new Error("Task ID is required");
  }
}
```

---

## Code Organization

### Project Structure

```
notion-task-manager/
├── src/
│   ├── api/           # API integration layer
│   ├── commands/      # CLI command handlers
│   ├── config/        # Configuration management
│   ├── models/        # Data models and types
│   ├── services/      # Business logic
│   ├── utils/         # Utility functions
│   └── index.js       # Entry point
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── docs/              # Documentation
├── .github/           # GitHub workflows
└── scripts/           # Build/deployment scripts
```

### Module Organization

**Single Responsibility:**

- Each module should have one clear purpose
- Group related functionality

**Imports Organization:**

```javascript
// 1. Node.js built-in modules
import fs from "fs";
import path from "path";

// 2. External dependencies
import { Client } from "@notionhq/client";
import dotenv from "dotenv";

// 3. Internal modules (absolute paths)
import { validateTask } from "./utils/validation.js";
import { logger } from "./utils/logger.js";

// 4. Type imports (if using TypeScript)
// import type { Task } from "./models/task.js";
```

---

## Naming Conventions

### General Rules

- Use descriptive, meaningful names
- Avoid abbreviations unless widely understood
- Names should reveal intent

### Variables and Functions

```javascript
// ✅ Good: Descriptive names
const notionApiKey = process.env.NOTION_API_KEY;
const tasksByStatus = groupTasksByStatus(tasks);
async function fetchTaskById(taskId) {}

// ❌ Bad: Unclear abbreviations
const nApiKey = process.env.NOTION_API_KEY;
const tbs = groupTasksByStatus(tasks);
async function ftbi(tid) {}
```

### Naming Convention Rules

| Type               | Convention       | Example                            |
| ------------------ | ---------------- | ---------------------------------- |
| Variables          | camelCase        | `taskCount`, `isActive`            |
| Functions          | camelCase        | `createTask()`, `validateInput()`  |
| Classes            | PascalCase       | `TaskManager`, `NotionClient`      |
| Constants          | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_TIMEOUT`       |
| Private properties | \_camelCase      | `_internalState`                   |
| Files              | kebab-case       | `task-manager.js`, `notion-api.js` |

### Boolean Naming

```javascript
// ✅ Good: Use prefixes that imply boolean
const isActive = true;
const hasPermission = false;
const canEdit = true;
const shouldRetry = false;

// ❌ Bad: Ambiguous names
const active = true;
const permission = false;
```

### Function Naming

```javascript
// ✅ Good: Verbs for functions
function createTask() {}
function validateInput() {}
function fetchTaskList() {}

// ✅ Good: get/set for accessors
function getStatus() {}
function setStatus(status) {}

// ✅ Good: is/has for boolean returns
function isValid() {}
function hasPermission() {}
```

---

## Documentation

### Code Comments

**When to Comment:**

- Complex algorithms or business logic
- Non-obvious decisions or workarounds
- Public API documentation
- TODO/FIXME notes with owner and date

**When NOT to Comment:**

- Don't state the obvious
- Don't comment bad code, refactor it
- Don't leave commented-out code

```javascript
// ❌ Bad: Obvious comment
// Set the status to "Done"
task.status = "Done";

// ✅ Good: Explains why
// Status must be set before notification to prevent race condition
task.status = "Done";
await notifyAssignee(task);

// ✅ Good: Documents workaround
// Notion API returns null for empty rich_text, normalize to empty string
const notes = task.properties.Notes?.rich_text?.[0]?.text?.content || "";

// ✅ Good: TODO with owner and context
// TODO(tech-lead, 2026-03-15): Implement retry logic for rate limiting
```

### JSDoc Comments

Use JSDoc for public functions and modules:

```javascript
/**
 * Creates a new task in the Notion database
 *
 * @param {string} title - The task title
 * @param {string} [assignedTo] - Person assigned to the task (optional)
 * @param {string} [notes] - Additional notes (optional)
 * @returns {Promise<string>} The created task ID
 * @throws {Error} If API request fails or validation fails
 *
 * @example
 * const taskId = await createTask("Fix bug", "john@example.com", "High priority");
 */
export async function createTask(title, assignedTo, notes = "") {
  // implementation
}
```

---

## Error Handling

### Error Handling Strategy

**Always Handle Errors:**

```javascript
// ✅ Good: Comprehensive error handling
async function createTask(title) {
  if (!title || title.trim() === "") {
    throw new Error("Task title is required");
  }

  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        /* ... */
      },
    });
    return response.id;
  } catch (error) {
    // Log with context
    logger.error("Failed to create task", {
      title,
      error: error.message,
      code: error.code,
    });

    // Throw user-friendly error
    throw new Error(`Unable to create task: ${error.message}`);
  }
}

// ❌ Bad: Silent failures
async function createTask(title) {
  try {
    const response = await notion.pages.create(/* ... */);
    return response.id;
  } catch (error) {
    console.log("Error");
  }
}
```

### Error Types

```javascript
// ✅ Good: Custom error classes for different scenarios
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

class NotionApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "NotionApiError";
    this.statusCode = statusCode;
  }
}

// Usage
if (!taskId) {
  throw new ValidationError("Task ID is required");
}
```

### Logging

```javascript
// ✅ Good: Structured logging with context
logger.info("Task created", { taskId, title, assignee });
logger.error("API request failed", {
  endpoint: "/pages/create",
  statusCode: error.statusCode,
  message: error.message,
});

// ❌ Bad: Unstructured logging
console.log("Task created " + taskId);
console.error(error);
```

---

## Security Standards

### Environment Variables

```javascript
// ✅ Good: Validate required environment variables at startup
function validateConfig() {
  const required = ["NOTION_API_KEY", "NOTION_DATABASE_ID"];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

// ❌ Bad: Fail later during runtime
const notion = new Client({ auth: process.env.NOTION_API_KEY });
```

### Sensitive Data

```javascript
// ✅ Good: Never log sensitive data
logger.error("Authentication failed", {
  endpoint: url,
  statusCode: response.status,
  // DO NOT log API keys, tokens, passwords
});

// ❌ Bad: Logging sensitive information
console.error("Error:", error.response); // May contain API keys
```

### Input Validation

```javascript
// ✅ Good: Validate and sanitize all inputs
function validateTitle(title) {
  if (typeof title !== "string") {
    throw new ValidationError("Title must be a string");
  }

  if (title.length > 2000) {
    throw new ValidationError("Title must be less than 2000 characters");
  }

  return title.trim();
}

// ❌ Bad: Trusting user input
async function createTask(title) {
  await notion.pages.create({
    properties: { Task: { title: [{ text: { content: title } }] } },
  });
}
```

### Dependency Security

- Run `npm audit` regularly
- Update dependencies with security patches promptly
- Review dependencies before adding
- Use `npm ci` in CI/CD for reproducible builds

---

## Performance Guidelines

### API Efficiency

```javascript
// ✅ Good: Batch operations when possible
async function updateMultipleTasks(taskIds, status) {
  const promises = taskIds.map(id => updateTask(id, status));
  return await Promise.all(promises);
}

// ❌ Bad: Sequential operations
async function updateMultipleTasks(taskIds, status) {
  for (const id of taskIds) {
    await updateTask(id, status);
  }
}
```

### Rate Limiting

```javascript
// ✅ Good: Implement rate limiting for API calls
import pLimit from "p-limit";

const limit = pLimit(3); // Max 3 concurrent requests

async function bulkCreateTasks(tasks) {
  return await Promise.all(tasks.map(task => limit(() => createTask(task))));
}
```

### Resource Management

```javascript
// ✅ Good: Clean up resources
async function processLargeDataset(filePath) {
  const stream = fs.createReadStream(filePath);

  try {
    // Process stream
  } finally {
    stream.destroy();
  }
}
```

---

## Testing Standards

### Test Structure

```javascript
// ✅ Good: Clear test structure (Arrange, Act, Assert)
describe("createTask", () => {
  it("should create a task with valid title", async () => {
    // Arrange
    const title = "Test Task";
    const mockResponse = { id: "task-123" };
    notion.pages.create = jest.fn().mockResolvedValue(mockResponse);

    // Act
    const result = await createTask(title);

    // Assert
    expect(result).toBe("task-123");
    expect(notion.pages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          Task: { title: [{ text: { content: title } }] },
        }),
      })
    );
  });

  it("should throw error for empty title", async () => {
    await expect(createTask("")).rejects.toThrow("title is required");
  });
});
```

### Test Coverage Goals

- **Unit Tests:** 80%+ coverage for business logic
- **Integration Tests:** Critical paths and API integrations
- **Edge Cases:** Null, undefined, empty strings, boundary values

---

## Git Practices

### Commit Messages

**Format:**

```
[TYPE] Brief description (50 chars or less)

More detailed explanation if needed (wrap at 72 chars).
Explain the problem this commit solves and why this
approach was chosen.

Fixes #123
```

**Types:**

- `FEAT`: New feature
- `FIX`: Bug fix
- `REFACTOR`: Code refactoring
- `DOCS`: Documentation
- `TEST`: Tests
- `CHORE`: Maintenance (dependencies, config)
- `PERF`: Performance improvement

**Examples:**

```
[FEAT] Add task filtering by assignee

[FIX] Handle null values in task properties
Notion API returns null for empty rich_text fields.
Added null checks and default values.

Fixes #45

[REFACTOR] Extract validation logic into separate module
```

### Branch Naming

```
<type>/<short-description>

Examples:
feature/task-filtering
fix/api-error-handling
refactor/task-service
docs/update-readme
```

---

## Quality Metrics

### Measurable Standards

| Metric                   | Target            | Tool          |
| ------------------------ | ----------------- | ------------- |
| Test Coverage            | ≥ 80%             | Jest          |
| Linting Errors           | 0                 | ESLint        |
| Code Smells              | 0 High/Critical   | SonarQube     |
| Cyclomatic Complexity    | ≤ 10 per function | ESLint        |
| Duplicate Code           | < 3%              | SonarQube     |
| Security Vulnerabilities | 0 High/Critical   | npm audit     |
| Documentation            | All public APIs   | Manual review |

---

## Enforcement

### Automated Checks

All standards are enforced through:

1. **Pre-commit hooks:** Linting and formatting
2. **CI/CD pipeline:** Tests, security scans, build verification
3. **Code review:** Manual verification of standards
4. **Quality gates:** Block merge if standards not met

### Configuration Files

- `.eslintrc.json` - Linting rules
- `.prettierrc` - Formatting rules
- `.editorconfig` - Editor settings
- `jest.config.js` - Testing configuration

---

## Resources

- [Code Review Guidelines](./CODE_REVIEW_GUIDELINES.md)
- [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)

---

_Last Updated: March 10, 2026_
_Owner: Technical Lead_
