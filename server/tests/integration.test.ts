import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { storage } from '../storage';
import './setup';

describe('Integration Tests', () => {
  let app: express.Express;
  let server: any;

  beforeAll(async () => {
    app = express();
    server = await registerRoutes(app);
  });

  describe('Complete conversation flow', () => {
    it('should handle full conversation lifecycle with improvements', async () => {
      // 1. Get demo user
      const userResponse = await request(app)
        .get('/api/user')
        .expect(200);
      
      const user = userResponse.body;

      // 2. Create transcript
      const transcriptResponse = await request(app)
        .post('/api/transcripts')
        .send({
          fileLocation: 'data/transcripts/integration-test.json',
          content: 'User: Hi, how are you? Agent: I am doing well, thank you for asking. How was your weekend?'
        })
        .expect(201);

      const transcript = transcriptResponse.body;

      // 3. Create conversation with transcript
      const conversationResponse = await request(app)
        .post('/api/conversations')
        .send({
          userId: user.id,
          transcriptId: transcript.id,
          elevenlabsConversationId: 'integration_test_conv',
          status: 'completed'
        })
        .expect(201);

      const conversation = conversationResponse.body;

      // 4. Create review
      const reviewResponse = await request(app)
        .post('/api/reviews')
        .send({
          conversationId: conversation.id,
          summary: 'Good conversation with natural flow',
          overallRating: 4
        })
        .expect(201);

      const review = reviewResponse.body;

      // 5. Create improvements for the review
      const improvements = [
        {
          reviewId: review.id,
          transcriptSectionStart: 0,
          transcriptSectionEnd: 20,
          feedbackText: 'Great opening greeting',
          improvementType: 'positive',
          priority: 'high',
          category: 'engagement'
        },
        {
          reviewId: review.id,
          transcriptSectionStart: 40,
          transcriptSectionEnd: 80,
          feedbackText: 'Consider asking follow-up questions',
          improvementType: 'improvement',
          priority: 'medium',
          category: 'conversation_flow'
        }
      ];

      const createdImprovements = [];
      for (const improvement of improvements) {
        const impResponse = await request(app)
          .post('/api/improvements')
          .send(improvement)
          .expect(201);
        createdImprovements.push(impResponse.body);
      }

      // 6. Get all improvements for the review
      const improvementsResponse = await request(app)
        .get(`/api/reviews/${review.id}/improvements`)
        .expect(200);

      expect(improvementsResponse.body).toHaveLength(2);
      expect(improvementsResponse.body[0].improvementType).toBe('positive');
      expect(improvementsResponse.body[1].improvementType).toBe('improvement');

      // 7. Update an improvement
      const updatedImprovementResponse = await request(app)
        .patch(`/api/improvements/${createdImprovements[1].id}`)
        .send({
          priority: 'high',
          feedbackText: 'Updated: Consider asking more follow-up questions to show engagement'
        })
        .expect(200);

      expect(updatedImprovementResponse.body.priority).toBe('high');
      expect(updatedImprovementResponse.body.feedbackText).toContain('Updated:');

      // 8. Get conversation with all related data
      const finalConversationResponse = await request(app)
        .get(`/api/conversations/${conversation.id}`)
        .expect(200);

      expect(finalConversationResponse.body.id).toBe(conversation.id);

      // 9. Get updated transcript
      const finalTranscriptResponse = await request(app)
        .get(`/api/transcripts/${transcript.id}`)
        .expect(200);

      expect(finalTranscriptResponse.body.content).toContain('How was your weekend?');

      // 10. Delete one improvement
      await request(app)
        .delete(`/api/improvements/${createdImprovements[0].id}`)
        .expect(204);

      // 11. Verify improvement was deleted
      const finalImprovementsResponse = await request(app)
        .get(`/api/reviews/${review.id}/improvements`)
        .expect(200);

      expect(finalImprovementsResponse.body).toHaveLength(1);
      expect(finalImprovementsResponse.body[0].id).toBe(createdImprovements[1].id);
    });
  });

  describe('Data relationships and constraints', () => {
    it('should maintain referential integrity', async () => {
      const user = await storage.getUserByEmail("demo@conversly.com");
      
      // Create conversation
      const conversation = await storage.createConversation({
        userId: user!.id,
        status: 'completed'
      });

      // Create review
      const review = await storage.createReview({
        conversationId: conversation.id,
        summary: 'Test review',
        overallRating: 3
      });

      // Create improvement
      const improvementResponse = await request(app)
        .post('/api/improvements')
        .send({
          reviewId: review.id,
          transcriptSectionStart: 0,
          transcriptSectionEnd: 10,
          feedbackText: 'Test feedback',
          improvementType: 'neutral'
        })
        .expect(201);

      // Verify the improvement references the correct review
      expect(improvementResponse.body.reviewId).toBe(review.id);

      // Verify we can get improvements through the review
      const improvementsResponse = await request(app)
        .get(`/api/reviews/${review.id}/improvements`)
        .expect(200);

      expect(improvementsResponse.body).toHaveLength(1);
      expect(improvementsResponse.body[0].id).toBe(improvementResponse.body.id);
    });

    it('should handle edge cases in character positioning', async () => {
      const user = await storage.getUserByEmail("demo@conversly.com");
      const conversation = await storage.createConversation({
        userId: user!.id,
        status: 'completed'
      });
      const review = await storage.createReview({
        conversationId: conversation.id,
        summary: 'Edge case test',
        overallRating: 3
      });

      // Test zero-length improvement
      const zeroLengthResponse = await request(app)
        .post('/api/improvements')
        .send({
          reviewId: review.id,
          transcriptSectionStart: 5,
          transcriptSectionEnd: 5,
          feedbackText: 'Point improvement',
          improvementType: 'neutral'
        })
        .expect(201);

      expect(zeroLengthResponse.body.transcriptSectionStart).toBe(5);
      expect(zeroLengthResponse.body.transcriptSectionEnd).toBe(5);

      // Test overlapping improvements
      await request(app)
        .post('/api/improvements')
        .send({
          reviewId: review.id,
          transcriptSectionStart: 0,
          transcriptSectionEnd: 20,
          feedbackText: 'First improvement',
          improvementType: 'positive'
        })
        .expect(201);

      await request(app)
        .post('/api/improvements')
        .send({
          reviewId: review.id,
          transcriptSectionStart: 10,
          transcriptSectionEnd: 30,
          feedbackText: 'Overlapping improvement',
          improvementType: 'improvement'
        })
        .expect(201);

      // Both should be created successfully
      const improvementsResponse = await request(app)
        .get(`/api/reviews/${review.id}/improvements`)
        .expect(200);

      expect(improvementsResponse.body).toHaveLength(3); // Including zero-length one
    });
  });
});