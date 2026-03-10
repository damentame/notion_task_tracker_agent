# Notion Task Tracker CLI

> **Automate Your Notion Workflow from the Command Line**

[![npm version](https://img.shields.io/npm/v/notion-task-tracker-cli.svg)](https://www.npmjs.com/package/notion-task-tracker-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js CI](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

A lightweight, developer-friendly CLI tool for managing Notion tasks directly from your terminal. Perfect for automation, CI/CD pipelines, and staying in flow without context switching.

## 🚀 Quick Start

```bash
# Install via npm
npm install -g notion-task-tracker-cli

# Configure with your Notion credentials
export NOTION_API_KEY="your_api_key_here"
export NOTION_DATABASE_ID="your_database_id_here"

# Create your first task
notion-task create "Deploy new feature" --status "To-do" --notes "Ready for production"

# Update task status
notion-task update <task-id> --status "Done"
```

**⏱️ Get started in under 5 minutes** - [See detailed setup guide](#installation)

## ✨ Features

- **🖥️ CLI-First Design** - Built for developers who live in the terminal
- **⚡ Lightning Fast** - Minimal dependencies, instant execution
- **🤖 Automation-Ready** - Perfect for scripts, hooks, and CI/CD pipelines
- **🔒 Secure** - API keys stored in environment variables
- **📦 Lightweight** - Small footprint, quick installation
- **🌍 Cross-Platform** - Works on macOS, Linux, and Windows

## 📋 Use Cases

### DevOps & CI/CD
```bash
# Automatically create tasks from pipeline failures
if [ $? -ne 0 ]; then
  notion-task create "Build failed: $BUILD_ID" --status "To-do" --notes "Check logs at $LOG_URL"
fi
```

### Git Hooks
```bash
# Create task when pushing to main branch
#!/bin/bash
if [ "$BRANCH" == "main" ]; then
  notion-task create "Review deployment: $COMMIT_MSG"
fi
```

### Daily Automation
```bash
# Create recurring daily standup task
notion-task create "Daily standup $(date +%Y-%m-%d)" --notes "Review sprint progress"
```

## 📦 Installation

### Via npm (Recommended)
```bash
npm install -g notion-task-tracker-cli
```

### Via Homebrew (macOS/Linux)
```bash
brew install notion-task-tracker-cli  # Coming soon
```

### Via Docker
```bash
docker pull notiontt/cli  # Coming soon
```

## ⚙️ Configuration

### 1. Get Your Notion API Key

1. Go to [Notion Developers](https://www.notion.so/my-integrations)
2. Create a new integration
3. Copy your Internal Integration Token

### 2. Get Your Database ID

1. Open your Notion database in a browser
2. Copy the ID from the URL: `notion.so/workspace/<database_id>?v=...`
3. Share the database with your integration

### 3. Set Environment Variables

```bash
# Add to your ~/.bashrc, ~/.zshrc, or ~/.profile
export NOTION_API_KEY="secret_xxxxxxxxxxxxx"
export NOTION_DATABASE_ID="xxxxxxxxxxxxx"
```

Or use a `.env` file in your project:
```env
NOTION_API_KEY=secret_xxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxx
```

## 📖 Usage

### Create a Task
```bash
notion-task create "Task title" [options]

Options:
  --status <status>       Set status (To-do, In Progress, Done)
  --notes <notes>         Add task notes/description
  --assigned-to <user>    Assign to user (coming soon)
```

### Update a Task
```bash
notion-task update <task-id> [options]

Options:
  --status <status>    Update status
  --notes <notes>      Update notes
```

### List Tasks (Coming Soon)
```bash
notion-task list [options]

Options:
  --status <status>    Filter by status
  --limit <number>     Limit results (default: 10)
```

## 🏗️ Project Structure

```
notion-task-tracker-cli/
├── index.js              # Main CLI entry point
├── package.json          # Package configuration
├── README.md            # This file
├── LICENSE              # MIT License
└── docs/                # Documentation
    ├── go-to-market-strategy.md
    └── guides/          # User guides
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Roadmap

### v1.0 (Current)
- [x] Create tasks
- [x] Update task status
- [x] Add task notes
- [ ] List tasks
- [ ] Query/filter tasks

### v1.1 (Planned)
- [ ] Task templates
- [ ] Bulk operations
- [ ] Interactive mode
- [ ] Configuration wizard

### v2.0 (Future)
- [ ] Multi-database support
- [ ] Advanced filtering
- [ ] Plugin system
- [ ] Team collaboration features

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Built with [@notionhq/client](https://github.com/makenotion/notion-sdk-js)
- Inspired by the developer community's need for CLI automation

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/your-org/notion-task-tracker-cli/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-org/notion-task-tracker-cli/discussions)
- **Documentation:** [Full Documentation](docs/)

## 🌟 Show Your Support

If this tool helps your workflow, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting features
- 🤝 Contributing code
- 📢 Sharing with others

---

**Made with ❤️ for developers who live in the terminal**
