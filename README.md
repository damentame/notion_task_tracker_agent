# Notion Task Manager CLI

CLI tool for managing tasks in Notion databases with automated quality assurance.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your NOTION_API_KEY and NOTION_DATABASE_ID

# Run the tool
npm start

# Run quality checks
npm run quality:check
```

## 📋 Features

- Create tasks in Notion databases
- Update task status
- Automated quality checks and code standards
- Pre-commit hooks for code quality
- CI/CD pipeline integration

## 🛠️ Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Notion API key and database ID

### Setup

```bash
# Install dependencies
npm install

# Install git hooks
npm run prepare
```

### Available Scripts

| Script                   | Description                        |
| ------------------------ | ---------------------------------- |
| `npm start`              | Run the application                |
| `npm test`               | Run tests                          |
| `npm run lint`           | Check code with ESLint             |
| `npm run lint:fix`       | Fix ESLint issues                  |
| `npm run format`         | Format code with Prettier          |
| `npm run format:check`   | Check code formatting              |
| `npm run quality:check`  | Run all quality checks             |
| `npm run quality:fix`    | Fix all auto-fixable issues        |
| `npm run audit:security` | Check for security vulnerabilities |

## 📚 Documentation

- **[Quality Quick Reference](./QUALITY_QUICK_REFERENCE.md)** - Quick reference for daily development
- **[Code Review Guidelines](./CODE_REVIEW_GUIDELINES.md)** - Code review process and standards
- **[Coding Standards](./CODING_STANDARDS.md)** - Detailed coding conventions and best practices
- **[Quality Assurance Framework](./QUALITY_ASSURANCE.md)** - Comprehensive QA documentation

## 🔒 Security

- Never commit `.env` files or API keys
- Use environment variables for sensitive data
- Run `npm audit` regularly to check for vulnerabilities
- Report security issues to the Technical Lead

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes following our [Coding Standards](./CODING_STANDARDS.md)
3. Ensure all quality checks pass: `npm run quality:check`
4. Create a Pull Request using the PR template
5. Wait for code review approval

See [Code Review Guidelines](./CODE_REVIEW_GUIDELINES.md) for detailed process.

## 📝 License

ISC

## 👥 Team

- Product Manager
- Technical Lead
- Backend/CLI Developers (2)
- Quality Assurance

---

For questions or support, contact the Technical Lead.
