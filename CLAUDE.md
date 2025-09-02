# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Monorepo Commands (from root directory)
- `npm run dev` - Start both frontend and backend development servers concurrently
- `npm run dev:frontend` - Start only the Next.js frontend development server on http://localhost:3000
- `npm run dev:backend` - Start only the Express backend development server on http://localhost:3001
- `npm run build` - Build both frontend and backend for production
- `npm run start` - Start both frontend and backend production servers
- `npm run lint` - Run ESLint on frontend code
- `npm run install:all` - Install dependencies for root, frontend, and backend
- `npm run clean` - Remove all node_modules and build artifacts

### Frontend Commands (from frontend/ directory)
- `npm run dev` - Start Next.js development server
- `npm run build` - Build Next.js application
- `npm run start` - Start Next.js production server
- `npm run lint` - Run ESLint

### Backend Commands (from backend/ directory)
- `npm run dev` - Start Express server in development mode with auto-reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start compiled Express server
- `npm run migrate` - Run Prisma database migrations
- `npm run generate` - Generate Prisma client
- `npm run studio` - Open Prisma Studio database GUI

## Project Architecture

This is a monorepo containing both frontend (Next.js) and backend (Express) applications for an AI-powered pitch practice platform.

### Frontend Structure (frontend/)
- **PitchRecorder** (`frontend/components/pitch/PitchRecorder.tsx`) - Main recording component that handles video/audio capture using react-webcam, with countdown functionality and real-time duration tracking
- **Dashboard** (`frontend/components/dashboard/Dashboard.tsx`) - Main user interface with tabbed navigation for pitches, feedback, progress, and resources
- **SkillRadarChart** (`frontend/components/visualization/SkillRadarChart.tsx`) - Chart.js-based radar visualization for speech metrics with comparison to previous scores

### Backend Structure (backend/)
- **Express API Server** (`backend/src/server.ts`) - Main API server handling authentication, pitch storage, and AI analysis
- **Database Layer** (`backend/prisma/`) - Prisma ORM for database schema and migrations
- **Authentication** - JWT-based authentication system
- **File Upload** - Multer-based file handling for pitch recordings

### Services Layer
- **SpeechAnalysisService** (`frontend/services/analysis/SpeechAnalysisService.ts`) - Core AI analysis service that provides:
  - Speech transcription with timestamps
  - Metrics calculation (pacing, clarity, filler words, tone variation, confidence)
  - Feedback generation based on analysis results
  - Currently contains placeholder/mock implementations ready for real AI integration

### Key Technology Stack
- **Next.js** with TypeScript (strict mode disabled in tsconfig)
- **React 19** with hooks-based state management
- **Tailwind CSS** for styling with custom utility classes
- **Chart.js** via react-chartjs-2 for data visualization
- **react-webcam** for media capture
- **Zustand** for state management (though not extensively used yet)

### Data Flow
1. User records pitch via PitchRecorder component
2. Audio/video blob passed to SpeechAnalysisService for processing
3. Analysis results displayed through Dashboard and SkillRadarChart
4. Metrics stored for progress tracking and comparison

### TypeScript Configuration
- Target ES2017 with strict null checks enabled
- JSX preserved for Next.js processing
- Module resolution set to node with ES modules interop

## Development Notes

The application is structured for AI-powered speech analysis but currently uses placeholder implementations. When implementing real AI features, focus on the SpeechAnalysisService interfaces which define the expected data structures for transcription and metrics.

The project uses a pages-based routing structure with a custom _app.tsx that imports global CSS styles.