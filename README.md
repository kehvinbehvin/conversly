# Conversly

A conversational practice application that helps users improve their interpersonal communication skills through AI-powered conversation practice and feedback. The application uses voice-based interactions with AI analysis to provide detailed conversation reviews and suggestions for improvement.

**Current Status**: Production-ready MVP with complete conversation flow, error handling, and anonymous user system.

## 🎯 Overview

Conversly provides a complete conversation analysis platform that:
- Enables voice-based conversation practice using ElevenLabs Conversational AI
- Features multi-agent avatar selection with unique conversation personalities
- Analyzes conversation transcripts using Braintrust-managed prompts with scoring system
- Provides detailed feedback with complement/improvement categorization
- Offers anonymous conversation tool on landing page for immediate access
- Tracks conversation history and progress over time
- Modern, responsive web interface with warm color palette design

## 🏗️ System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom warm color palette (browns, corals, sage)
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **State Management**: TanStack Query for server state, React hooks for local state
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules for modern JavaScript features
- **API Design**: RESTful endpoints with comprehensive error handling
- **Session Management**: Express sessions with PostgreSQL session store
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Storage**: Abstracted storage interface supporting multiple implementations

## 🔧 Core Systems

### 1. Avatar Selection System
Multi-agent conversation system with user choice of conversation partners:

**Components:**
- Four unique avatars with distinct personalities and ElevenLabs agent IDs
- Avatar selection interface with responsive 2x2 grid layout
- State management for selected avatar throughout conversation lifecycle
- Integration with ElevenLabs for personalized voice interactions

**Avatars:**
- Jessie (Barista): Friendly cafe worker for casual conversation practice
- Shawn (Party Friend): Social companion for party scenario practice  
- Maya (Cycling Enthusiast): Active lifestyle conversations
- Sam (Dinner +1): Professional dinner companion scenarios

### 2. Conversation Flow System
Complete lifecycle management from avatar selection to AI analysis:

**Components:**
- `UnifiedConversationInterface`: Single component handling all conversation states
- `AnonymousConversationContext`: State management for anonymous users
- Server-Sent Events (SSE) for real-time notifications
- Webhook handler with robust error handling for empty transcripts

**Flow:**
1. Avatar selection → User chooses conversation partner
2. Conversation initiation → Creates database record with avatar context
3. ElevenLabs WebSocket connection → Real-time voice interaction with selected agent
4. Conversation completion → Webhook triggers transcript processing
5. AI analysis with Braintrust → Structured feedback generation
6. Review display → User feedback with scoring system

### 3. AI Analysis Pipeline with Scoring System
Braintrust-powered conversation analysis with complement/improvement categorization:

**Key Components:**
- **Braintrust Integration**: Direct `invoke()` API calls to managed prompts
- **Scoring System**: Complement (+1) and improvement (-1) based scoring starting from 0
- **Prompt Management**: `conversation-consultant-7a00` prompt from Braintrust UI
- **Error Handling**: Comprehensive empty transcript detection and user notification

**Analysis Process:**
1. Transcript validation and empty transcript detection
2. Braintrust prompt invocation with conversation context  
3. Response parsing with category classification (complement/improvement)
4. Score calculation: complements add +1, improvements subtract -1
5. Review generation with educational scoring explanation

### 4. Database Architecture
PostgreSQL with Drizzle ORM for type-safe data operations:

**Core Tables:**
- `users`: User management with anonymous user support
- `conversations`: Practice session records with ElevenLabs integration and avatar context
- `transcripts`: JSONB storage for conversation data with structured TranscriptObject arrays
- `reviews`: AI-generated feedback with complement/improvement scoring and merged transcript data

**Key Features:**
- Simplified schema with JSONB storage for transcript arrays
- Anonymous user system (anonymous@conversly.com) for landing page tool
- Conversation status tracking: pending → completed/empty_transcript
- Score calculation based on complement (+1) and improvement (-1) categorization

### 5. Anonymous Conversation System
Free-to-use practice tool on landing page with real-time notifications:

**Features:**
- Anonymous user system for immediate access without registration
- Server-Sent Events (SSE) for real-time conversation status updates
- Single port architecture (HTTP + SSE) for Replit compatibility
- Conversation timer with 5-minute automatic termination
- Error handling for empty transcripts with user-friendly retry options

