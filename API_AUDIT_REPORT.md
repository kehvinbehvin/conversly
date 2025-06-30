# API Endpoint Audit Report
Generated: June 30, 2025

## Server Endpoints Available

### Active Endpoints (Used by Frontend)
```
GET    /api/conversations           - Used by dashboard, history pages
GET    /api/conversations/:id       - Used by conversation detail component  
POST   /api/conversations           - Used by conversation contexts
POST   /api/elevenlabs/signed-url   - Used by conversation contexts
GET    /api/events/:conversationId  - Used by SSE hook for real-time updates
POST   /api/feedback               - Used by feedback form
GET    /api/user                   - Used by dashboard page
GET    /api/user/anonymous         - Used by anonymous conversation context
POST   /api/webhook/elevenlabs     - Used by ElevenLabs webhook processing
```

### Deprecated Endpoints (Not Used by Frontend)
```
GET    /api/transcripts/:id        - @deprecated - Data accessed via conversations endpoint
POST   /api/transcripts            - @deprecated - Data accessed via conversations endpoint  
PATCH  /api/transcripts/:id        - @deprecated - Data accessed via conversations endpoint

GET    /api/reviews/:id            - @deprecated - Data accessed via conversations endpoint
GET    /api/conversations/:conversationId/review - @deprecated - Data accessed via conversations endpoint
POST   /api/reviews                - @deprecated - Data accessed via conversations endpoint
PATCH  /api/reviews/:id            - @deprecated - Data accessed via conversations endpoint

GET    /api/next-steps/:id         - @deprecated - Data accessed via conversations endpoint
GET    /api/conversations/:conversationId/next-steps - @deprecated - Data accessed via conversations endpoint
POST   /api/next-steps             - @deprecated - Data accessed via conversations endpoint
PATCH  /api/next-steps/:id         - @deprecated - Data accessed via conversations endpoint

GET    /api/feedback/:id           - @deprecated - Individual feedback retrieval not used
GET    /api/storage/status         - @deprecated - Storage monitoring page removed with database-only architecture
```

## Frontend API Usage Analysis

### Direct API Calls
- `client/src/components/FeedbackForm.tsx`: POST /api/feedback
- `client/src/contexts/ConversationContext.tsx`: GET /api/user, POST /api/conversations, POST /api/elevenlabs/signed-url
- `client/src/contexts/AnonymousConversationContext.tsx`: GET /api/user/anonymous, POST /api/conversations, POST /api/elevenlabs/signed-url

### TanStack Query Usage
- `client/src/components/ConversationDetail.tsx`: GET /api/conversations/${id}
- `client/src/pages/dashboard.tsx`: GET /api/conversations, GET /api/user
- `client/src/pages/history.tsx`: GET /api/conversations
- `client/src/pages/storage.tsx`: GET /api/storage/status

### SSE Usage
- `client/src/hooks/useSSE.ts`: GET /api/events/${conversationId}

## Issues Resolved

1. **Deprecation Marking**: Marked 14 unused endpoints as deprecated with clear comments
2. **Storage Endpoint Removed**: Deprecated both server endpoint and frontend storage page 
3. **Navigation Cleanup**: Removed storage page link from navigation menu
4. **Architecture Alignment**: Confirmed frontend uses consolidated conversation endpoint instead of individual resource endpoints

## Recommendations

1. **Keep Deprecated Endpoints**: Maintain for backward compatibility and testing until next major version
2. **Monitor Usage**: Add logging to deprecated endpoints to confirm they remain unused
3. **Documentation**: Update API documentation to reflect current usage patterns
4. **Cleanup**: Consider removing deprecated endpoints in next major release after confirming no usage

## System Health

- **Active Endpoints**: 10 endpoints actively used by frontend
- **Deprecated Endpoints**: 13 endpoints marked for future removal  
- **Missing Endpoints**: 1 endpoint added (storage status)
- **Architecture**: Clean separation between public API and internal processing