import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adaptBraintrustResponseToLegacy } from '../services/braintrust';
import type { BraintrustResponse } from '../services/braintrust';

describe('Braintrust Integration Tests', () => {
  describe('adaptBraintrustResponseToLegacy', () => {
    const testTranscript = `agent: Hi there! How was your weekend?
user: It was okay.
agent: That's great to hear! Did you do anything fun or interesting?
user: Not really.
agent: I see. Sometimes relaxing weekends are the best kind. Did you get a chance to spend time with friends or family?
user: No.
agent: That's totally fine. Everyone needs some alone time. Did you at least get some good rest?
user: Yeah.`;

    it('should convert Braintrust response to legacy format', () => {
      const braintrustResponse: BraintrustResponse = {
        improvements: [
          {
            location: "It was okay.",
            improvement: "Try sharing a specific detail about your weekend, like 'It was relaxing - I caught up on some reading' to give the conversation more substance.",
            reasoning: "Research shows that providing specific details rather than generic responses helps maintain conversational flow and gives the other person opportunities to ask follow-up questions."
          },
          {
            location: "Not really.",
            improvement: "Consider responding with something like 'Nothing too exciting, but sometimes that's nice. How about you - did you have any adventures?' to redirect attention back to the other person.",
            reasoning: "Effective conversation involves reciprocal sharing and showing interest in others, which helps build rapport and keeps the dialogue engaging."
          }
        ]
      };

      const result = adaptBraintrustResponseToLegacy(braintrustResponse, testTranscript);

      // Verify structure
      expect(result).toHaveProperty('highlights');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('overallRating');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('strengths');
      expect(result).toHaveProperty('improvements');

      // Verify types
      expect(Array.isArray(result.highlights)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(Array.isArray(result.strengths)).toBe(true);
      expect(Array.isArray(result.improvements)).toBe(true);
      expect(typeof result.summary).toBe('string');
      expect(typeof result.overallRating).toBe('number');
      expect(result.overallRating).toBeGreaterThanOrEqual(1);
      expect(result.overallRating).toBeLessThanOrEqual(5);

      // Verify improvements mapping
      expect(result.improvements).toHaveLength(2);
      expect(result.improvements[0].feedbackText).toContain('specific detail');
      expect(result.improvements[0].improvementType).toBe('improvement');
      expect(result.improvements[0].priority).toBe('medium');
      expect(result.improvements[0].transcriptSectionStart).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty improvements', () => {
      const emptyResponse: BraintrustResponse = { improvements: [] };
      const result = adaptBraintrustResponseToLegacy(emptyResponse, testTranscript);

      expect(result.improvements).toHaveLength(0);
      expect(result.summary).toContain('successfully');
      expect(result.overallRating).toBe(4); // Better rating for fewer improvements
    });

    it('should map character positions correctly', () => {
      const response: BraintrustResponse = {
        improvements: [
          {
            location: "It was okay.",
            improvement: "Share more details",
            reasoning: "Better engagement"
          }
        ]
      };

      const result = adaptBraintrustResponseToLegacy(response, testTranscript);
      const improvement = result.improvements[0];

      // "It was okay." should be found in the transcript
      const expectedStart = testTranscript.indexOf("It was okay.");
      expect(improvement.transcriptSectionStart).toBe(expectedStart);
      expect(improvement.transcriptSectionEnd).toBe(expectedStart + "It was okay.".length);
    });

    it('should handle missing location text gracefully', () => {
      const response: BraintrustResponse = {
        improvements: [
          {
            location: "This text doesn't exist in transcript",
            improvement: "Some improvement",
            reasoning: "Some reasoning"
          }
        ]
      };

      const result = adaptBraintrustResponseToLegacy(response, testTranscript);
      const improvement = result.improvements[0];

      expect(improvement.transcriptSectionStart).toBe(0);
      expect(improvement.transcriptSectionEnd).toBe(0);
      expect(improvement.feedbackText).toBe("Some improvement");
    });

    it('should calculate rating based on improvement count', () => {
      const fewImprovements: BraintrustResponse = { 
        improvements: [
          { location: "test", improvement: "test", reasoning: "test" }
        ]
      };
      
      const manyImprovements: BraintrustResponse = { 
        improvements: Array(10).fill({
          location: "test", improvement: "test", reasoning: "test"
        })
      };

      const fewResult = adaptBraintrustResponseToLegacy(fewImprovements, testTranscript);
      const manyResult = adaptBraintrustResponseToLegacy(manyImprovements, testTranscript);

      expect(fewResult.overallRating).toBeGreaterThan(manyResult.overallRating);
      expect(fewResult.overallRating).toBeLessThanOrEqual(5);
      expect(manyResult.overallRating).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Data Structure Validation', () => {
    it('should validate BraintrustResponse structure', () => {
      const validResponse: BraintrustResponse = {
        improvements: [
          {
            location: "user: It was okay.",
            improvement: "Try to be more specific about what made your weekend okay.",
            reasoning: "Specific details help maintain conversational engagement and provide opportunities for follow-up questions."
          }
        ]
      };

      expect(validResponse.improvements).toHaveLength(1);
      expect(validResponse.improvements[0]).toHaveProperty('location');
      expect(validResponse.improvements[0]).toHaveProperty('improvement');
      expect(validResponse.improvements[0]).toHaveProperty('reasoning');
      expect(typeof validResponse.improvements[0].location).toBe('string');
      expect(typeof validResponse.improvements[0].improvement).toBe('string');
      expect(typeof validResponse.improvements[0].reasoning).toBe('string');
    });

    it('should ensure all required fields are present', () => {
      const improvement = {
        location: "user: No.",
        improvement: "Consider sharing why you didn't spend time with others, or ask about their social activities.",
        reasoning: "This shows engagement and helps maintain conversational balance."
      };

      // Test that our improvement structure matches expected schema
      expect(improvement.location).toBeTruthy();
      expect(improvement.improvement).toBeTruthy();
      expect(improvement.reasoning).toBeTruthy();
      expect(improvement.location.length).toBeGreaterThan(0);
      expect(improvement.improvement.length).toBeGreaterThan(0);
      expect(improvement.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Points', () => {
    it('should work with existing database schema', () => {
      const braintrustResponse: BraintrustResponse = {
        improvements: [
          {
            location: "Yeah.",
            improvement: "You could expand on this by saying something like 'Yeah, I actually slept in until noon - it was great!'",
            reasoning: "Adding personal details makes the conversation more engaging and gives the other person something to respond to."
          }
        ]
      };

      const legacyFormat = adaptBraintrustResponseToLegacy(braintrustResponse, "user: Yeah.");
      const improvement = legacyFormat.improvements[0];

      // Verify it matches database schema requirements
      expect(improvement).toHaveProperty('transcriptSectionStart');
      expect(improvement).toHaveProperty('transcriptSectionEnd');
      expect(improvement).toHaveProperty('feedbackText');
      expect(improvement).toHaveProperty('improvementType');
      expect(improvement).toHaveProperty('priority');
      expect(improvement).toHaveProperty('category');

      expect(typeof improvement.transcriptSectionStart).toBe('number');
      expect(typeof improvement.transcriptSectionEnd).toBe('number');
      expect(typeof improvement.feedbackText).toBe('string');
      expect(['positive', 'improvement', 'neutral']).toContain(improvement.improvementType);
      expect(['high', 'medium', 'low']).toContain(improvement.priority);
    });

    it('should maintain backward compatibility', () => {
      const response: BraintrustResponse = {
        improvements: [
          {
            location: "user: Not really.",
            improvement: "Instead of 'Not really', try 'Nothing too exciting, but I did catch up on some sleep. What about you?'",
            reasoning: "This response acknowledges the question while redirecting focus to the other person, which is a key conversational skill."
          }
        ]
      };

      const legacy = adaptBraintrustResponseToLegacy(response, "agent: Question?\nuser: Not really.");

      // Should have all legacy fields even if empty
      expect(legacy.highlights).toEqual([]);
      expect(legacy.suggestions).toEqual([]);
      expect(legacy.strengths).toEqual([]);
      expect(legacy.summary).toBeTruthy();
      expect(legacy.overallRating).toBeTruthy();
      expect(legacy.improvements.length).toBeGreaterThan(0);
    });
  });
});