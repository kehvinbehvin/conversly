import { analyzeConversationWithBraintrust } from "./braintrust";
import { storage } from "../storage";
import type {
  Conversation,
  Review,
  TranscriptObject,
  ReviewObject,
  TranscriptWithReview,
} from "@shared/schema";

export async function createReviewWithTranscripts(
  conversationId: number,
  transcriptData: TranscriptObject[],
): Promise<Review | null> {
  try {
    // Convert transcript data to string format for LLM analysis
    const transcriptString = JSON.stringify(transcriptData);

    // Run AI analysis with new input format
    const braintrustResponse =
      await analyzeConversationWithBraintrust(transcriptString);

    // Extract review objects from Braintrust response
    const reviewObjects: ReviewObject[] = braintrustResponse.reviews || [];
    console.log("Review objects from Braintrust:", reviewObjects);

    // Merge transcript data with review data based on index
    const transcriptWithReviews: TranscriptWithReview[] = transcriptData.map(
      (transcriptItem) => {
        const matchingReview = reviewObjects.find(
          (review) => review.index === transcriptItem.index,
        );
        return {
          ...transcriptItem,
          review: matchingReview?.review || null,
        };
      },
    );

    // Generate summary and calculate score based on review categories
    const reviewCount = reviewObjects.length;
    const summary =
      reviewCount > 0
        ? `Conversation analysis completed with ${reviewCount} review items for conversation turns.`
        : "Conversation analysis completed - practice session finished successfully.";

    // Calculate score: +1 for complement, -1 for improvement, 0 for missing category
    const overallRating = reviewObjects.reduce((score, reviewItem) => {
      if (reviewItem.category === "complement") {
        return score + 1;
      } else if (reviewItem.category === "improvement") {
        return score - 1;
      } else {
        // Default to 0 for missing or invalid category data
        return score;
      }
    }, 0);

    // Create review record with merged transcript and review data
    const review = await storage.createReview({
      conversationId,
      summary,
      overallRating,
      transcriptWithReviews: transcriptWithReviews,
    });

    return review;
  } catch (error) {
    console.error("Error creating review with transcripts:", error);
    return null;
  }
}

export async function getReviewWithTranscripts(reviewId: number) {
  try {
    const review = await storage.getReview(reviewId);
    if (!review) return null;

    // The transcriptWithReviews data is already stored in the review record
    return review;
  } catch (error) {
    console.error("Error getting review with transcripts:", error);
    return null;
  }
}
