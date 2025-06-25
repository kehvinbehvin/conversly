import { analyzeConversation } from "./openai";
import { storage } from "../storage";
import type { Conversation, Review } from "@shared/schema";

export async function createReviewWithImprovements(conversationId: number, transcriptContent: string): Promise<Review | null> {
  try {
    // Run AI analysis
    const analysis = await analyzeConversation(transcriptContent);
    
    // Create review record
    const review = await storage.createReview({
      conversationId,
      summary: analysis.summary,
      overallRating: analysis.overallRating
    });

    // Create improvement records for each improvement
    for (const improvement of analysis.improvements) {
      await storage.createImprovement({
        reviewId: review.id,
        transcriptSectionStart: improvement.transcriptSectionStart,
        transcriptSectionEnd: improvement.transcriptSectionEnd,
        feedbackText: improvement.feedbackText,
        improvementType: improvement.improvementType,
        priority: improvement.priority || "medium",
        category: improvement.category || null
      });
    }

    return review;
  } catch (error) {
    console.error("Error creating review with improvements:", error);
    return null;
  }
}

export async function getReviewWithImprovements(reviewId: number) {
  try {
    const review = await storage.getReview(reviewId);
    if (!review) return null;

    const improvements = await storage.getImprovementsByReviewId(reviewId);
    
    return {
      ...review,
      improvements
    };
  } catch (error) {
    console.error("Error fetching review with improvements:", error);
    return null;
  }
}