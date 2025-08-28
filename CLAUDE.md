# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start the Next.js development server on http://localhost:3000
- `npm run build` - Build the application for production
- `npm start` - Start the production server (requires build first)
- `npm run lint` - Run ESLint to check code quality

## Project Architecture

This is a Next.js application for an AI-powered pitch practice platform. The architecture follows a component-based structure:

### Core Components Structure
- **PitchRecorder** (`components/pitch/PitchRecorder.tsx`) - Main recording component that handles video/audio capture using react-webcam, with countdown functionality and real-time duration tracking
- **Dashboard** (`components/dashboard/Dashboard.tsx`) - Main user interface with tabbed navigation for pitches, feedback, progress, and resources
- **SkillRadarChart** (`components/visualization/SkillRadarChart.tsx`) - Chart.js-based radar visualization for speech metrics with comparison to previous scores

### Services Layer
- **SpeechAnalysisService** (`services/analysis/SpeechAnalysisService.ts`) - Core AI analysis service that provides:
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