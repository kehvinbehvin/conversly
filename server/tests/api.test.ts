import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { registerRoutes } from '../routes';
import express from 'express';
import { storage } from '../storage';
import { db } from '../db';

describe('API Endpoints', () => {
  let app: express.Application;
  let server: any;
  let testUserId: number;

  beforeEach(async () => {
    app = express();
    server = await registerRoutes(app);
    
    // Get or create demo user for testing
    let user = await storage.getUserByEmail('demo@conversly.com');
    if (!user) {
      user = await storage.createUser({
        email: 'demo@conversly.com',
        authProvider: 'local'
      });
    }
    testUserId = user.id;
  });

  afterEach(async () => {
    // Clean up test data using storage interface
    try {
      if (testUserId) {
        const conversations = await storage.getConversationsByUserId(testUserId);
        for (const conv of conversations) {
          const review = await storage.getReviewByConversationId(conv.id);
          if (review) {
            await db.execute(`DELETE FROM reviews WHERE id = ${review.id}`);
          }
        }
        await db.execute(`DELETE FROM conversations WHERE user_id = ${testUserId}`);
        // Don't delete demo user as it's shared
        if (testUserId && testUserId !== 147) { // 147 is likely the demo user ID
          await db.execute(`DELETE FROM users WHERE id = ${testUserId}`);
        }
      }
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
    if (server) {
      server.close();
    }
  });

  describe('Conversations API', () => {
    it('should create conversation successfully', async () => {
      const conversationData = {
        elevenlabsConversationId: 'test_conv_123',
        status: 'pending'
      };

      const response = await request(app)
        .post('/api/conversations')
        .send(conversationData)
        .expect(201);

      expect(response.body.id).toBeTypeOf('number');
      expect(response.body.userId).toBe(testUserId);
      expect(response.body.elevenlabsConversationId).toBe('test_conv_123');
      expect(response.body.status).toBe('pending');
    });

    it('should list conversations for demo user', async () => {
      // Create a test conversation first
      await storage.createConversation({
        userId: testUserId,
        elevenlabsConversationId: 'test_conv_456',
        status: 'completed'
      });

      const response = await request(app)
        .get('/api/conversations')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('userId');
    });

    it('should get specific conversation by ID', async () => {
      const conversation = await storage.createConversation({
        userId: testUserId,
        elevenlabsConversationId: 'test_conv_789',
        status: 'completed'
      });

      const response = await request(app)
        .get(`/api/conversations/${conversation.id}`)
        .expect(200);

      expect(response.body.id).toBe(conversation.id);
      expect(response.body.elevenlabsConversationId).toBe('test_conv_789');
    });
  });


  describe('Transcripts API', () => {
    it('should create transcript with JSONB data', async () => {
      const transcriptData = {
        transcriptData: [
          { index: 0, role: 'agent', message: 'Hello!', time_in_call_secs: 1 },
          { index: 1, role: 'user', message: 'Hi there!', time_in_call_secs: 3 }
        ]
      };

      const response = await request(app)
        .post('/api/transcripts')
        .send(transcriptData)
        .expect(201);

      expect(response.body.id).toBeTypeOf('number');
      expect(Array.isArray(response.body.transcriptData)).toBe(true);
      expect(response.body.transcriptData).toHaveLength(2);
      expect(response.body.transcriptData[0]).toMatchObject({
        index: 0,
        role: 'agent',
        message: 'Hello!',
        time_in_call_secs: 1
      });
    });
  });
});