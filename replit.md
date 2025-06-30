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
- **Landing Page**: Marketing and feature overview with integrated avatar selection
- **Dashboard**: User overview with conversation statistics and quick actions
- **Conversation**: Voice practice interface with recording controls
- **Review**: Detailed feedback display with highlights and suggestions
- **History**: Complete conversation history with search and filtering

### Avatar Selection System
- **Multi-Agent Support**: 4 unique conversation partners with distinct personalities
- **Avatar Profiles**: Jessie (barista), Shawn (party friend), Maya (cycling enthusiast), Sam (dinner +1)
- **Environment-Aware Configuration**: Automatic switching between development and production agent IDs
- **Responsive Interface**: 2x2 grid on desktop/tablet, vertical stack on mobile
- **ElevenLabs Integration**: Each avatar maps to unique agent_id for personalized voice interactions
- **State Management**: Selected avatar persists throughout conversation lifecycle
- **Visual Design**: Card-based selection with coral/sage highlighting and media object layout

## Data Flow

1. **User Registration**: Demo user system for MVP (demo@conversly.com)
2. **Avatar Selection**: User chooses from 4 conversation partners with unique personalities
3. **Conversation Creation**: User initiates practice session with selected avatar's agent_id
4. **Voice Interaction**: Integration with ElevenLabs for real-time voice conversation using specific agent
5. **Transcript Processing**: Voice data converted to text transcript with avatar context
6. **AI Analysis**: OpenAI GPT-4o analyzes transcript for communication patterns
7. **Review Generation**: Structured feedback with highlights, suggestions, and ratings
8. **Progress Tracking**: Historical data for user improvement tracking across different avatars

## External Dependencies

### Core Services
- **OpenAI API**: GPT-4o for conversation analysis and feedback generation
- **ElevenLabs API**: Voice conversation capabilities with environment-specific agent configurations
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
- **Environment Variables**: DATABASE_URL, OPENAI_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_WEBHOOK_SECRET, ELEVENLABS_WEBHOOK_SECRET_DEV
- **Static Assets**: Served from dist/public directory
- **Environment Detection**: Automatic switching to production agents and webhook secrets when NODE_ENV=production

### Configuration
- **TypeScript**: Strict mode with ESNext modules
- **Path Aliases**: @ for client, @shared for shared code
- **CSS Processing**: PostCSS with Tailwind and Autoprefixer
- **Braintrust Integration**: Run `braintrust pull --project-name "Yappy-first-project"` after updating prompts in Braintrust dashboard

## Recent Changes  
- June 30, 2025: **MINIMAL PRODUCTION API ACHIEVED** - Reduced production endpoints to absolute minimum while preserving all functionality
  - **Ultra-Clean API Surface**: Production now serves only 7 endpoints (6 frontend + 1 webhook)
  - **Systematic Frontend Tracing**: Verified all API calls from App.tsx through complete component tree
  - **Zero Functionality Loss**: All active frontend features preserved and tested end-to-end
  - **Development Endpoints Protected**: Moved unused endpoints to development-only with NODE_ENV protection
  - **Future Compatibility**: Disabled page endpoints preserved in development for potential re-enabling
  - **Security Enhancement**: Minimized production attack surface while maintaining full development capabilities
  - **Clean Architecture**: Clear separation between production necessity and development convenience
- June 30, 2025: **SEEN-ONCE ACCESS CONTROL IMPLEMENTED** - Replaced 1-hour time limit with one-time conversation access
  - **Database Schema**: Added `seen` timestamp column to conversations table for access tracking
  - **Backfill Migration**: Updated 238 existing conversations with current timestamp for backward compatibility
  - **API Logic**: Modified `/api/conversations/:id` to check `seen` field instead of creation time
  - **Access Control**: First access returns data and marks conversation as seen, subsequent access returns HTTP 204
  - **Webhook Exemption**: System access (webhook processing) remains unaffected by seen-once restriction
  - **Frontend Integration**: Page refresh naturally resets state, eliminating need for special handling
  - **Production Testing**: Verified complete workflow with fresh conversations and repeat access scenarios
