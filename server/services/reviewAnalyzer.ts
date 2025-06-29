import { analyzeConversationWithBraintrust } from "./braintrust";
import { generateNextSteps } from "./nextStepsGenerator";
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

    // Extract review objects and summary from Braintrust response
    const reviewObjects: ReviewObject[] = braintrustResponse.reviews || [];
    const braintrustSummary: string = braintrustResponse.summary || "";
    console.log("Review objects from Braintrust:", reviewObjects);
    console.log("Summary from Braintrust:", braintrustSummary);

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

    // Use Braintrust summary with fallback logic
    const summary = braintrustSummary && braintrustSummary.trim() 
      ? braintrustSummary.trim()
      : "Summary not available";

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

    // Generate next steps based on the review data
    try {
      const nextStepsResponse = await generateNextSteps({
        reviews: reviewObjects,
        summary: braintrustSummary,
      });

      // Create next steps record if generation was successful
      if (nextStepsResponse.steps.length > 0) {
        await storage.createNextSteps({
          conversationId,
          steps: nextStepsResponse,
        });
        console.log("✅ Next steps generated and saved successfully");
      } else {
        console.log("⚠️ No next steps generated - continuing without next steps");
      }
    } catch (nextStepsError) {
      console.error("❌ Next steps generation failed:", nextStepsError);
      // Continue without next steps - conversation flow is not interrupted
    }

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
