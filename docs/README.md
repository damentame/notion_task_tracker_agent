# Documentation

Complete documentation for the Notion Task Manager core modules.

## Documents

### [Architecture Documentation](./ARCHITECTURE.md)
Comprehensive overview of the system architecture, design principles, and module structure.

**Contents**:
- Architecture principles
- Module structure and responsibilities
- Data flow diagrams
- Error handling flow
- Testing strategy
- Configuration guide
- Security considerations
- Best practices

### [API Reference](./API_REFERENCE.md)
Complete API documentation for all core modules with examples.

**Contents**:
- Config Module API
- Logger Module API
- Error Handler Module API
- Validator Module API
- Notion Client Module API
- Task Manager Module API
- Usage examples

## Quick Start

1. **Read the Architecture Documentation** to understand the system design
2. **Reference the API Documentation** when implementing features
3. **Follow the Best Practices** outlined in the architecture guide
4. **Write Tests** for all new functionality

## Module Overview

```
Core Modules:
âââ config.js          - Configuration management
âââ logger.js          - Structured logging
âââ errors.js          - Error handling
âââ validator.js       - Input validation
âââ notion-client.js   - Notion API wrapper
âââ task-manager.js    - Task business logic
```

## Testing

All core modules have comprehensive unit tests with >80% code coverage.

Run tests:
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

## Code Quality

The codebase follows these standards:
- Comprehensive JSDoc documentation
- Consistent error handling
- Input validation at all entry points
- Structured logging
- High test coverage
- Clear separation of concerns

## Contributing

When adding new features:

1. Follow the established architecture patterns
2. Add comprehensive tests
3. Document public APIs with JSDoc
4. Update relevant documentation
5. Ensure tests pass and coverage remains high

## Support

For questions or issues:
1. Check the Architecture Documentation for design patterns
2. Refer to the API Reference for method signatures
3. Review existing tests for usage examples