- June 30, 2025: **AVATAR LAYOUT STABILITY FIXES COMPLETED** - Eliminated all visual jumping and layout shifts in conversation interface
  - **Database Query Fix**: Added ORDER BY created_at DESC to getReviewByConversationId to return most recent review instead of first match
  - **Border Highlight Stability**: Fixed avatar border highlighting to use consistent ring-4 thickness with color-only changes (coral-500 for speaking)
  - **Speaking Label Stability**: Changed "Speaking..." label from conditional rendering to CSS visibility control to prevent layout shifts
  - **Complete Conversation Flow**: Verified end-to-end functionality from avatar selection to review display with proper data integrity
  - **Production Ready**: All visual layout issues resolved, interface provides stable feedback without disrupting user experience
- June 30, 2025: **FEEDBACK MODAL FEATURE COMPLETED** - Converted feedback form to popup modal with mobile-first responsive design
  - **Modal Implementation**: Created FeedbackModal using Radix UI Dialog pattern, stays open after submission
  - **Mobile Optimization**: Full-screen modal on mobile devices, standard modal on desktop, mobile navbar shows Feedback button
  - **Navigation Update**: Changed feedback buttons from scroll behavior to modal toggle, visible on mobile navigation
  - **Clean Architecture**: Removed FeedbackSection from landing page, maintaining all form functionality
  - **State Management**: Added modal open/close state with proper GTM tracking integration
  - **API Security**: Maintained DOMPurify sanitization and validator email validation
  - **Form Validation**: Preserved character limits, required field validation, and malicious content detection
  - **User Experience**: Simplified success message, modal stays open for multiple submissions, accessible from navigation
- June 29, 2025: **REAL-TIME MICROPHONE ACTIVITY DETECTION COMPLETED** - Side-by-side avatar display with speaking detection during conversations
  - **Speaking Detection Hook**: Created useSpeakingDetection hook using ElevenLabs SDK methods (getInputVolume, getInputByteFrequencyData)
  - **ConversationAvatar Component**: Built unified avatar component with border highlighting for speaking status (coral color scheme)
  - **Side-by-Side Layout**: Agent and user avatars displayed together during active conversations with responsive design
  - **Mobile Layout**: Top-bottom stacking on mobile devices (agent on top, user on bottom), side-by-side on desktop
  - **SDK Integration**: Exposed ElevenLabs conversation object in AnonymousConversationContext for real-time audio analysis
  - **Audio Thresholds**: Volume detection > 0.1, voice energy > 100 for speaking status determination
  - **Visual Design**: Border highlights instead of pulsing animations, consistent with warm-brown/coral/sage color palette
  - **Generic User Avatar**: Created hardcoded SVG for user representation during conversations
  - **Debug Logging**: Audio analysis data logged to console for threshold tuning and validation
- June 29, 2025: **NEXT STEPS FRONTEND FEATURE COMPLETED** - Full end-to-end Next Steps implementation with frontend UI
  - **Frontend Component**: Created NextStepsSection component with numbered steps (1, 2, 3) using coral color scheme
  - **UI Integration**: Positioned below Summary section, above "Start New Conversation" button in review state
  - **Data Handling**: Robust JSON parsing of nextSteps.steps field from database JSONB column
  - **Design System**: Follows existing warm-brown/coral/sage palette with numbered circles and proper spacing
  - **Responsive Design**: Matches existing review section responsive behavior for mobile and desktop
  - **Error Handling**: Only renders when Next Steps data is available, graceful degradation on missing data
  - **End-to-End Validation**: Successfully tested with live conversation (ID 317) showing 3 generated next steps
- June 29, 2025: **NEXT STEPS FEATURE COMPLETED** - AI-generated actionable recommendations system fully implemented
  - **Database Schema**: Added next_steps table with foreign key relationship to conversations
  - **Braintrust Integration**: Created nextStepsGenerator service using "take-action-f00e" prompt slug
  - **Service Layer**: Integrated next steps generation into review creation workflow in reviewAnalyzer.ts
  - **API Enhancement**: Updated /api/conversations/:id endpoint to include nextSteps in response
  - **Data Flow**: Review LLM output → Next Steps LLM → Database storage → API response
  - **Error Handling**: Graceful degradation - conversation flow continues even if next steps generation fails
  - **Storage Interface**: Added complete CRUD operations for next steps in both memory and database implementations
  - **API Routes**: Full REST endpoints for next steps management (/api/next-steps, /api/conversations/:id/next-steps)
  - **End-to-End Validation**: Successfully tested complete workflow from review creation to next steps retrieval
