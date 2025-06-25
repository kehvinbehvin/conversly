# Conversly

A conversational practice application that helps users improve their interpersonal communication skills through AI-powered conversation practice and feedback. The application uses voice-based interactions with AI analysis to provide detailed conversation reviews and suggestions for improvement.

## 🎯 Overview

Conversly provides a complete conversation analysis platform that:
- Enables voice-based conversation practice using ElevenLabs Conversational AI
- Analyzes conversation transcripts using Braintrust-managed prompts
- Provides detailed feedback with specific improvement suggestions
- Tracks conversation history and progress over time
- Offers a modern, responsive web interface for seamless user experience

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

### 1. Conversation Flow System
The conversation system handles the complete lifecycle from initiation to analysis:

**Components:**
- `ConversationProvider`: React context managing conversation state
- `ElevenLabsConversation`: WebSocket-based voice interaction component
- Webhook handler: Processes conversation completion from ElevenLabs

**Flow:**
1. User initiates conversation → Creates database record
2. ElevenLabs WebSocket connection → Real-time voice interaction
3. Conversation completion → Webhook triggers transcript processing
4. AI analysis → Structured feedback generation
5. Review creation → User feedback display

### 2. AI Analysis Pipeline
The analysis system uses Braintrust for prompt management and conversation evaluation:

**Key Components:**
- **Braintrust Integration**: Direct `invoke()` API calls to managed prompts
- **Prompt Management**: `conversation-consultant-7a00` prompt from Braintrust UI
- **Response Processing**: Handles multiple response formats from AI models
- **Data Transformation**: Converts AI output to database-compatible structures

**Analysis Process:**
1. Transcript formatting (agent/user → Person A/Person B)
2. Braintrust prompt invocation with conversation context
3. Response parsing and validation
4. Improvement suggestion generation with character-level positioning
5. Overall rating calculation and summary generation

### 3. Database Architecture
The system uses PostgreSQL with Drizzle ORM for robust data management:

**Core Tables:**
- `users`: User management with authentication provider support
- `conversations`: Practice session records with ElevenLabs integration
- `transcripts`: Conversation content with file storage references
- `reviews`: AI-generated feedback with ratings and summaries
- `improvements`: Granular feedback tied to specific transcript sections

**Relationships:**
- Users → Conversations (one-to-many)
- Conversations → Transcripts (one-to-one)
- Conversations → Reviews (one-to-one)
- Reviews → Improvements (one-to-many)

### 4. File Storage System
Transcript data is managed through an abstracted storage interface:

**Implementation:**
- Local file storage in `data/transcripts/` directory
- JSON format for structured transcript data
- Metadata preservation for webhook information
- File naming based on ElevenLabs conversation IDs

### 5. Authentication & Session Management
User authentication uses a simplified demo system with full session support:

**Features:**
- Demo user system (demo@conversly.com) for MVP testing
- PostgreSQL-backed session storage using connect-pg-simple
- Express session middleware with secure configuration
- User context management throughout the application

## 🔌 Third-Party Integrations

### ElevenLabs Conversational AI
**Purpose**: Voice-based conversation capabilities
**Integration**: 
- Real-time WebSocket connections for voice interaction
- Signed URL authentication for secure connections
- Webhook endpoints for conversation completion processing
- Agent ID configuration for consistent conversation behavior

**Configuration:**
- Agent ID: `agent_01jyfb9fh8f67agfzvv09tvg3t`
- Webhook URL: `/api/webhook/elevenlabs`
- Signature verification for webhook security

### Braintrust AI Platform
**Purpose**: Prompt management and conversation analysis
**Integration**:
- Direct `invoke()` API calls to managed prompts
- Project-based prompt organization
- Environment-based configuration
- Response format handling and validation

**Configuration:**
- Project: "Yappy-first-project" (or via `BRAINTRUST_PROJECT_NAME`)
- Prompt: `conversation-consultant-7a00`
- API Key: `BRAINTRUST_API_KEY` environment variable

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
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page-level components
│   │   ├── lib/           # Utility functions and configurations
│   │   └── hooks/         # Custom React hooks
├── server/                # Express.js backend
│   ├── routes/           # API endpoint definitions
│   ├── services/         # Business logic and external integrations
│   ├── tests/            # Test suites for backend functionality
│   └── migrations/       # Database migration scripts
├── shared/               # Shared TypeScript types and schemas
├── data/                # Local file storage for transcripts
├── braintrust/          # Braintrust project configuration
└── prompts/             # Legacy prompt templates (deprecated)
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