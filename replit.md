# Conversly

## Overview

Conversly is a conversational practice application designed to help users improve their interpersonal communication skills through AI-powered conversation practice and feedback. The application uses voice-based interactions with AI analysis to provide detailed conversation reviews and suggestions for improvement.

**Current Status**: MVP fully functional with complete conversation flow from practice session to AI-generated feedback review.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with custom warm color palette (browns, corals, sage)
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **State Management**: TanStack Query for server state, React hooks for local state
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API**: RESTful endpoints for conversations, reviews, and user management
- **Storage**: Abstracted storage interface with in-memory implementation for development
- **Session Management**: Express sessions with PostgreSQL session store

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Management**: Drizzle migrations in TypeScript
- **Connection**: Neon serverless PostgreSQL for production
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

## Key Components

### Database Schema
- **Users Table**: Basic user management with auth provider support and Stripe integration
- **Conversations Table**: Practice session records with ElevenLabs integration and metadata
- **Reviews Table**: AI-generated feedback with highlights, suggestions, and ratings

### API Services
- **OpenAI Integration**: GPT-4o for conversation analysis and feedback generation
- **ElevenLabs Integration**: Voice conversation capabilities (currently mocked)
- **Storage Layer**: Abstracted interface supporting both memory and database implementations

### Frontend Pages
- **Landing Page**: Marketing and feature overview
- **Dashboard**: User overview with conversation statistics and quick actions
- **Conversation**: Voice practice interface with recording controls
- **Review**: Detailed feedback display with highlights and suggestions
- **History**: Complete conversation history with search and filtering

## Data Flow

1. **User Registration**: Demo user system for MVP (demo@conversly.com)
2. **Conversation Creation**: User initiates practice session, creates conversation record
3. **Voice Interaction**: Integration with ElevenLabs for real-time voice conversation
4. **Transcript Processing**: Voice data converted to text transcript
5. **AI Analysis**: OpenAI GPT-4o analyzes transcript for communication patterns
6. **Review Generation**: Structured feedback with highlights, suggestions, and ratings
7. **Progress Tracking**: Historical data for user improvement tracking

## External Dependencies

### Core Services
- **OpenAI API**: GPT-4o for conversation analysis and feedback generation
- **ElevenLabs API**: Voice conversation capabilities and speech processing
- **Neon Database**: Serverless PostgreSQL hosting
- **Stripe**: Payment processing for premium features

### Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Production server bundling
- **Replit**: Development environment and deployment platform

## Deployment Strategy

### Development
- **Environment**: Replit with hot reloading
- **Database**: Replit PostgreSQL module
- **Ports**: Frontend on 5000, full-stack development setup
- **Scripts**: `npm run dev` for development server

### Production
- **Build Process**: Vite for client, ESBuild for server
- **Deployment Target**: Replit autoscale deployment
- **Environment Variables**: DATABASE_URL, OPENAI_API_KEY, ELEVENLABS_API_KEY
- **Static Assets**: Served from dist/public directory

### Configuration
- **TypeScript**: Strict mode with ESNext modules
- **Path Aliases**: @ for client, @shared for shared code
- **CSS Processing**: PostCSS with Tailwind and Autoprefixer

## Recent Changes
- June 24, 2025: Client-side WebSocket disconnection fix
  - Fixed callback parameter mismatch in onDisconnect handler
  - Prevented premature onConversationEnd calls for user-initiated disconnects
  - Added proper conversation state validation before ending sessions
  - Implemented small delay to prevent race conditions during session start
  - Fixed React state management issues causing immediate disconnections
- June 24, 2025: Microphone permission and WebSocket connection fix
  - Added explicit microphone permission request before starting conversations
  - Fixed immediate WebSocket disconnection issue caused by missing audio permissions
  - Updated ElevenLabs callback signatures to match official SDK types
  - Added user-friendly messaging about microphone access requirements
  - Improved error handling for permission-related failures
- June 24, 2025: ElevenLabs SDK integration and agent ID fix
  - Integrated official ElevenLabs JavaScript SDK for server-side operations
  - Fixed agent_id=undefined error in WebSocket connections
  - Replaced manual fetch calls with SDK methods for better reliability
  - Improved error handling and logging throughout conversation flow
  - Cleaned up legacy code files and improved component architecture
- June 24, 2025: Complete conversation flow implemented and tested
  - Real ElevenLabs integration with secure signed URL authentication
  - OpenAI analysis generating detailed feedback with highlights and suggestions
  - Automatic redirect from conversation to review page working
  - Webhook endpoint receiving and processing conversation data correctly
  - API key security implemented - no sensitive credentials exposed to frontend

## Changelog
- June 24, 2025: Initial setup and core functionality completion

## User Preferences

Preferred communication style: Simple, everyday language.