- June 27, 2025: **1-HOUR CONVERSATION ACCESS LIMIT IMPLEMENTED** - Added time-based access control to conversation API endpoint
  - **Route Protection**: /api/conversations/:id now checks conversation age against created_at timestamp
  - **Time Validation**: Compares current time with conversation.createdAt, returns 204 No Content if difference exceeds 1 hour
  - **Clean Response**: Returns empty response (204 status) instead of conversation data for expired conversations
  - **System Design**: Maintains data integrity while providing time-limited access to conversation reviews
  - **Implementation**: Uses millisecond precision time comparison (60 * 60 * 1000ms = 1 hour threshold)
- June 27, 2025: **ENVIRONMENT-AWARE GOOGLE TAG MANAGER INTEGRATION COMPLETED** - Comprehensive analytics tracking with automatic container switching
  - **Environment-Based Container Selection**: Automatically switches between GTM-NCK6KLG8 (development) and GTM-PPWXFQR6 (production) based on NODE_ENV
  - **Package Installation**: Added react-gtm-module and @types/react-gtm-module for TypeScript support
  - **Automatic GTM Initialization**: Environment-specific container initialized in main.tsx without manual HTML snippets
  - **Enhanced Tracking Utility**: Created comprehensive GTM tracking utility with environment context and development logging
  - **Event Enrichment**: All events automatically include environment, GTM container ID, and timestamp metadata
  - **Landing Page Tracking**: Page views, section views (intersection observer), and navigation button clicks
  - **Conversation Flow Tracking**: Avatar selection, conversation start/end, timer expiration, and completion events
  - **Review Analytics**: Review viewing, scoring, and conversation completion tracking with detailed metadata
  - **Dashboard Integration**: Page views, navigation buttons, and user interaction tracking
  - **Error Recovery Tracking**: "Try Again" and "Back to Start" button interactions with error context
  - **Development Debugging**: GTM events logged to console in development mode for debugging and validation
- June 27, 2025: **ENVIRONMENT-AWARE WEBHOOK AND AGENT CONFIGURATION IMPLEMENTED** - Complete system for dev/production environment separation
  - **Agent Configuration**: AVATARS array now automatically switches between development and production agent IDs based on NODE_ENV
  - **Webhook Secret Management**: Environment-aware webhook verification using ELEVENLABS_WEBHOOK_SECRET_DEV for development and ELEVENLABS_WEBHOOK_SECRET for production
  - **Environment Detection**: Universal utility function works on both server-side (NODE_ENV) and client-side (Vite import.meta.env)
  - **Development Agents**: agent_01jyfb9fh8f67agfzvv09tvg3t (Jessie), agent_01jypzmj9heh3rhmn47anjbsr8 (Shawn), agent_01jyq00m9aev8rq8e6a040rjmv (Maya), agent_01jyq0j92gfxdrv3me49xygae1 (Sam)
  - **Production Agents**: agent_01jys1g9ndfcqthwrs8p9fy4bn (Jessie), agent_01jys1h6dfe0dt1x186wkqcnmb (Shawn), agent_01jys1jsmje7wvb6vak1dt4t54 (Maya), agent_01jys1hz8zf9crk3j8aq7hnk9b (Sam)
  - **Enhanced Error Handling**: Clear error messages when webhook secrets are missing for specific environments
  - **Test Coverage**: Updated avatar selection tests to validate both environment configurations
- June 27, 2025: **PRODUCTION SSE DEPLOYMENT ISSUE RESOLVED** - Fixed CORS conflict causing conversations to hang after ending in production
  - **Root Cause**: SSE endpoint bypassed main CORS configuration with wildcard origin, causing browser CORS violations in production
  - **Primary Fix**: Removed conflicting CORS headers from SSE endpoint, allowing main CORS middleware to handle all origin validation
  - **Secondary Fix**: Enabled SSE auto-reconnection in production environments (was development-only)
  - **Systematic Analysis**: Used engineering approach to trace conversation flow, identify dev vs production differences, and validate assumptions
  - **Environment Consistency**: Production and development now have identical SSE connection handling and error recovery
