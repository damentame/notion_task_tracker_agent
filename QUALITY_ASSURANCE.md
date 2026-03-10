# Quality Assurance Framework

## Overview

This document provides a comprehensive overview of the quality assurance framework established for the Notion Task Manager CLI project. It outlines all quality standards, automated checks, and processes that ensure code maintainability, security, and performance.

## Quick Reference

### Run Quality Checks Locally

```bash
# Check all quality standards
npm run quality:check

# Fix issues automatically
npm run quality:fix

# Individual checks
npm run lint              # Run ESLint
npm run lint:fix          # Fix ESLint issues
npm run format:check      # Check Prettier formatting
npm run format            # Format code with Prettier
npm run audit:security    # Check for security vulnerabilities
npm test                  # Run tests
```

### Pre-commit Hooks

Git hooks are automatically configured via Husky. Before each commit:

- ✅ ESLint checks and fixes staged files
- ✅ Prettier formats staged files
- ❌ Commit is blocked if checks fail

## Documentation

### Core Documents

1. **[Code Review Guidelines](./CODE_REVIEW_GUIDELINES.md)**
   - Code review process and workflow
   - PR submission requirements
   - Feedback guidelines and best practices
   - Approval and merge criteria

2. **[Coding Standards](./CODING_STANDARDS.md)**
   - JavaScript/Node.js conventions
   - Code organization principles
   - Naming conventions
   - Security and performance guidelines
   - Testing standards

## Automated Quality Checks

### 1. Linting (ESLint)

**Configuration:** `eslint.config.js`

**What it checks:**

- Code syntax errors
- Common programming mistakes
- Code complexity (cyclomatic complexity ≤ 10)
- Function length (≤ 50 lines)
- Nesting depth (≤ 3 levels)
- Unused variables
- Consistent code style

**Key Rules:**

- No `var`, use `const`/`let`
- Prefer arrow functions for callbacks
- Require await in async functions
- No magic numbers (use constants)
- Maximum 4 parameters per function
- Always use `===` instead of `==`

**Run:**

```bash
npm run lint        # Check
npm run lint:fix    # Auto-fix
```

### 2. Code Formatting (Prettier)

**Configuration:** `.prettierrc`

**What it enforces:**

- Consistent indentation (2 spaces)
- Line length (80 characters)
- Semicolons usage
- Quote style (double quotes)
- Trailing commas (ES5)
- Line endings (LF)

**Run:**

```bash
npm run format:check  # Check
npm run format        # Auto-fix
```

### 3. Pre-commit Hooks (Husky + lint-staged)

**Configuration:**

- `.husky/pre-commit`
- `.lintstagedrc.json`

**What it does:**

- Runs automatically before each commit
- Only checks staged files (fast)
- Auto-fixes issues when possible
- Blocks commit if unfixable issues exist

**Staged files are checked:**

- `*.js` → ESLint + Prettier
- `*.{json,md,yml,yaml}` → Prettier

### 4. Security Auditing

**Tool:** npm audit

**What it checks:**

- Known vulnerabilities in dependencies
- Severity levels: low, moderate, high, critical
- Blocks on moderate and above

**Run:**

```bash
npm run audit:security
```

**Update vulnerable dependencies:**

```bash
npm audit fix
```

### 5. CI/CD Quality Gates

**Configuration:** `.github/workflows/quality-checks.yml`

**Automated on:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Pipeline Jobs:**

1. **Lint and Format Check**
   - Runs ESLint
   - Checks Prettier formatting
   - ❌ Fails pipeline if issues found

2. **Security Audit**
   - Runs `npm audit`
   - ❌ Fails on moderate+ vulnerabilities

3. **Tests**
   - Runs test suite
   - Uploads coverage reports
   - ❌ Fails if tests don't pass

4. **Build Verification**
   - Verifies code builds successfully
   - ❌ Fails if build errors

5. **Quality Gate**
   - All above jobs must pass
   - ❌ Blocks PR merge if any job fails

## Quality Metrics & Standards

### Measurable Targets

| Metric                   | Target            | Tool                     |
| ------------------------ | ----------------- | ------------------------ |
| Test Coverage            | ≥ 80%             | Jest (to be implemented) |
| Linting Errors           | 0                 | ESLint                   |
| Code Smells              | 0 High/Critical   | Manual Review            |
| Cyclomatic Complexity    | ≤ 10 per function | ESLint                   |
| Function Length          | ≤ 50 lines        | ESLint                   |
| Nesting Depth            | ≤ 3 levels        | ESLint                   |
| Security Vulnerabilities | 0 High/Critical   | npm audit                |
| Code Formatting          | 100% compliant    | Prettier                 |

