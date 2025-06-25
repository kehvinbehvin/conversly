import { describe, it, expect, vi } from 'vitest';
import { analyzeConversationWithBraintrust } from '../services/braintrust';
import type { TranscriptObject, ReviewObject } from '@shared/schema';

// Mock the braintrust invoke function
vi.mock('braintrust', () => ({
  invoke: vi.fn()
}));

describe('Braintrust Integration', () => {
  const mockTranscriptData: TranscriptObject[] = [
    { index: 0, role: 'agent', message: 'Hello, how can I help you?', time_in_call_secs: 1 },
    { index: 1, role: 'user', message: 'I need some assistance with my account', time_in_call_secs: 5 },
    { index: 2, role: 'agent', message: 'I can help with that. What specific issue are you having?', time_in_call_secs: 8 }
  ];

  it('should process valid Braintrust response with reviews', async () => {
    const { invoke } = await import('braintrust');
    const mockInvoke = vi.mocked(invoke);

    const mockBraintrustResponse = {
      reviews: [
        { index: 0, review: 'Good opening greeting' },
        { index: 1, review: 'Clear problem statement from user' },
        { index: 2, review: 'Helpful follow-up question' }
      ]
    };

    mockInvoke.mockResolvedValueOnce(mockBraintrustResponse);

    const result = await analyzeConversationWithBraintrust(JSON.stringify(mockTranscriptData));

    expect(result.reviews).toHaveLength(3);
    expect(result.reviews[0]).toMatchObject({
      index: 0,
      review: 'Good opening greeting'
    });
    expect(result.reviews[1]).toMatchObject({
      index: 1,
      review: 'Clear problem statement from user'
    });
  });

  it('should handle array response format', async () => {
    const { invoke } = await import('braintrust');
    const mockInvoke = vi.mocked(invoke);

    const mockArrayResponse: ReviewObject[] = [
      { index: 0, review: 'First review' },
      { index: 1, review: 'Second review' }
    ];

    mockInvoke.mockResolvedValueOnce(mockArrayResponse);

    const result = await analyzeConversationWithBraintrust(JSON.stringify(mockTranscriptData));

    expect(result.reviews).toHaveLength(2);
    expect(result.reviews[0].review).toBe('First review');
    expect(result.reviews[1].review).toBe('Second review');
  });

  it('should filter out invalid review objects', async () => {
    const { invoke } = await import('braintrust');
    const mockInvoke = vi.mocked(invoke);

    const mockResponseWithInvalid = {
      reviews: [
        { index: 0, review: 'Valid review' },
        { index: 'invalid', review: 'Invalid index type' }, // Invalid: index should be number
        { index: 1 }, // Invalid: missing review
        { index: 2, review: 'Another valid review' }
      ]
    };

    mockInvoke.mockResolvedValueOnce(mockResponseWithInvalid);

    const result = await analyzeConversationWithBraintrust(JSON.stringify(mockTranscriptData));

    expect(result.reviews).toHaveLength(2);
    expect(result.reviews[0]).toMatchObject({ index: 0, review: 'Valid review' });
    expect(result.reviews[1]).toMatchObject({ index: 2, review: 'Another valid review' });
  });

  it('should handle Braintrust errors', async () => {
    const { invoke } = await import('braintrust');
    const mockInvoke = vi.mocked(invoke);

    mockInvoke.mockRejectedValueOnce(new Error('Braintrust API error'));

    await expect(analyzeConversationWithBraintrust(JSON.stringify(mockTranscriptData)))
      .rejects.toThrow('Failed to analyze conversation with Braintrust: Braintrust API error');
  });

  it('should validate input JSON format', async () => {
    await expect(analyzeConversationWithBraintrust('invalid json'))
      .rejects.toThrow();
  });
});