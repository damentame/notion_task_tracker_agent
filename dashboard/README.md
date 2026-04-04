# Midnight Agent Space Dashboard

A modern web dashboard for monitoring and managing Temporal workflows with real-time visualization.

## Architecture

This dashboard consists of two main components:

### Frontend (`/frontend`)
- **React 18** + **TypeScript** + **Vite** + **Tailwind CSS**
- Modern, minimal dark-themed UI
- Real-time workflow monitoring
- Interactive workflow visualization with animated dots
- Runs on: `http://localhost:5173`

### Backend (`/backend`)
- **FastAPI** (Python async framework)
- Direct connection to PostgreSQL database
- Temporal workflow client integration
- WebSocket support for real-time updates
- Runs on: `http://localhost:8001`

## Design System

### Color Palette
- Background: slate-950 to slate-900 (dark gradient)
- Primary: cyan-500 (#06b6d4)
- Success: emerald-500 (#10b981)
- Error: rose-500 (#f43f5e)
- Warning: amber-500 (#f59e0b)
- Text: slate-100 (primary), slate-400 (secondary)

### Typography
- Font: Inter with system UI fallback
- Headings: font-semibold
- Body: font-normal, text-sm

## Features

### Phase 1 (Foundation)
- ✅ Frontend React+Vite+Tailwind setup
- [ ] Backend FastAPI setup with database
- [ ] Project CRUD endpoints and UI
- [ ] Basic navigation layout (sidebar + header)

### Phase 2 (Core Features)
- [ ] Document upload and file processing
- [ ] Document list with drag-and-drop UI
- [ ] Workflow launcher with option selectors
- [ ] Tasks table (read-only)

### Phase 3 (Visualization)
- [ ] WebSocket endpoint for workflow monitoring
- [ ] Floating dots animation component
- [ ] Click-to-detail activity panel
- [ ] Workflow run detail page with timeline
- [ ] Dashboard home page with stats

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL (existing instance on localhost:5434)

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
# Setup instructions coming in Phase 1
```

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Documents
- `GET /api/projects/{id}/documents` - List project documents
- `POST /api/projects/{id}/documents` - Upload document

### Workflows
- `POST /api/workflows/start` - Start workflow
- `GET /api/workflows` - List workflows
- `GET /api/workflows/{id}` - Get workflow details

### Tasks
- `GET /api/tasks` - List tasks
- `GET /api/tasks/{id}` - Get task details

### WebSocket
- `ws://localhost:8001/ws/workflows/{id}` - Real-time workflow updates

## Development

### Frontend
See [frontend/README.md](./frontend/README.md) for detailed frontend documentation.

### Backend
Coming soon in Phase 1.

## License

MIT