### 6. User Interface & Experience
Modern, responsive design with comprehensive state management:

**Design System:**
- Warm color palette (browns, corals, sage) for approachable feel
- Radix UI primitives with shadcn/ui components
- Responsive avatar selection (2x2 grid → vertical stack on mobile)
- Unified conversation interface with state machine architecture

**Key UX Features:**
- Targeted scroll to top on specific button interactions
- Comprehensive error states with retry functionality
- Conversation timer display with countdown
- Educational scoring explanation for transparency

## 🔌 Third-Party Integrations

### ElevenLabs Conversational AI
**Purpose**: Multi-agent voice conversation capabilities with avatar personalities
**Integration**: 
- Real-time WebSocket connections for voice interaction
- Signed URL authentication for secure connections
- Webhook endpoints with empty transcript error handling
- Multiple agent IDs for different conversation personalities

**Avatar Agent Configuration:**
- Jessie (Barista): `agent_01jyfb9fh8f67agfzvv09tvg3t`
- Shawn (Party Friend): `agent_01jyq0j92gfxdrv3me49xygae1`
- Maya (Cycling Enthusiast): `agent_01jyq0kn8v6h2mt9xr7d4wqpf3`
- Sam (Dinner +1): `agent_01jyq0mn5c8p1kt6xw9e2vdql4`
- Webhook URL: `/api/webhook/elevenlabs`
- Signature verification and comprehensive error handling

### Braintrust AI Platform
**Purpose**: Prompt management and conversation analysis with scoring system
**Integration**:
- Direct `invoke()` API calls to managed prompts
- Complement/improvement categorization for scoring
- Project-based prompt organization with pull configuration
- Response format handling with category validation

**Configuration:**
- Project: "Yappy-first-project" (or via `BRAINTRUST_PROJECT_NAME`)
- Prompt: `conversation-consultant-7a00`
- API Key: `BRAINTRUST_API_KEY` environment variable
- Prompt Updates: Run `braintrust pull --project-name "Yappy-first-project"` after changes

### PostgreSQL Database (Neon)
**Purpose**: Data persistence and session management
**Integration**:
- Serverless PostgreSQL hosting via Neon
- Connection pooling with `@neondatabase/serverless`
- Automatic migrations with Drizzle Kit
- Session storage with `connect-pg-simple`

## 📁 Project Structure

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # UI components including UnifiedConversationInterface
│   │   ├── contexts/       # React contexts for state management
│   │   ├── hooks/          # Custom React hooks including useSSE
│   │   ├── pages/          # Page-level components
│   │   └── lib/            # Utility functions and configurations
├── server/                # Express.js backend
│   ├── routes/            # API endpoint definitions and webhook handlers
│   ├── services/          # Braintrust integration and database services
│   ├── tests/             # Comprehensive test suites
│   └── migrations/        # Database migration scripts
├── shared/                # Shared TypeScript schemas and types
└── braintrust/           # Braintrust project configuration
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 20+ installed
- PostgreSQL database (Replit provides this automatically)
- ElevenLabs API account with Conversational AI access
- Braintrust account with configured prompts

### Environment Variables
Create a `.env` file or configure in your deployment environment:

```bash
# Database
DATABASE_URL="postgresql://..."

# ElevenLabs Integration
ELEVENLABS_API_KEY="your_elevenlabs_api_key"
ELEVENLABS_AGENT_ID="agent_01jyfb9fh8f67agfzvv09tvg3t"
ELEVENLABS_WEBHOOK_SECRET="your_webhook_secret"

# Braintrust Integration  
BRAINTRUST_API_KEY="your_braintrust_api_key"
BRAINTRUST_PROJECT_NAME="Yappy-first-project"

# Application
NODE_ENV="development"
```

