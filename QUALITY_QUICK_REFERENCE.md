# Quality Standards - Quick Reference

## 🚀 Quick Start

```bash
# Install dependencies (first time)
npm install

# Check code quality
npm run quality:check

# Fix issues automatically
npm run quality:fix
```

## 📋 Essential Commands

| Command                  | Description                        |
| ------------------------ | ---------------------------------- |
| `npm run lint`           | Check code with ESLint             |
| `npm run lint:fix`       | Fix ESLint issues automatically    |
| `npm run format`         | Format code with Prettier          |
| `npm run format:check`   | Check if code is formatted         |
| `npm run quality:check`  | Run all quality checks             |
| `npm run quality:fix`    | Fix all auto-fixable issues        |
| `npm run audit:security` | Check for security vulnerabilities |
| `npm test`               | Run test suite                     |

## 📝 Pre-Commit Checklist

Before committing, ensure:

- [ ] Code is properly formatted (`npm run format`)
- [ ] No linting errors (`npm run lint`)
- [ ] All tests pass (`npm test`)
- [ ] No security vulnerabilities (`npm run audit:security`)
- [ ] Self-review completed
- [ ] No debug code left behind

## 🔍 Pre-PR Checklist

Before creating a Pull Request:

- [ ] All pre-commit checks pass
- [ ] PR title follows format: `[TYPE] Brief description`
- [ ] PR description is complete (What/Why/How)
- [ ] Tests added/updated for changes
- [ ] Documentation updated
- [ ] Breaking changes documented
- [ ] Related issues linked

## 📐 Code Quality Standards

### Function Complexity

- **Max cyclomatic complexity:** 10
- **Max function length:** 50 lines
- **Max nesting depth:** 3 levels
- **Max parameters:** 4

### File Standards

- **Max file length:** 300 lines
- Use ES6+ features (const, let, arrow functions)
- No `var`, prefer `const`
- Use template literals for strings

### Naming Conventions

| Type      | Convention       | Example           |
| --------- | ---------------- | ----------------- |
| Variables | camelCase        | `taskCount`       |
| Functions | camelCase        | `createTask()`    |
| Classes   | PascalCase       | `TaskManager`     |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`     |
| Files     | kebab-case       | `task-manager.js` |

## 🔒 Security Rules

- ✅ Never commit API keys or secrets
- ✅ Use environment variables for credentials
- ✅ Validate and sanitize all inputs
- ✅ Never log sensitive information
- ✅ Run `npm audit` regularly

## ✍️ Commit Message Format

```
[TYPE] Brief description (50 chars or less)

More detailed explanation if needed (wrap at 72 chars).

Fixes #123
```

**Types:** FEAT, FIX, REFACTOR, DOCS, TEST, CHORE, PERF

## 👀 Code Review Standards

### Required for Merge

- ✅ Minimum 1 approval
- ✅ All CI checks passing
- ✅ No merge conflicts
- ✅ All comments resolved

### Review Response Time

- **Target:** 24 hours
- **Priority 0 (Critical):** 4 hours
- **Priority 1 (High):** 12 hours

## 🛠️ IDE Setup (VS Code)

**Required Extensions:**

- ESLint
- Prettier
- EditorConfig

**Settings:**

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## 🚨 Common Issues & Fixes

### Pre-commit hook not working

```bash
npm run prepare
```

### Linting errors

```bash
npm run lint:fix
```

### Format issues

```bash
npm run format
```

### Security vulnerabilities

```bash
npm audit fix
```

## 📚 Full Documentation

- [Code Review Guidelines](./CODE_REVIEW_GUIDELINES.md) - Complete review process
- [Coding Standards](./CODING_STANDARDS.md) - Detailed coding conventions
- [Quality Assurance](./QUALITY_ASSURANCE.md) - Comprehensive QA framework

## 💡 Tips

1. **Run quality checks often** - Don't wait until commit time
2. **Use IDE integration** - Format and lint as you type
3. **Keep PRs small** - Aim for < 400 lines
4. **Write meaningful commits** - Future you will thank you
5. **Review your own code first** - Catch issues before others do

---

_Quick reference for daily development. See full docs for details._