- June 27, 2025: **EMPTY TRANSCRIPT ERROR HANDLING IMPLEMENTED** - Fixed webhook bug where empty transcripts caused client to wait indefinitely
  - **Server-Side Fix**: Added SSE notification for empty transcript scenarios with new "empty_transcript_error" message type
  - **Status Management**: Conversations with empty transcripts now receive "empty_transcript" status for proper tracking
  - **Client-Side Handling**: Added error state processing to display user-friendly message and cleanup ElevenLabs connection
  - **Error Message**: Users see "No conversation data was captured. Please try again." with retry options
  - **State Reset Fix**: Fixed "Back to Start" button to properly reset all conversation state instead of transitioning to processing state
  - **Button Styling Fix**: Resolved inconsistent hover effects on "Back to Start" button through targeted CSS adjustments
  - **Test Coverage**: Created comprehensive tests validating database status updates and error handling logic
- June 27, 2025: **CORS CONFIGURATION ENHANCED** - Upgraded from custom middleware to dedicated cors package with restricted origins
  - **Professional Setup**: Replaced custom CORS headers with industry-standard cors middleware
  - **Enhanced Security**: Restricted origins to authorized domains only
  - **Application Domains**: conversly.space and Replit deployment domain
  - **Replit Domain Patterns**: Added regex patterns for *.replit.dev and *.replit.co to handle webhook routing variations
  - **External Services**: Added Braintrust (api.braintrust.dev, braintrust.dev) and ElevenLabs (api.elevenlabs.io, elevenlabs.io)
  - **Development Support**: Includes localhost origins for local development
  - **Webhook Support**: Included elevenlabs-signature header for webhook authentication
- June 27, 2025: **SEO CONFIGURATION IMPLEMENTED** - Added robots.txt for landing page only indexing
  - **Robots.txt Created**: Only allows search engine indexing of landing page (/)
  - **Privacy Protection**: Blocks indexing of dashboard, conversation history, and internal pages
  - **Landing Page Focus**: Ensures only the anonymous conversation tool is discoverable via search
- June 27, 2025: **TARGETED SCROLL TO TOP IMPLEMENTED** - Added user-triggered scroll functionality for specific buttons
  - **Start Conversation Scroll**: "Start Conversation" button now scrolls to top when clicked
  - **Start New Conversation Scroll**: "Start New Conversation" button now scrolls to top when clicked
  - **User-Initiated Only**: Scrolling only occurs on explicit button clicks, not automatic state changes
  - **Smooth Animation**: Uses window.scrollTo with smooth behavior for better user experience
- June 27, 2025: **SCORE EXPLANATION FEATURE IMPLEMENTED** - Added educational text explaining how conversation scores are calculated
  - **Location**: Positioned below score display in review state of anonymous conversation tool
  - **Content**: Explains baseline of 0, +1 for good conversational skills, -1 for improvement areas
  - **Design**: Matches site aesthetics with warm-brown background and color-coded point values
  - **User Education**: Provides transparency about scoring system to help users understand feedback
- June 27, 2025: **5-MINUTE CONVERSATION TIMER IMPLEMENTED** - Added automatic conversation time limit with countdown display
  - **Timer Logic**: Custom useConversationTimer hook manages 5-minute countdown with automatic session termination
  - **UI Integration**: Timer displays as "4:32 remaining" format with clock icon in active conversation state
  - **Positioning**: Timer positioned below avatar description, above status indicator as requested
  - **Auto-termination**: Uses existing endConversation() flow when timer expires, no modal popup
  - **State Management**: Timer starts only when conversation is active, resets on errors or manual termination
  - **SDK Integration**: Properly integrates with ElevenLabs conversation.endSession() method
