import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import './setup';

describe('Transcript API Endpoints', () => {
  let app: express.Express;
  let server: any;

  beforeAll(async () => {
    app = express();
    server = await registerRoutes(app);
  });

  describe('POST /api/transcripts', () => {
    it('should create a new transcript', async () => {
      const transcriptData = {
        fileLocation: 'data/transcripts/test-123.json',
        content: 'Test transcript content'
      };

      const response = await request(app)
        .post('/api/transcripts')
        .send(transcriptData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.fileLocation).toBe(transcriptData.fileLocation);
      expect(response.body.content).toBe(transcriptData.content);
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should create transcript with null content', async () => {
      const transcriptData = {
        fileLocation: 'data/transcripts/test-456.json'
      };

      const response = await request(app)
        .post('/api/transcripts')
        .send(transcriptData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.fileLocation).toBe(transcriptData.fileLocation);
      expect(response.body.content).toBeNull();
    });

    it('should reject invalid transcript data', async () => {
      const invalidData = {
        content: 'Missing file location'
      };

      await request(app)
        .post('/api/transcripts')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/transcripts/:id', () => {
    it('should get transcript by id', async () => {
      // First create a transcript
      const createResponse = await request(app)
        .post('/api/transcripts')
        .send({
          fileLocation: 'data/transcripts/get-test.json',
          content: 'Get test content'
        });

      const transcriptId = createResponse.body.id;

      // Then get it
      const response = await request(app)
        .get(`/api/transcripts/${transcriptId}`)
        .expect(200);

      expect(response.body.id).toBe(transcriptId);
      expect(response.body.fileLocation).toBe('data/transcripts/get-test.json');
      expect(response.body.content).toBe('Get test content');
    });

    it('should return 404 for non-existent transcript', async () => {
      await request(app)
        .get('/api/transcripts/999')
        .expect(404);
    });

    it('should return 400 for invalid id', async () => {
      await request(app)
        .get('/api/transcripts/invalid')
        .expect(400);
    });
  });

  describe('PATCH /api/transcripts/:id', () => {
    it('should update transcript content', async () => {
      // Create transcript
      const createResponse = await request(app)
        .post('/api/transcripts')
        .send({
          fileLocation: 'data/transcripts/update-test.json',
          content: 'Original content'
        });

      const transcriptId = createResponse.body.id;

      // Update it
      const updateData = {
        content: 'Updated content'
      };

      const response = await request(app)
        .patch(`/api/transcripts/${transcriptId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.content).toBe('Updated content');
      expect(response.body.fileLocation).toBe('data/transcripts/update-test.json');
    });

    it('should return 404 for non-existent transcript', async () => {
      await request(app)
        .patch('/api/transcripts/999')
        .send({ content: 'Updated' })
        .expect(404);
    });
  });
});