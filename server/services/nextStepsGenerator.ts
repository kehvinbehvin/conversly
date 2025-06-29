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
    console.log('Response structure:', JSON.stringify(result, null, 2));
    
    // Handle the Braintrust response format: { "steps": [ { "step": "string" }, { "step": "string" } ] }
    let validatedSteps: Step[] = [];
    
    if (typeof result === 'string') {
      // Parse JSON string response
      try {
        const parsed = JSON.parse(result);
        if (parsed.steps && Array.isArray(parsed.steps)) {
          validatedSteps = parsed.steps.map((stepObj: any, index: number) => {
            if (stepObj && typeof stepObj === 'object' && typeof stepObj.step === 'string') {
              return { step: stepObj.step };
            } else {
              throw new Error(`Step ${index} invalid format: expected {step: string}, got ${JSON.stringify(stepObj)}`);
            }
          });
        } else {
          throw new Error('No steps array found in JSON response');
        }
      } catch (parseError) {
        throw new Error(`Invalid JSON response from Braintrust: ${parseError}`);
      }
    } else if (result && typeof result === 'object') {
      // Handle direct object response
      const response = result as any;
      
      if (Array.isArray(response.steps)) {
        validatedSteps = response.steps.map((stepObj: any, index: number) => {
          if (stepObj && typeof stepObj === 'object' && typeof stepObj.step === 'string') {
            return { step: stepObj.step };
          } else {
            throw new Error(`Step ${index} invalid format: expected {step: string}, got ${JSON.stringify(stepObj)}`);
          }
        });
      } else {
        throw new Error('No steps array found in response object');
      }
    } else {
      throw new Error(`Unexpected response format from Braintrust: ${typeof result}`);
    }

    if (validatedSteps.length === 0) {
      throw new Error('No valid steps generated from Braintrust response');
    }

    console.log(`Successfully generated ${validatedSteps.length} next steps`);
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