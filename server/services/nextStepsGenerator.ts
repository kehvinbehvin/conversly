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

    console.log('Braintrust response received, type:', typeof result);
    
    // The Braintrust configuration format suggests steps as array of strings
    // Handle the actual response format dynamically
    let steps: string[] = [];
    
    if (typeof result === 'string') {
      // Parse JSON string response
      try {
        const parsed = JSON.parse(result);
        if (parsed.steps && Array.isArray(parsed.steps)) {
          steps = parsed.steps;
        } else {
          throw new Error('No steps array found in JSON response');
        }
      } catch (parseError) {
        throw new Error('Invalid JSON response from Braintrust');
      }
    } else if (result && typeof result === 'object') {
      // Handle object response
      const response = result as any;
      
      if (Array.isArray(response.steps)) {
        steps = response.steps;
      } else if (response.steps) {
        // Single step
        steps = [response.steps];
      } else {
        throw new Error('No steps found in response object');
      }
    } else {
      throw new Error('Unexpected response format from Braintrust');
    }

    // Validate and convert to Step objects
    const validatedSteps: Step[] = steps.map((stepString: any, index: number) => {
      if (typeof stepString === 'string') {
        return { step: stepString };
      } else {
        throw new Error(`Step ${index} is not a string: ${typeof stepString}`);
      }
    });

    if (validatedSteps.length === 0) {
      throw new Error('No valid steps generated');
    }

    console.log(`Generated ${validatedSteps.length} next steps successfully`);
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