### Installation & Development

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd conversly
   npm install
   ```

2. **Database Setup**
   ```bash
   # Push schema to database
   npm run db:push
   
   # Optional: Generate migrations
   npm run db:generate
   ```

3. **Development Server**
   ```bash
   npm run dev
   ```
   This starts both frontend (Vite) and backend (Express) on port 5000.

4. **Testing**
   ```bash
   # Run all tests
   npm test
   
   # Run specific test suites
   npm run test:conversations
   npm run test:braintrust
   ```

### Production Deployment

1. **Build Application**
   ```bash
   npm run build
   ```

2. **Start Production Server**
   ```bash
   npm start
   ```

### Braintrust Prompt Setup

1. **Create Braintrust Project**
   - Set up a project named "Yappy-first-project" (or configure `BRAINTRUST_PROJECT_NAME`)
   - Create a prompt with slug `conversation-consultant-7a00`

2. **Prompt Configuration**
   The prompt should analyze conversation transcripts and return structured feedback:
   ```json
   {
     "location": "Person B said: \"...\",
     "improvement": "Specific improvement suggestion",
     "reasoning": "Why this improvement would help"
   }
   ```

## 🔄 Data Flow

### Complete Conversation Lifecycle

1. **User Session Initiation**
   - User navigates to conversation page
   - Demo user automatically authenticated
   - Microphone permissions requested

2. **Conversation Start**
   - Signed URL generated for ElevenLabs WebSocket
   - Database conversation record created
   - WebSocket connection established

3. **Voice Interaction**
   - Real-time audio streaming to/from ElevenLabs
   - AI agent responds based on configured personality
   - Conversation messages logged in real-time

4. **Conversation Completion**
   - User ends conversation or natural conclusion reached
   - ElevenLabs webhook triggered with transcript data
   - Conversation status updated to processing

5. **AI Analysis**
   - Transcript formatted for Braintrust analysis
   - `conversation-consultant-7a00` prompt invoked
   - Response parsed and validated
   - Improvements generated with character positioning

6. **Review Generation**
   - Database review record created
   - Individual improvements saved to database
   - Overall rating calculated
   - Conversation status updated to analyzed

7. **User Feedback Display**
   - Review page shows structured feedback
   - Transcript highlighted with improvement annotations
   - Progress tracking updated
   - Historical data preserved

## 🧪 Testing Strategy

### Test Coverage
- **Unit Tests**: Individual service functions and utilities
- **Integration Tests**: API endpoints and database operations
- **End-to-End Tests**: Complete conversation flow validation
- **External Integration Tests**: Braintrust and ElevenLabs connectivity

### Key Test Suites
- `conversations.test.ts`: Conversation lifecycle and API endpoints
- `transcripts.test.ts`: Transcript processing and storage
- `improvements.test.ts`: Improvement generation and management
- `braintrust-integration.test.ts`: AI analysis pipeline validation

## 📊 Performance & Monitoring

### Database Performance
- Connection pooling for efficient database usage
- Indexed queries on frequently accessed columns
- Optimized schema design with proper relationships

### AI Analysis Performance
- Braintrust invoke() API for direct prompt execution
- Error handling with graceful fallbacks
- Response caching where appropriate

### Frontend Performance
- Vite for fast development builds
- Code splitting for optimized loading
- React Query for efficient server state management

## 🔒 Security Considerations

### API Security
- Webhook signature verification for ElevenLabs integration
- Environment variable protection for sensitive credentials
- Session-based authentication with secure cookies

### Data Protection
- No sensitive user data stored beyond conversation transcripts
- Local file storage with controlled access
- Database connections secured with proper credentials

## 🚦 Deployment

### Replit Deployment
The application is configured for seamless Replit deployment:
- Automatic environment setup
- Built-in PostgreSQL database
- Hot reloading for development
- Production builds with optimization

### Environment Configuration
- Development: Uses Replit's built-in services
- Production: Optimized builds with environment-specific configurations
- Database migrations handled automatically

## 📈 Future Enhancements

### Planned Features
- Advanced conversation analytics
- Multiple conversation scenarios
- User progress tracking dashboards
- Integration with additional AI providers
- Enhanced feedback categorization

### Scalability Considerations
- Database optimization for large conversation volumes
- Caching strategies for improved performance
- Microservices architecture for component isolation
- CDN integration for static asset delivery

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branches from main
3. Follow TypeScript and ESLint configurations
4. Add tests for new functionality
5. Submit pull requests with detailed descriptions

### Code Style
- TypeScript strict mode enabled
- ESLint and Prettier for code formatting
- Conventional commit messages
- Comprehensive JSDoc documentation

## 📄 License

This project is proprietary software. All rights reserved.

---

For questions or support, please contact the development team or create an issue in the repository.