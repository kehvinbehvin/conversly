import { invoke } from "braintrust";
import { z } from "zod";
import type { Improvement } from "@shared/schema";

export interface BraintrustFeedbackItem {
  location: string;
  improvement: string;
  reasoning: string;
}

export interface BraintrustResponse {
  improvements: BraintrustFeedbackItem[];
}

export interface ConversationAnalysis {
  highlights: any[];
  summary: string;
  overallRating: number;
  suggestions: any[];
  strengths: any[];
  improvements: Improvement[];
}

export async function analyzeConversationWithBraintrust(
  transcript: string,
): Promise<BraintrustResponse> {
  try {
    const formattedTranscript = formatTranscriptForAnalysis(transcript);
    const transcriptString = formattedTranscript.join("\n");

    const result = await invoke({
      projectName: process.env.BRAINTRUST_PROJECT_NAME || "Yappy-first-project",
      slug: "conversation-consultant-7a00",
      input: { transcript: transcriptString },
    });

    let improvements: BraintrustFeedbackItem[];
    if (result.improvements && Array.isArray(result.improvements)) {
      improvements = result.improvements;
    } else if (result.location && result.improvement) {
      improvements = [result];
    } else if (Array.isArray(result)) {
      improvements = result;
    } else {
      throw new Error("Invalid response structure from Braintrust analysis");
    }

    const validatedImprovements = improvements
      .map((item, index) => {
        if (!item.location || !item.improvement || !item.reasoning) {
          console.warn(`Skipping invalid improvement at index ${index}:`, item);
          return null;
        }
        return {
          location: String(item.location),
          improvement: String(item.improvement),
          reasoning: String(item.reasoning),
        };
      })
      .filter(Boolean) as BraintrustFeedbackItem[];

    return { improvements: validatedImprovements };
  } catch (error) {
    console.error("Braintrust analysis error:", error);
    throw new Error(
      "Failed to analyze conversation with Braintrust: " +
        (error as Error).message,
    );
  }
}

function formatTranscriptForAnalysis(transcript: string): string[] {
  return transcript
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      if (line.startsWith("agent:")) return line.replace("agent:", "Person A:");
      if (line.startsWith("user:")) return line.replace("user:", "Person B:");
      return line;
    });
}

export function adaptBraintrustResponseToLegacy(
  braintrustResponse: BraintrustResponse,
  transcript: string,
): ConversationAnalysis {
  const improvements: Improvement[] = braintrustResponse.improvements.map(
    (item, index) => {
      const startPos = transcript.indexOf(item.location);
      const endPos = startPos >= 0 ? startPos + item.location.length : 0;

      return {
        id: 0,
        reviewId: 0,
        transcriptSectionStart: Math.max(0, startPos),
        transcriptSectionEnd: Math.max(0, endPos),
        feedbackText: item.improvement,
        improvementType: "improvement" as const,
        priority: "medium" as const,
        category: "conversation_flow",
        createdAt: new Date(),
      };
    },
  );

  const summary =
    improvements.length > 0
      ? `Analysis completed with ${improvements.length} improvement suggestions.`
      : "Conversation practice session completed successfully.";
  const overallRating = Math.max(
    1,
    Math.min(5, 4 - Math.floor(improvements.length / 3)),
  );

  return {
    highlights: [],
    summary,
    overallRating,
    suggestions: [],
    strengths: [],
    improvements,
  };
}

export async function analyzeConversation(
  transcript: string,
): Promise<ConversationAnalysis> {
  try {
    const braintrustResponse =
      await analyzeConversationWithBraintrust(transcript);
    return adaptBraintrustResponseToLegacy(braintrustResponse, transcript);
  } catch (error) {
    console.error("Conversation analysis failed:", error);
    return {
      highlights: [],
      summary: "Analysis completed with basic feedback.",
      overallRating: 3,
      suggestions: [],
      strengths: [],
      improvements: [],
    };
  }
}

export async function generateConversationSummary(
  transcript: string,
): Promise<string> {
  try {
    const analysis = await analyzeConversation(transcript);
    return analysis.summary;
  } catch (error) {
    console.error("Summary generation error:", error);
    return "Conversation practice session completed.";
  }
}
