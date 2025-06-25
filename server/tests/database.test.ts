import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { storage } from '../storage';
import { db } from '../db';
import type { TranscriptObject, ReviewObject } from '@shared/schema';

describe('Database Operations', () => {
  let testUserId: number;
  let testConversationId: number;

  beforeEach(async () => {
    // Create test user
    const user = await storage.createUser({
      email: `test-${Date.now()}@example.com`,
      authProvider: 'local'
    });
    testUserId = user.id;
  });

  afterEach(async () => {
    // Clean up test data using storage interface
    try {
      if (testConversationId) {
        const review = await storage.getReviewByConversationId(testConversationId);
        if (review) {
          await db.execute(`DELETE FROM reviews WHERE id = ${review.id}`);
        }
        await db.execute(`DELETE FROM conversations WHERE id = ${testConversationId}`);
      }
      if (testUserId) {
        await db.execute(`DELETE FROM users WHERE id = ${testUserId}`);
      }
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  });

  describe('Conversations', () => {
    it('should create conversation with proper structure', async () => {
      const conversation = await storage.createConversation({
        userId: testUserId,
        elevenlabsConversationId: 'test_conv_123',
        status: 'pending'
      });

      expect(conversation.id).toBeTypeOf('number');
      expect(conversation.userId).toBe(testUserId);
      expect(conversation.elevenlabsConversationId).toBe('test_conv_123');
      expect(conversation.status).toBe('pending');
      testConversationId = conversation.id;
    });

    it('should update conversation status', async () => {
      const conversation = await storage.createConversation({
        userId: testUserId,
        elevenlabsConversationId: 'test_conv_456',
        status: 'pending'
      });
      testConversationId = conversation.id;

      const updated = await storage.updateConversation(conversation.id, {
        status: 'completed'
      });

      expect(updated?.status).toBe('completed');
    });
  });

  describe('Transcripts', () => {
    it('should create transcript with JSONB data', async () => {
      const transcriptData: TranscriptObject[] = [
        { index: 0, role: 'agent', message: 'Hello there!', time_in_call_secs: 1 },
        { index: 1, role: 'user', message: 'Hi, how are you?', time_in_call_secs: 3 }
      ];

      const transcript = await storage.createTranscript({
        transcriptData: transcriptData
      });

      expect(transcript.id).toBeTypeOf('number');
      expect(Array.isArray(transcript.transcriptData)).toBe(true);
      expect(transcript.transcriptData).toHaveLength(2);
      expect(transcript.transcriptData[0]).toMatchObject({
        index: 0,
        role: 'agent',
        message: 'Hello there!',
        time_in_call_secs: 1
      });
    });
  });

  describe('Reviews', () => {
    it('should create review with merged transcript and review data', async () => {
      // Create conversation first
      const conversation = await storage.createConversation({
        userId: testUserId,
        elevenlabsConversationId: 'test_conv_789',
        status: 'completed'
      });
      testConversationId = conversation.id;

      const transcriptWithReviews = [
        { 
          index: 0, 
          role: 'agent' as const, 
          message: 'Hello there!', 
          time_in_call_secs: 1,
          review: 'Good opening greeting'
        },
        { 
          index: 1, 
          role: 'user' as const, 
          message: 'Hi, how are you?', 
          time_in_call_secs: 3,
          review: null
        }
      ];

      const review = await storage.createReview({
        conversationId: conversation.id,
        summary: 'Test conversation analysis',
        overallRating: 4,
        transcriptWithReviews: transcriptWithReviews
      });

      expect(review.id).toBeTypeOf('number');
      expect(review.conversationId).toBe(conversation.id);
      expect(review.summary).toBe('Test conversation analysis');
      expect(review.overallRating).toBe(4);
      expect(Array.isArray(review.transcriptWithReviews)).toBe(true);
      expect(review.transcriptWithReviews).toHaveLength(2);
      expect(review.transcriptWithReviews[0].review).toBe('Good opening greeting');
      expect(review.transcriptWithReviews[1].review).toBe(null);
    });

    it('should retrieve review by conversation ID', async () => {
      // Create conversation
      const conversation = await storage.createConversation({
        userId: testUserId,
        elevenlabsConversationId: 'test_conv_review',
        status: 'completed'
      });
      testConversationId = conversation.id;

      // Create review
      const transcriptWithReviews = [
        { 
          index: 0, 
          role: 'agent' as const, 
          message: 'Test message', 
          time_in_call_secs: 1,
          review: 'Test review'
        }
      ];

      await storage.createReview({
        conversationId: conversation.id,
        summary: 'Test summary',
        overallRating: 3,
        transcriptWithReviews: transcriptWithReviews
      });

      const retrievedReview = await storage.getReviewByConversationId(conversation.id);
      expect(retrievedReview).toBeTruthy();
      expect(retrievedReview?.conversationId).toBe(conversation.id);
      expect(retrievedReview?.summary).toBe('Test summary');
    });
  });
});