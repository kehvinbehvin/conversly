import { invoke } from "braintrust";
import type { ReviewObject, TranscriptObject } from "@shared/schema";

export interface BraintrustResponse {
  reviews: ReviewObject[];
}

export async function analyzeConversationWithBraintrust(
  transcriptJson: string,
): Promise<BraintrustResponse> {
  try {
    // Parse the JSON string to validate transcript data format
    const transcriptData: TranscriptObject[] = JSON.parse(transcriptJson);

    const result = await invoke({
      projectName: process.env.BRAINTRUST_PROJECT_NAME || "Yappy-first-project",
      slug: "conversation-consultant-7a00",
      input: { transcript: transcriptJson },
    });

    // Handle the new response format with reviews
    let reviews: ReviewObject[] = [];
    if (result.reviews && Array.isArray(result.reviews)) {
      reviews = result.reviews;
    } else if (Array.isArray(result)) {
      reviews = result;
    }

    const validatedReviews = reviews
      .map((item, index) => {
        if (typeof item.index !== 'number' || !item.review) {
          console.warn(`Skipping invalid review at index ${index}:`, item);
          return null;
        }
        return {
          index: item.index,
          review: String(item.review),
          category: item.category || undefined, // Preserve category field from LLM response
        };
      })
      .filter(Boolean) as ReviewObject[];

    return { reviews: validatedReviews };
  } catch (error) {
    console.error("Braintrust analysis error:", error);
    throw new Error(
      "Failed to analyze conversation with Braintrust: " +
        (error as Error).message,
    );
  }
}