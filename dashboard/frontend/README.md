# Midnight Agent Space Dashboard - Frontend

Modern React dashboard for monitoring and managing Temporal workflows with a beautiful dark-themed UI.

## Tech Stack

- **React 18** - Modern UI framework with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing

## Design System

### Color Palette

- **Background**: slate-950 to slate-900 (dark gradient)
- **Primary Accent**: cyan-500 (#06b6d4)
- **Success**: emerald-500 (#10b981)
- **Error**: rose-500 (#f43f5e)
- **Warning**: amber-500 (#f59e0b)
- **Text Primary**: slate-100
- **Text Secondary**: slate-400

### Typography

- **Font Family**: Inter (system UI fallback)
- **Headings**: font-semibold
- **Body**: font-normal, text-sm

### Component Styling

- Rounded corners: `rounded-xl` for cards, `rounded-lg` for buttons
- Subtle borders: `border-slate-700/50`
- Glass-morphism effects: `backdrop-blur-sm`, `bg-opacity`
- Smooth transitions: `transition-all duration-200`
- Focus rings: cyan for accessibility

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## API Configuration

The frontend connects to the FastAPI backend running on `http://localhost:8001`.

API proxy is configured in `vite.config.ts`:
- `/api/*` → `http://localhost:8001/api/*`
- `/ws/*` → `ws://localhost:8001/ws/*` (WebSocket)

## Project Structure

```
src/
├── assets/          # Static assets (images, icons)
├── components/      # Reusable UI components
├── pages/           # Page components
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
├── App.tsx          # Main app component
├── main.tsx         # App entry point
└── index.css        # Global styles with Tailwind directives
```

## Features

- Dark theme with modern minimal design
- Responsive layout
- Real-time workflow monitoring via WebSocket
- Interactive workflow visualization with animated dots
- Project and document management
- Task tracking and details

## Development Guidelines

- Use TypeScript for all new files
- Follow the established design system colors
- Use Tailwind utility classes for styling
- Keep components small and focused
- Use React hooks for state management
- Implement proper error boundaries
