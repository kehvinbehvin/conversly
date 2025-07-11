import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createReviewWithTranscripts } from '../services/reviewAnalyzer';
import { storage } from '../storage';
import { db } from '../db';
import type { TranscriptObject, ReviewObject } from '@shared/schema';

// Mock the Braintrust service
vi.mock('../services/braintrust', () => ({
  analyzeConversationWithBraintrust: vi.fn()
}));

describe('Review Analyzer', () => {
  let testUserId: number;
  let testConversationId: number;

  beforeEach(async () => {
    // Create test user and conversation
    const user = await storage.createUser({
      email: `test-${Date.now()}@example.com`,
      authProvider: 'local'
    });
    testUserId = user.id;

    const conversation = await storage.createConversation({
      userId: testUserId,
      elevenlabsConversationId: `test_conv_${Date.now()}`,
      status: 'completed'
    });
    testConversationId = conversation.id;
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

  it('should create review with merged transcript and review data', async () => {
    const { analyzeConversationWithBraintrust } = await import('../services/braintrust');
    const mockAnalyze = vi.mocked(analyzeConversationWithBraintrust);

    const transcriptData: TranscriptObject[] = [
      { index: 0, role: 'agent', message: 'Hello there!', time_in_call_secs: 1 },
      { index: 1, role: 'user', message: 'Hi, how are you?', time_in_call_secs: 3 },
      { index: 2, role: 'agent', message: 'I am doing well, thank you!', time_in_call_secs: 5 }
    ];

    const mockReviews: ReviewObject[] = [
      { index: 0, review: 'Good greeting', category: 'complement' },
      { index: 2, review: 'Polite response', category: 'improvement' }
      // Note: missing review for index 1 to test null handling
    ];

    mockAnalyze.mockResolvedValueOnce({ 
      reviews: mockReviews, 
      summary: 'Test conversation analysis completed' 
    });

    const review = await createReviewWithTranscripts(testConversationId, transcriptData);

    expect(review).toBeTruthy();
    expect(review?.conversationId).toBe(testConversationId);
    expect(review?.transcriptWithReviews).toHaveLength(3);
    
    // Check proper merging with null for missing reviews
    expect(review?.transcriptWithReviews[0]).toMatchObject({
      index: 0,
      role: 'agent',
      message: 'Hello there!',
      time_in_call_secs: 1,
      review: 'Good greeting'
    });
    
    expect(review?.transcriptWithReviews[1]).toMatchObject({
      index: 1,
      role: 'user',
      message: 'Hi, how are you?',
      time_in_call_secs: 3,
      review: null // Should be null for missing review
    });
    
    expect(review?.transcriptWithReviews[2]).toMatchObject({
      index: 2,
      role: 'agent',
      message: 'I am doing well, thank you!',
      time_in_call_secs: 5,
      review: 'Polite response'
    });
  });

  it('should calculate score correctly based on review categories', async () => {
    const { analyzeConversationWithBraintrust } = await import('../services/braintrust');
    const mockAnalyze = vi.mocked(analyzeConversationWithBraintrust);

    const transcriptData: TranscriptObject[] = [
      { index: 0, role: 'agent', message: 'Test message 1', time_in_call_secs: 1 },
      { index: 1, role: 'user', message: 'Test message 2', time_in_call_secs: 3 },
      { index: 2, role: 'agent', message: 'Test message 3', time_in_call_secs: 5 }
    ];

    const mockReviews: ReviewObject[] = [
      { index: 0, review: 'Great response', category: 'complement' },
      { index: 1, review: 'Could be better', category: 'improvement' },
      { index: 2, review: 'Good follow-up', category: 'complement' }
    ];

    mockAnalyze.mockResolvedValueOnce({ 
      reviews: mockReviews, 
      summary: 'Overall good conversation with areas for improvement' 
    });

    const review = await createReviewWithTranscripts(testConversationId, transcriptData);

    expect(review?.summary).toBe('Overall good conversation with areas for improvement');
    // Score should be: +1 (complement) -1 (improvement) +1 (complement) = +1
    expect(review?.overallRating).toBe(1);
  });

  it('should handle Braintrust analysis errors gracefully', async () => {
    const { analyzeConversationWithBraintrust } = await import('../services/braintrust');
    const mockAnalyze = vi.mocked(analyzeConversationWithBraintrust);

    const transcriptData: TranscriptObject[] = [
      { index: 0, role: 'agent', message: 'Test message', time_in_call_secs: 1 }
    ];

    mockAnalyze.mockRejectedValueOnce(new Error('Braintrust service error'));

    const review = await createReviewWithTranscripts(testConversationId, transcriptData);

    expect(review).toBe(null);
  });

  it('should handle empty transcript data', async () => {
    const { analyzeConversationWithBraintrust } = await import('../services/braintrust');
    const mockAnalyze = vi.mocked(analyzeConversationWithBraintrust);

    mockAnalyze.mockResolvedValueOnce({ 
      reviews: [], 
      summary: '' 
    });

    const review = await createReviewWithTranscripts(testConversationId, []);

    expect(review?.transcriptWithReviews).toHaveLength(0);
    expect(review?.summary).toBe('Summary not available'); // Fallback when empty
    expect(review?.overallRating).toBe(0); // No reviews = score of 0
  });

  it('should handle missing category data and calculate negative scores', async () => {
    const { analyzeConversationWithBraintrust } = await import('../services/braintrust');
    const mockAnalyze = vi.mocked(analyzeConversationWithBraintrust);

    const transcriptData: TranscriptObject[] = [
      { index: 0, role: 'agent', message: 'Test message 1', time_in_call_secs: 1 },
      { index: 1, role: 'user', message: 'Test message 2', time_in_call_secs: 3 }
    ];

    const mockReviews: ReviewObject[] = [
      { index: 0, review: 'Needs improvement', category: 'improvement' },
      { index: 1, review: 'Poor response', category: 'improvement' }
    ];

    mockAnalyze.mockResolvedValueOnce({ 
      reviews: mockReviews, 
      summary: 'Areas for improvement identified in conversation' 
    });

    const review = await createReviewWithTranscripts(testConversationId, transcriptData);

    // Score should be: -1 (improvement) -1 (improvement) = -2
    expect(review?.overallRating).toBe(-2);
  });
});