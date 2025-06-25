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
- June 25, 2025: Integrated Braintrust SDK for conversation analysis
  - Replaced direct OpenAI calls with Braintrust wrapOpenAI for monitoring and prompt management
  - Updated analysis to focus on Individual B's responses matching client's JSON schema requirements
  - Created adapter layer to maintain backward compatibility with existing database structure
  - All webhook processing now uses Braintrust for conversation analysis with improved monitoring
  - Comprehensive test suite validates integration points and data transformation
- June 25, 2025: Fixed frontend-backend integration issues
  - Corrected POST /api/conversations to include required userId parameter
  - Updated conversation status filtering from "analyzed" to "completed" across all frontend pages
  - Integrated InlineHighlighter component with improvements API for transcript annotation
  - Updated storage page to reflect current database storage architecture
  - Fixed routing for review page navigation
  - Added proper error handling and user fetching in ConversationContext
- June 25, 2025: Fixed and validated complete test suite
  - All 30 tests now passing (conversations: 9, transcripts: 8, improvements: 10, integration: 3)
  - Fixed API endpoint status codes (201 for POST requests, proper 400 validation)
  - Improved test isolation with proper database cleanup between tests
  - Enhanced test performance with optimized configuration
  - Validated complete database storage functionality with comprehensive test coverage
- June 25, 2025: Switched to database storage for production deployment
  - Successfully migrated from memory storage to PostgreSQL database storage
  - All data now persists between server restarts and deployments
  - Demo user automatically created during database initialization
  - Full CRUD operations working with database backend
  - Verified data integrity across all entities (users, conversations, transcripts, reviews, improvements)
- June 25, 2025: Implemented persistent database storage with comprehensive data model
  - Added transcripts table with file_location and content fields
  - Created improvements table for granular feedback tied to transcript sections
  - Built complete API endpoints for transcripts and improvements management
  - Designed schema supporting inline highlighting with character position tracking
  - Added database relations between users, conversations, transcripts, reviews, and improvements
  - Created both memory storage (development) and database storage (production) implementations
  - Updated OpenAI service to generate improvements with character-level positioning
  - Built InlineHighlighter component for frontend transcript annotation display
- June 25, 2025: Simplified storage to local-only file system
  - Removed all Replit Object Storage components due to persistent API retrieval issues
  - Uninstalled @replit/object-storage package and cleaned up related code
  - Converted to local file storage using data/transcripts directory
  - Updated storage UI to show local file count and status
  - All conversation transcripts now save reliably to local file system
  - Eliminated cloud storage dependencies and simplified architecture
- June 24, 2025: Fixed duplicate conversation creation issue
  - Root cause identified: Two separate conversation creation points in App.tsx and ConversationContext
  - Removed duplicate conversation creation from App.tsx onConversationStart callback
  - Added deduplication tracking in ConversationContext to prevent multiple API calls
  - Conversation now created only once when ElevenLabs connection establishes
- June 24, 2025: Fixed microphone permission timing and dashboard refresh
  - Microphone access now properly occurs before WebSocket connection attempts
  - Dashboard now auto-refreshes every 5 seconds to show new conversations
  - History page displays conversations with proper refresh mechanism
  - Added debug information to verify conversation data loading
- June 24, 2025: Object store implementation for transcript data
  - Created FileStore service to save transcript data as JSON files
  - Enhanced webhook handler to automatically create conversations when missing
  - Fixed conversation ID mismatch between ElevenLabs and database
  - Added API endpoints to list and retrieve saved transcript files
  - Improved error handling to save raw webhook data even when processing fails
- June 24, 2025: Major codebase cleanup and architectural simplification
  - Removed legacy conversation timer and recording state management
  - Simplified conversation page to pure UI component without complex state
  - Cleaned up ConversationContext by removing unused audio resource management
  - Removed unnecessary props and state from ElevenLabsConversation component
  - Eliminated duplicate code and unused imports throughout codebase
  - Streamlined conversation flow to rely entirely on ElevenLabs SDK
- June 24, 2025: Complete conversation flow implemented and tested
  - Real ElevenLabs integration with secure signed URL authentication
  - OpenAI analysis generating detailed feedback with highlights and suggestions
  - Automatic redirect from conversation to review page working
  - Webhook endpoint receiving and processing conversation data correctly
  - API key security implemented - no sensitive credentials exposed to frontend
- June 24, 2025: Architectural separation using ElevenLabs SDK
  - Implemented ConversationProvider context with useConversation hook from @elevenlabs/react
  - Separated conversation session management from UI components
  - Fixed React state management issues causing WebSocket disconnections
  - Proper cleanup and resource management handled by ElevenLabs SDK

## Changelog
- June 24, 2025: Initial setup and core functionality completion

## User Preferences

Preferred communication style: Simple, everyday language.