### Code Review Requirements

**Mandatory:**

- ✅ Minimum 1 approval
- ✅ All automated checks passing
- ✅ No merge conflicts
- ✅ All blocking comments resolved
- ✅ Up to date with target branch

**Best Practices:**

- Keep PRs < 400 lines
- Write descriptive PR descriptions
- Link to related issues
- Include examples/screenshots for CLI changes
- Respond to feedback within 24 hours

## Team Roles & Responsibilities

### Technical Lead

- Define and maintain quality standards
- Review all architecture-related changes
- Mentor team on best practices
- Approve critical PRs

### Backend/CLI Developers

- Follow coding standards
- Write tests for new features
- Participate in code reviews
- Fix quality issues promptly

### Quality Assurance

- Validate quality metrics
- Report quality issues
- Suggest improvements to standards
- Verify automated checks are effective

## Development Workflow

### 1. Before You Start

```bash
# Ensure dependencies are up to date
npm install

# Verify your environment
npm run quality:check
```

### 2. During Development

```bash
# Run linting as you code (use IDE integration)
npm run lint

# Format on save (configure your editor)
# Or format manually:
npm run format
```

### 3. Before Committing

Pre-commit hooks run automatically, but you can check manually:

```bash
# Run all quality checks
npm run quality:check

# Fix issues automatically
npm run quality:fix
```

### 4. Before Creating PR

```bash
# Ensure everything passes
npm run quality:check
npm run audit:security
npm test

# Pull latest changes
git pull origin main

# Resolve conflicts if any
```

### 5. After PR Feedback

```bash
# Make requested changes
# Re-run quality checks
npm run quality:check

# Commit and push
git add .
git commit -m "[FIX] Address code review feedback"
git push
```

## IDE Integration

### VS Code (Recommended)

**Extensions:**

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- EditorConfig (`editorconfig.editorconfig`)

**Settings (`.vscode/settings.json`):**

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript"],
  "files.eol": "\n"
}
```

### Other IDEs

Most modern IDEs support ESLint, Prettier, and EditorConfig. Configure your IDE to:

- Use project's ESLint configuration
- Format with Prettier on save
- Respect `.editorconfig` settings

## Troubleshooting

### Pre-commit hook not running

```bash
# Reinstall Husky
npm run prepare
```

### ESLint errors in IDE but not CLI

```bash
# Restart your IDE
# Ensure IDE is using project's ESLint, not global
# Check IDE ESLint extension settings
```

### Prettier conflicts with ESLint

This shouldn't happen as we use `eslint-config-prettier`. If it does:

```bash
# Verify eslint-config-prettier is in eslint.config.js
# Run quality:fix to auto-resolve
npm run quality:fix
```

### npm audit shows vulnerabilities

```bash
# Try automatic fix
npm audit fix

# For breaking changes, manually update
npm update [package-name]

# Check if vulnerability is in dev dependencies
# (less critical, but still should be fixed)
```

## Continuous Improvement

### Regular Reviews

- **Weekly:** Check quality metrics dashboard
- **Monthly:** Review and update standards based on team feedback
- **Quarterly:** Evaluate new tools and practices

### Feedback Channels

- Team retrospectives
- PR comments
- Direct feedback to Technical Lead
- GitHub Issues for tooling improvements

### Updating Standards

1. Propose changes in team meeting
2. Create PR updating relevant documentation
3. Get team consensus
4. Update automated tooling accordingly
5. Communicate changes to entire team

## Resources

### Internal Documentation

- [Code Review Guidelines](./CODE_REVIEW_GUIDELINES.md)
- [Coding Standards](./CODING_STANDARDS.md)
- [Project README](./README.md)

### External Resources

- [ESLint Rules](https://eslint.org/docs/latest/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Support

If you have questions or issues with quality tooling:

1. Check this documentation
2. Review specific tool documentation (ESLint, Prettier)
3. Ask in team chat
4. Contact Technical Lead

---

_Last Updated: March 10, 2026_
_Owner: Technical Lead_
_Version: 1.0_
