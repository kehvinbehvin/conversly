import { invoke } from "braintrust";
import type { ReviewObject, Step } from "@shared/schema";

export interface NextStepsInput {
  reviews: ReviewObject[];
  summary: string;
}

export interface NextStepsResponse {
  steps: Step[];
}

/**
 * Generate next steps using Braintrust AI based on conversation review
 * 
 * Takes the complete review object (reviews array + summary) and generates
 * actionable next steps for the user to improve their conversational skills.
 */
export async function generateNextSteps(
  reviewData: NextStepsInput
): Promise<NextStepsResponse> {
  try {
    const result = await invoke({
      projectName: process.env.BRAINTRUST_PROJECT_NAME || "Yappy-first-project",
      slug: "take-action-f00e",
      input: reviewData
    });

    // Type-safe response handling
    const response = result as { steps?: Step[] };
    
    // Validate the response structure
    if (!response || !Array.isArray(response.steps)) {
      throw new Error('Invalid response format from Next Steps LLM');
    }

    // Validate each step has the required structure
    const validatedSteps: Step[] = response.steps.map((step: any, index: number) => {
      if (!step || typeof step.step !== 'string') {
        throw new Error(`Invalid step format at index ${index}`);
      }
      return { step: step.step };
    });

    return { steps: validatedSteps };
  } catch (error) {
    console.error("❌ Next Steps generation failed:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      reviewsCount: reviewData.reviews.length,
      summaryLength: reviewData.summary.length,
    });
    
    // Return empty steps on failure - conversation flow continues normally
    return { steps: [] };
  }
}