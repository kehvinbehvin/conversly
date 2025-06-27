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

    console.log('🧠 Raw Braintrust response:', JSON.stringify(result, null, 2));

    // Handle the new response format with reviews
    let reviews: ReviewObject[] = [];
    const typedResult = result as any;
    if (typedResult.reviews && Array.isArray(typedResult.reviews)) {
      reviews = typedResult.reviews;
    } else if (Array.isArray(typedResult)) {
      reviews = typedResult;
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