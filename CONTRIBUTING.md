# Contributing to Notion Task Tracker CLI

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## 🌟 Ways to Contribute

- **Report bugs** - Help us identify and fix issues
- **Suggest features** - Share ideas for improvements
- **Improve documentation** - Make it easier for others to use the tool
- **Write code** - Implement new features or fix bugs
- **Share use cases** - Help others learn from your experience
- **Spread the word** - Star the repo, write blog posts, tweet about it

## 🐛 Reporting Bugs

Before creating a bug report, please:

1. **Search existing issues** to avoid duplicates
2. **Use the latest version** to ensure the bug hasn't been fixed
3. **Gather information** about your environment and how to reproduce the issue

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Run command '...'
2. See error '...'

**Expected behavior**
What you expected to happen.

**Environment:**
- OS: [e.g., macOS 13.2, Ubuntu 22.04]
- Node.js version: [e.g., 18.15.0]
- CLI version: [e.g., 1.0.0]

**Additional context**
Any other relevant information.
```

## 💡 Suggesting Features

We love feature ideas! Please:

1. **Check existing feature requests** to see if it's already suggested
2. **Describe the use case** - why is this feature needed?
3. **Provide examples** of how it would work
4. **Consider implementation** - is it feasible?

### Feature Request Template

```markdown
**Feature Description**
A clear description of the feature.

**Use Case**
Why is this feature needed? What problem does it solve?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
Are there other ways to achieve the same goal?

**Additional Context**
Mockups, examples, or references to similar features.
```

## 🔧 Development Setup

### Prerequisites

- Node.js 18 or higher
- npm 8 or higher
- Git
- A Notion account with API access

### Getting Started

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/notion-task-tracker-cli.git
   cd notion-task-tracker-cli
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   # Copy example env file
   cp .env.example .env
   
   # Add your Notion credentials
   # NOTION_API_KEY=secret_xxx
   # NOTION_DATABASE_ID=xxx
   ```

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Make your changes**
   - Write code
   - Add tests
   - Update documentation

6. **Test your changes**
   ```bash
   npm test
   npm run lint
   ```

7. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add feature: description"
   ```

8. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

9. **Open a Pull Request**
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template

## 📝 Coding Guidelines

### Style Guide

- **JavaScript Standard Style** - We follow standard.js conventions
- **ES6+ Features** - Use modern JavaScript features
- **Clear naming** - Use descriptive variable and function names
- **Comments** - Explain *why*, not *what* (code should be self-explanatory)

### Code Structure

```javascript
// Good: Clear, descriptive function names
async function createNotionTask(title, status, notes) {
  // Implementation
}

// Bad: Unclear, abbreviated names
async function crt(t, s, n) {
  // Implementation
}
```

### Error Handling

```javascript
// Good: Proper error handling with user-friendly messages
try {
  const response = await notion.pages.create(params);
  return response;
} catch (error) {
  console.error('Failed to create task:', error.message);
  throw new Error('Unable to create task. Please check your credentials and database ID.');
}

// Bad: Silent failures or unclear errors
try {
  const response = await notion.pages.create(params);
  return response;
} catch (error) {
  // Nothing happens
}
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write tests for new features
- Ensure tests pass before submitting PR
- Aim for >80% code coverage
- Test both success and error cases

Example test:

```javascript
describe('createTask', () => {
  it('should create a task with valid parameters', async () => {
    const taskId = await createTask('Test task', 'To-do', 'Test notes');
    expect(taskId).toBeDefined();
    expect(typeof taskId).toBe('string');
  });

  it('should handle errors gracefully', async () => {
    // Test error scenarios
  });
});
```

## 📚 Documentation

### When to Update Documentation

- Adding new features
- Changing existing behavior
- Fixing bugs that affect usage
- Improving setup or configuration

### Documentation Checklist

- [ ] Update README.md if needed
- [ ] Update relevant guides in docs/
- [ ] Add code comments for complex logic
- [ ] Update CHANGELOG.md
- [ ] Include examples of new features

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation is updated
- [ ] Commit messages are clear
- [ ] Branch is up to date with main

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Code follows style guide
- [ ] No breaking changes (or documented)

## Related Issues
Closes #123
```

### Review Process

1. Automated checks run (CI/CD)
2. Maintainers review code
3. Feedback addressed
4. PR approved and merged

### What to Expect

- Initial response within 48 hours
- Reviews may take 3-7 days
- Be patient and responsive to feedback
- Not all PRs will be merged (we'll explain why)

## 🎯 Good First Issues

New to the project? Look for issues tagged with:
- `good first issue` - Great for newcomers
- `help wanted` - We need help with these
- `documentation` - Improve docs

## 💬 Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Give constructive feedback
- Assume good intentions
- No harassment or discrimination

### Communication

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and ideas
- **Pull Requests** - Code contributions

### Best Practices

- Search before posting
- Provide context and details
- Be patient and kind
- Thank contributors
- Celebrate successes

## 📋 Commit Message Guidelines

### Format

```
type(scope): brief description

Longer description if needed.

Fixes #123
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Good commit messages
feat(cli): add task filtering by status
fix(api): handle invalid database ID error
docs(readme): update installation instructions

# Bad commit messages
update stuff
fixes
changed things
```

## 🏆 Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Special shout-outs for major contributions

## 📞 Questions?

- Open a [Discussion](https://github.com/your-org/notion-task-tracker-cli/discussions)
- Ask in an existing Issue
- Reach out to maintainers

---

**Thank you for contributing! 🙌**

Your time and effort help make this tool better for everyone.
