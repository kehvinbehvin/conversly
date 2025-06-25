import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { storage } from '../storage';
import './setup';

describe('Improvement API Endpoints', () => {
  let app: express.Express;
  let server: any;

  beforeAll(async () => {
    app = express();
    server = await registerRoutes(app);
  });

  describe('POST /api/improvements', () => {
    it('should create a new improvement', async () => {
      // First create a user, conversation, and review
      const user = await storage.getUserByEmail("demo@conversly.com");
      const conversation = await storage.createConversation({
        userId: user!.id,
        status: "completed"
      });
      const review = await storage.createReview({
        conversationId: conversation.id,
        summary: "Test review",
        overallRating: 4
      });

      const improvementData = {
        reviewId: review.id,
        transcriptSectionStart: 10,
        transcriptSectionEnd: 50,
        feedbackText: "Great use of active listening here",
        improvementType: "positive",
        priority: "high",
        category: "engagement"
      };

      const response = await request(app)
        .post('/api/improvements')
        .send(improvementData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.reviewId).toBe(review.id);
      expect(response.body.transcriptSectionStart).toBe(10);
      expect(response.body.transcriptSectionEnd).toBe(50);
      expect(response.body.feedbackText).toBe("Great use of active listening here");
      expect(response.body.improvementType).toBe("positive");
      expect(response.body.priority).toBe("high");
      expect(response.body.category).toBe("engagement");
    });

    it('should create improvement with default priority', async () => {
      const user = await storage.getUserByEmail("demo@conversly.com");
      const conversation = await storage.createConversation({
        userId: user!.id,
        status: "completed"
      });
      const review = await storage.createReview({
        conversationId: conversation.id,
        summary: "Test review",
        overallRating: 3
      });

      const improvementData = {
        reviewId: review.id,
        transcriptSectionStart: 0,
        transcriptSectionEnd: 20,
        feedbackText: "Consider speaking more slowly",
        improvementType: "improvement"
      };

      const response = await request(app)
        .post('/api/improvements')
        .send(improvementData)
        .expect(201);

      expect(response.body.priority).toBe("medium");
      expect(response.body.category).toBeNull();
    });

    it('should reject invalid improvement data', async () => {
      const invalidData = {
        transcriptSectionStart: 10,
        feedbackText: "Missing required fields"
      };

      await request(app)
        .post('/api/improvements')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/improvements/:id', () => {
    it('should get improvement by id', async () => {
      // Setup data
      const user = await storage.getUserByEmail("demo@conversly.com");
      const conversation = await storage.createConversation({
        userId: user!.id,
        status: "completed"
      });
      const review = await storage.createReview({
        conversationId: conversation.id,
        summary: "Test review",
        overallRating: 4
      });

      // Create improvement
      const createResponse = await request(app)
        .post('/api/improvements')
        .send({
          reviewId: review.id,
          transcriptSectionStart: 5,
          transcriptSectionEnd: 25,
          feedbackText: "Good eye contact maintained",
          improvementType: "positive",
          priority: "medium",
          category: "nonverbal"
        });

      const improvementId = createResponse.body.id;

      // Get improvement
      const response = await request(app)
        .get(`/api/improvements/${improvementId}`)
        .expect(200);

      expect(response.body.id).toBe(improvementId);
      expect(response.body.feedbackText).toBe("Good eye contact maintained");
      expect(response.body.category).toBe("nonverbal");
    });

    it('should return 404 for non-existent improvement', async () => {
      await request(app)
        .get('/api/improvements/999')
        .expect(404);
    });
  });

  describe('GET /api/reviews/:reviewId/improvements', () => {
    it('should get all improvements for a review', async () => {
      // Setup data
      const user = await storage.getUserByEmail("demo@conversly.com");
      const conversation = await storage.createConversation({
        userId: user!.id,
        status: "completed"
      });
      const review = await storage.createReview({
        conversationId: conversation.id,
        summary: "Test review",
        overallRating: 4
      });

      // Create multiple improvements
      const improvements = [
        {
          reviewId: review.id,
          transcriptSectionStart: 0,
          transcriptSectionEnd: 20,
          feedbackText: "Strong opening",
          improvementType: "positive",
          priority: "high"
        },
        {
          reviewId: review.id,
          transcriptSectionStart: 30,
          transcriptSectionEnd: 60,
          feedbackText: "Could be more specific",
          improvementType: "improvement",
          priority: "medium"
        },
        {
          reviewId: review.id,
          transcriptSectionStart: 70,
          transcriptSectionEnd: 90,
          feedbackText: "Good conclusion",
          improvementType: "positive",
          priority: "low"
        }
      ];

      for (const improvement of improvements) {
        await request(app)
          .post('/api/improvements')
          .send(improvement);
      }

      // Get all improvements for the review
      const response = await request(app)
        .get(`/api/reviews/${review.id}/improvements`)
        .expect(200);

      expect(response.body).toHaveLength(3);
      // Should be sorted by transcript section start
      expect(response.body[0].transcriptSectionStart).toBe(0);
      expect(response.body[1].transcriptSectionStart).toBe(30);
      expect(response.body[2].transcriptSectionStart).toBe(70);
    });

    it('should return empty array for review with no improvements', async () => {
      const user = await storage.getUserByEmail("demo@conversly.com");
      const conversation = await storage.createConversation({
        userId: user!.id,
        status: "completed"
      });
      const review = await storage.createReview({
        conversationId: conversation.id,
        summary: "Test review",
        overallRating: 3
      });

      const response = await request(app)
        .get(`/api/reviews/${review.id}/improvements`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('PATCH /api/improvements/:id', () => {
    it('should update improvement', async () => {
      // Setup
      const user = await storage.getUserByEmail("demo@conversly.com");
      const conversation = await storage.createConversation({
        userId: user!.id,
        status: "completed"
      });
      const review = await storage.createReview({
        conversationId: conversation.id,
        summary: "Test review",
        overallRating: 4
      });

      const createResponse = await request(app)
        .post('/api/improvements')
        .send({
          reviewId: review.id,
          transcriptSectionStart: 10,
          transcriptSectionEnd: 30,
          feedbackText: "Original feedback",
          improvementType: "improvement",
          priority: "low"
        });

      const improvementId = createResponse.body.id;

      // Update
      const updateData = {
        feedbackText: "Updated feedback with more detail",
        priority: "high",
        category: "clarity"
      };

      const response = await request(app)
        .patch(`/api/improvements/${improvementId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.feedbackText).toBe("Updated feedback with more detail");
      expect(response.body.priority).toBe("high");
      expect(response.body.category).toBe("clarity");
      expect(response.body.transcriptSectionStart).toBe(10); // Unchanged
    });
  });

  describe('DELETE /api/improvements/:id', () => {
    it('should delete improvement', async () => {
      // Setup
      const user = await storage.getUserByEmail("demo@conversly.com");
      const conversation = await storage.createConversation({
        userId: user!.id,
        status: "completed"
      });
      const review = await storage.createReview({
        conversationId: conversation.id,
        summary: "Test review",
        overallRating: 4
      });

      const createResponse = await request(app)
        .post('/api/improvements')
        .send({
          reviewId: review.id,
          transcriptSectionStart: 10,
          transcriptSectionEnd: 30,
          feedbackText: "To be deleted",
          improvementType: "neutral"
        });

      const improvementId = createResponse.body.id;

      // Delete
      await request(app)
        .delete(`/api/improvements/${improvementId}`)
        .expect(204);

      // Verify deletion
      await request(app)
        .get(`/api/improvements/${improvementId}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent improvement', async () => {
      await request(app)
        .delete('/api/improvements/999')
        .expect(404);
    });
  });
});