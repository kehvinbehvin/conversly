import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { storage } from '../storage';
import './setup';

describe('Conversation API Endpoints', () => {
  let app: express.Express;
  let server: any;

  beforeAll(async () => {
    app = express();
    server = await registerRoutes(app);
  });

  describe('GET /api/user', () => {
    it('should get demo user', async () => {
      const response = await request(app)
        .get('/api/user')
        .expect(200);

      expect(response.body.email).toBe('demo@conversly.com');
      expect(response.body.authProvider).toBe('local');
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('createdAt');
    });
  });

  describe('POST /api/conversations', () => {
    it('should create a new conversation', async () => {
      const userId = (global as any).testUserId;
      
      const conversationData = {
        userId,
        elevenlabsConversationId: 'test_conv_123'
      };

      const response = await request(app)
        .post('/api/conversations')
        .send(conversationData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(userId);
      expect(response.body.elevenlabsConversationId).toBe('test_conv_123');
      expect(response.body.status).toBe('pending');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should reject conversation without userId', async () => {
      const invalidData = {
        elevenlabsConversationId: 'test_conv_456'
      };

      await request(app)
        .post('/api/conversations')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/conversations', () => {
    it('should get all conversations for demo user', async () => {
      const userId = (global as any).testUserId;
      
      // Create test conversations
      await storage.createConversation({
        userId,
        elevenlabsConversationId: 'conv_1',
        status: 'completed'
      });
      
      await storage.createConversation({
        userId,
        elevenlabsConversationId: 'conv_2', 
        status: 'pending'
      });

      const response = await request(app)
        .get('/api/conversations')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('userId');
      expect(response.body[0]).toHaveProperty('status');
      expect(response.body[0]).toHaveProperty('createdAt');
    });

    it('should include reviews in conversation response', async () => {
      const userId = (global as any).testUserId;
      
      // Create conversation
      const conversation = await storage.createConversation({
        userId,
        elevenlabsConversationId: 'conv_with_review',
        status: 'analyzed'
      });

      // Create review for the conversation
      await storage.createReview({
        conversationId: conversation.id,
        summary: 'Great conversation with room for improvement',
        overallRating: 4
      });

      const response = await request(app)
        .get('/api/conversations')
        .expect(200);

      const conversationWithReview = response.body.find(
        (c: any) => c.elevenlabsConversationId === 'conv_with_review'
      );

      expect(conversationWithReview).toBeDefined();
      expect(conversationWithReview.review).toBeDefined();
      expect(conversationWithReview.review.summary).toBe('Great conversation with room for improvement');
      expect(conversationWithReview.review.overallRating).toBe(4);
    });
  });

  describe('GET /api/conversations/:id', () => {
    it('should get specific conversation by id', async () => {
      const userId = (global as any).testUserId;
      
      const conversation = await storage.createConversation({
        userId,
        elevenlabsConversationId: 'specific_conv',
        status: 'completed'
      });

      const response = await request(app)
        .get(`/api/conversations/${conversation.id}`)
        .expect(200);

      expect(response.body.id).toBe(conversation.id);
      expect(response.body.elevenlabsConversationId).toBe('specific_conv');
      expect(response.body.status).toBe('completed');
    });

    it('should return 404 for non-existent conversation', async () => {
      await request(app)
        .get('/api/conversations/999')
        .expect(404);
    });
  });

  describe('POST /api/elevenlabs/signed-url', () => {
    it('should handle missing API key gracefully', async () => {
      const response = await request(app)
        .post('/api/elevenlabs/signed-url')
        .send({ agentId: 'test_agent_123' });

      // Should either succeed (if API key is present) or fail with 500 (if missing)
      if (response.status === 200) {
        expect(response.body).toHaveProperty('signedUrl');
        expect(response.body.signedUrl).toContain('conversationId=');
      } else {
        expect(response.status).toBe(500);
        expect(response.body.message).toContain('Failed to generate signed URL');
      }
    });

    it('should handle default agent configuration', async () => {
      const response = await request(app)
        .post('/api/elevenlabs/signed-url')
        .send({});

      // Should either succeed or fail gracefully
      if (response.status === 200) {
        expect(response.body).toHaveProperty('signedUrl');
      } else {
        expect(response.status).toBe(500);
      }
    });
  });
});