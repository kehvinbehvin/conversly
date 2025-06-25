import { beforeEach, afterEach } from 'vitest';
import { storage } from '../storage';

// Reset storage before each test
beforeEach(async () => {
  // Clear in-memory storage
  if ('users' in storage && storage.users instanceof Map) {
    (storage as any).users.clear();
    (storage as any).conversations.clear();
    (storage as any).reviews.clear();
    (storage as any).transcripts.clear();
    (storage as any).improvements.clear();
    (storage as any).currentUserId = 1;
    (storage as any).currentConversationId = 1;
    (storage as any).currentReviewId = 1;
    (storage as any).currentTranscriptId = 1;
    (storage as any).currentImprovementId = 1;
    
    // Recreate demo user
    await storage.createUser({
      email: "demo@conversly.com",
      authProvider: "local"
    });
  }
});

afterEach(async () => {
  // Clean up after each test if needed
});