- June 27, 2025: **SCORING SYSTEM IMPLEMENTATION COMPLETED** - Replaced 1-5 rating system with complement/improvement based scoring
  - **New Scoring Logic**: Complements add +1, improvements subtract -1, starting from 0 baseline
  - **Braintrust Integration**: Updated prompt to return category field ("complement" | "improvement") for each review
  - **Complete UI Overhaul**: Removed all star rating components and replaced with score display showing "+3" or "-2" format
  - **Frontend Cleanup**: Eliminated star icons, rating fractions, and "rating" terminology across all components
  - **Database Schema**: Reused existing overall_rating column to store positive/negative scores
  - **Configuration Management**: Added requirement to run `braintrust pull --project-name "Yappy-first-project"` after prompt updates
  - **End-to-End Validation**: Confirmed scoring works correctly with real conversation analysis
- June 26, 2025: **AVATAR SELECTION FEATURE COMPLETED** - Multi-agent conversation system with user choice
  - **Agent Selection Interface**: 2x2 grid layout (desktop/tablet) and vertical stack (mobile) for 4 conversation avatars
  - **Dynamic Agent Integration**: Each avatar maps to unique ElevenLabs agent_id for personalized conversations
  - **State Management**: Avatar selection state with proper logging and error handling throughout conversation flow
  - **Responsive Design**: Clean card-based selection with coral/sage highlighting for selected avatar
  - **Data Validation**: Comprehensive test suite (13 tests) validates avatar data integrity and ElevenLabs integration
  - **Conversation Context**: Selected avatar persists through entire conversation lifecycle from start to review
- June 26, 2025: **MOBILE REVIEW STATE OVERFLOW FIX COMPLETED** - Eliminated unwanted scrolling in top section of review state
  - **Mobile Overflow Resolution**: Removed height constraints and overflow-y-auto from review top section on mobile/tablet
  - **Natural Content Display**: Top section now expands to fit all rating and summary content without scrolling
  - **Desktop Preservation**: Maintained existing desktop layout with height constraints and scrolling behavior  
  - **Responsive Implementation**: Used lg: prefixes to apply constraints only on desktop breakpoint
- June 26, 2025: **RESPONSIVE DESIGN AND CENTERING OPTIMIZATIONS COMPLETED** - Enhanced mobile experience and screen centering
  - **Container Width Fix**: Changed from viewport-relative (95vw/90vw) to container-relative (100%) widths eliminating visible gaps
  - **Vertical Centering**: Added responsive alignment (items-start on mobile, items-center on desktop)
  - **Mobile Positioning**: Positioned interface closer to navbar on mobile with pt-8, centered on desktop
  - **Consistent Responsive Behavior**: All states use identical padding scale (16px mobile, 24px tablet, 32px desktop)
  - **Engineering Solution**: Container-relative sizing prevents double-spacing from padding and viewport calculations
- June 26, 2025: **CRITICAL BUG RESOLUTION** - User manually fixed missing renderIdleState function that broke component
  - **Root Cause**: Missing function definition caused "renderIdle is not defined" runtime error
  - **Cascade Effect**: Runtime error led to JSX syntax corruption and component failure
  - **Learning**: Always verify function dependencies exist before making structural component edits
  - **Resolution**: User manually restored missing function, component now renders properly
- June 26, 2025: **CONVERSATION INTERFACE STATE CONSISTENCY FIXED** - Resolved width and overlay issues across all conversation states
  - **Root Cause**: Side-by-side layout in idle state vs centered layout in other states caused width inconsistencies and transparent overlays
  - **Solution**: Standardized all non-idle states to use centered, full-width layouts without background content
  - **States Fixed**: Connecting, active, processing, and error states now properly center content and maintain consistent card width
  - **User Experience**: Clean state transitions with no transparent backgrounds or misaligned content
- June 26, 2025: **LANDING PAGE REDESIGN COMPLETED** - Marketing content moved into conversation interface for unified experience
  - **Layout Change**: Moved "Practice conversations. Build confidence." section into idle state left side
  - **Action Section**: "Ready to practice?" section moved to idle state right side with side-by-side layout
  - **Viewport Centering**: Interface now properly centered in screen for better visual balance
  - **Content Consolidation**: Removed duplicate marketing content from landing page header
- June 26, 2025: **CHAT THREAD OVERFLOW ISSUE RESOLVED** - Systematic fix for content containment in review state
  - **Root Cause Analysis**: Identified `.card-surface` class padding conflicting with flex layout constraints
  - **Height Flow Fix**: Removed problematic CSS class to allow proper height constraint propagation
  - **Flex Layout Chain**: Ensured proper height flow from Card → CardContent → Review layout → ChatThread
  - **Scrolling Behavior**: Chat thread now properly contains content with internal scrolling only
  - **Layout Integrity**: Maintained visual styling while fixing structural layout issues
