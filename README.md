# Notion Task Tracker CLI

A powerful command-line interface tool for managing Notion tasks directly from your terminal.

## 📋 Overview

This CLI tool provides seamless integration with Notion workspaces, enabling developers and power users to create, update, query, and manage tasks without leaving the command line.

## 🏗️ Architecture

Comprehensive architecture documentation is available in the [`docs/architecture/`](./docs/architecture/) folder:

- **[System Architecture](./docs/architecture/SYSTEM_ARCHITECTURE.md)**: Complete system design including components, data flow, and tech stack
- **[Integration Patterns](./docs/architecture/INTEGRATION_PATTERNS.md)**: Detailed Notion API integration patterns and best practices
- **[Technical Decisions](./docs/architecture/TECHNICAL_DECISIONS.md)**: Architecture Decision Records (ADRs) with rationale
- **[Implementation Guide](./docs/architecture/IMPLEMENTATION_GUIDE.md)**: Step-by-step implementation instructions
- **[Architecture Diagrams](./docs/architecture/DIAGRAMS.md)**: Visual representations of system components and flows

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ LTS
- Notion API key
- Notion database ID

### Installation

```bash
npm install -g notion-task-cli
```

### Configuration

```bash
notion-task init
```

Follow the interactive prompts to configure your API key and database ID.

## 📚 Documentation

- [Architecture Documentation](./docs/architecture/README.md) - System design and technical decisions
- User Guide (Coming soon)
- API Reference (Coming soon)

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+ (ESM)
- **CLI Framework**: commander.js
- **API Client**: @notionhq/client (official SDK)
- **Architecture**: Clean Architecture with Repository Pattern
- **Testing**: Jest with 80%+ coverage

## 🏛️ Architecture Highlights

### Layered Architecture
```
CLI Interface Layer
    ↓
Business Logic Layer (Services)
    ↓
Data Access Layer (Repositories)
    ↓
Infrastructure Layer (Notion API, Cache, Logger)
```

### Key Features
- ✅ Multi-level caching (memory + file)
- ✅ Rate limiting (3 req/sec)
- ✅ Exponential backoff retry
- ✅ Encrypted API key storage
- ✅ Rich CLI output formatting
- ✅ Comprehensive error handling

## 📖 Current Status

**Phase**: Architecture Design Complete  
**Branch**: `cursor/cli-system-architecture-9327`

The comprehensive system architecture has been designed and documented. Implementation follows the guides in the architecture documentation.

## 👥 Team

- **Product Manager**: Requirements and roadmap
- **Technical Lead**: Architecture and technical decisions
- **Backend/CLI Developers**: Implementation
- **QA Engineer**: Testing and quality assurance

## 📄 License

ISC