- June 26, 2025: **UI/UX DESIGN REFINEMENTS COMPLETED** - Active conversation state now fully aligned with warm color palette
  - **Color Consistency**: Updated active state from generic green to sage palette (sage-500, sage-700, sage-600)
  - **Complete Badge Update**: Review completion badge now uses sage-100/sage-800 instead of generic green
  - **Design System Integrity**: All visual elements now consistently use warm-brown/coral/sage color scheme
  - **Clean Visual Elements**: Removed pulsation effects, fixed spinner alignment using flex layout
  - **Material Design Spinners**: Simplified progress indicators with border-based animation
- June 26, 2025: **COMPREHENSIVE SYSTEM ANALYSIS COMPLETED** - Full frontend-to-backend validation with critical fixes
  - **Color System Fixed**: Added missing custom color classes (warm-brown, coral, sage) to Tailwind configuration
  - **State Machine Enhanced**: Improved processing state detection and added error state handling
  - **Error Handling Added**: Comprehensive error states with user-friendly retry functionality
  - **End-to-End Validation**: Tested complete conversation flow from anonymous user creation to API endpoints
  - **Production Ready**: All critical issues resolved, system fully functional for free conversation tool
- June 25, 2025: **MEMORY-ONLY ARCHITECTURE IMPLEMENTED** - Simplified state management by removing all browser storage
  - **Pure Memory State**: Removed all sessionStorage dependencies for cleaner state management
  - **Simplified Data Flow**: Conversation data exists only in memory, eliminating persistence complexity
  - **Clean Session Lifecycle**: Each page refresh starts fresh with no stale data interference
  - **Reduced Tech Debt**: Eliminated race conditions between storage and memory state
- June 25, 2025: **UNIFIED CONVERSATION INTERFACE IMPLEMENTED** - Combined tool and review into single full-width component
  - **Single Interface Design**: Replaced side-by-side layout with unified component spanning full width (600px height)
  - **State Machine Architecture**: Idle → Connecting → Active → Processing → Review with proper transitions
  - **Clean Start State**: Centered "Start Conversation" button without confusing mic icons
  - **Active State Improvements**: Clear "Stop Conversation" button and streamlined active indicator
  - **Review Layout**: 50/50 split with rating/summary on left, chat thread with feedback on right
  - **Enhanced UX**: "Start New Conversation" resets to initial state, preserving SSE functionality
- June 25, 2025: **LANDING PAGE UI REDESIGN COMPLETED** - Simplified and optimized conversation tool layout
  - **Hero Layout**: Conversation tool and review panel prominently featured above the fold with 500px height
  - **Simplified Conversation Start**: Single clear "Click to Start Conversation" button, removed confusing mic icon
  - **Condensed Review Panel**: Rating as compact fraction (4/5), removed summary and duplicate sections
  - **Optimized Scrolling**: Only chat thread scrollable, fixed header and rating for better UX
  - **Reduced Information Overload**: Removed "Practice makes perfect" section, detailed feedback, and account CTA
  - **Clean Visual Design**: Enhanced spacing, colors, and typography for professional appearance
- June 25, 2025: **ANONYMOUS CONVERSATION TOOL IMPLEMENTED** - Free-to-use practice tool on landing page
  - **Side-by-side Layout**: Conversation tool and review panel positioned above the fold
  - **SSE Architecture**: Server-Sent Events for real-time notifications, avoiding WebSocket conflicts with Vite HMR
  - **Single Port Design**: All communication on port 5000 (HTTP + SSE) for Replit compatibility
  - **Client Identification**: SSE endpoint `/api/events/:conversationId` uses ElevenLabs conversation ID for unique client identification
  - **Anonymous User System**: Conversations saved under anonymous@conversly.com for usage analytics
  - **Session Storage**: Maintains conversation state until page refresh for anonymous users
  - **Component Reuse**: Leveraged existing ElevenLabs components and conversation workflow
  - **Proper Timing**: SSE registration happens in onConnect callback when conversation ID is known, not on page load
- June 25, 2025: **TECH DEBT CLEANUP COMPLETED** - Comprehensive codebase cleanup and optimization
  - **TypeScript Improvements**: Removed 100+ `any` types, added proper type annotations for API responses and webhook data
  - **Import Optimization**: Cleaned up unused imports, removed duplicate dependencies, added centralized UI component exports
  - **Console Log Cleanup**: Removed 50+ debug console.log statements, keeping only essential error logging
  - **UI Component Pruning**: Removed 20+ unused shadcn/ui components (pagination, tabs, sidebar, etc.) reducing bundle size
  - **Code Quality**: Fixed function signature types, improved webhook payload type safety, removed dead code
  - **Storage Page Update**: Updated to reflect current PostgreSQL database architecture instead of legacy file storage
  - **Performance**: Optimized component re-renders, removed unnecessary state updates and debugging code
  - **Maintainability**: Added proper error handling, removed legacy code paths, simplified complex functions
- June 25, 2025: **CONVERSATION END MODAL FLOW COMPLETED** - Full end-to-end conversation flow with proper state management
  - **Modal Implementation**: ConversationEndModal appears immediately after conversation end with spinner state
  - **Race Condition Resolution**: Modal polls for conversation.status === 'completed' AND conversation.review exists before showing CTA
  - **Proper ID Handling**: Modal uses separate modalConversationId to persist ElevenLabs ID through state changes
  - **Navigation Flow**: CTA button redirects to correct database conversation ID (/conversation/82 vs ElevenLabs ID)
  - **Error State Handling**: Conversation page gracefully handles incomplete review states with processing indicator
  - **No Arbitrary Waits**: System uses proper state validation instead of timing assumptions
  - **Complete Integration**: End conversation → modal spinner → review complete → CTA → conversation page with full data
- June 25, 2025: **TEST SUITE IMPLEMENTED AND VALIDATED** - Complete refactor testing completed
  - **Created comprehensive test suite**: 20 tests covering database operations, Braintrust integration, review analysis, and API endpoints
  - **Validated refactored architecture**: All core functionality working with simplified data model (transcripts in JSONB, merged reviews, no file storage)
  - **Confirmed data integrity**: Proper null handling for missing reviews, index-based merging working correctly
  - **API endpoints functional**: Conversation creation, review generation, and transcript storage all operational
  - **Legacy code completely removed**: No improvements table, file storage, or backward compatibility code remaining
- June 25, 2025: **MAJOR REFACTOR COMPLETED** - Simplified data modeling architecture
  - **Database Schema**: Removed improvements table entirely, updated transcripts to store JSON arrays, reviews now contain merged transcript+review data
  - **Webhook Processing**: Extracts structured TranscriptObject arrays (index, role, message, time_in_call_secs) from ElevenLabs payload
  - **LLM Integration**: Braintrust receives JSON transcript arrays and returns index-based ReviewObject arrays  
  - **Review Storage**: Merges transcript data with LLM reviews by index, stores complete merged data in reviews table
  - **File Storage Removal**: Eliminated all cloudStorage, fileStore, and file system dependencies completely
  - **API Cleanup**: Removed all improvement-related endpoints and backward compatibility code
  - **Data Flow**: Simplified to webhook → transcript extraction → LLM analysis → merged review storage
- June 25, 2025: Added comprehensive documentation and pushed to GitHub
  - Created detailed README.md covering complete system architecture  
  - Documented all third-party integrations (ElevenLabs, Braintrust, PostgreSQL)
  - Added setup instructions for development and production deployment
  - Explained data flow, testing strategy, and security considerations
  - Committed all changes and pushed to GitHub remote repository
- June 25, 2025: Streamlined Braintrust integration with direct invoke() API
  - Replaced complex `loadPrompt()` + OpenAI approach with direct `invoke()` function
  - Simplified response parsing and eliminated JSON parsing errors
  - Uses `conversation-consultant-7a00` prompt from Braintrust project via environment configuration
  - Maintained backward compatibility with existing database schema through adapter layer
  - Improved error handling and reduced code complexity
  - All conversation analysis now uses clean Braintrust invoke pattern
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