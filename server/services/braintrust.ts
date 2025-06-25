import { wrapOpenAI, loadPrompt } from "braintrust";
import { OpenAI } from "openai";
import type { Improvement } from "@shared/schema";

// Initialize OpenAI client wrapped with Braintrust
const openai = wrapOpenAI(new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
}), {
  projectName: process.env.BRAINTRUST_PROJECT_NAME || "Conversly"
});

// Interface matching the expected Braintrust schema
export interface BraintrustFeedbackItem {
  location: string;
  improvement: string;
  reasoning: string;
}

export interface BraintrustResponse {
  improvements: BraintrustFeedbackItem[];
}

// Legacy interface for backward compatibility
export interface ConversationAnalysis {
  highlights: any[];
  summary: string;
  overallRating: number;
  suggestions: any[];
  strengths: any[];
  improvements: Improvement[];
}

export async function analyzeConversationWithBraintrust(transcript: string): Promise<BraintrustResponse> {
  try {
    // Convert transcript to the expected format for Individual A and B
    const formattedTranscript = formatTranscriptForAnalysis(transcript);
    const transcriptString = formattedTranscript.join('\n');

    let messages;
    let model = "gpt-4o";
    let temperature = 0.7;

    try {
      // Load prompt from Braintrust instead of using hardcoded system prompt
      const prompt = await loadPrompt({
        projectName: process.env.BRAINTRUST_PROJECT_NAME || "Conversly",
        slug: "conversation-analysis"
      });

      // Build messages using the Braintrust prompt with transcript data
      messages = prompt.build({ transcript: transcriptString });
      model = prompt.defaults?.model || "gpt-4o";
      temperature = prompt.defaults?.temperature || 0.7;
    } catch (promptError) {
      console.warn("Failed to load prompt from Braintrust, using fallback:", promptError);
      
      // Fallback to hardcoded prompt if Braintrust is unavailable
      const systemPrompt = `You are an expert conversation coach analyzing a practice conversation about "How was your weekend?"

Your role is to provide constructive, encouraging feedback that helps socially self-aware individuals improve their interpersonal communication skills, specifically focusing on Individual B's responses.

Analyze the conversation transcript and identify areas where Individual B could improve their conversational responses. Focus on:
1. Engagement and active participation
2. Question-asking and showing interest
3. Sharing appropriate details
4. Building conversational flow
5. Demonstrating social connection

For each improvement opportunity, provide:
- The exact utterance by Individual B that needs improvement
- A concrete, actionable suggestion for a better response
- Research-backed reasoning supporting the improvement

Respond with JSON in this exact format:
{
  "improvements": [
    {
      "location": "The exact utterance by Individual B being addressed",
      "improvement": "A concrete suggestion for how Individual B could have responded differently",
      "reasoning": "Research-backed explanation or citation supporting the improvement"
    }
  ]
}

Focus only on Individual B's responses and provide specific, actionable feedback that will help them become a more engaging conversationalist.`;

      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Transcript:\n${transcriptString}` }
      ];
    }

    // Call OpenAI through Braintrust wrapper using prompt defaults
    const completion = await openai.chat.completions.create({
      messages,
      model,
      temperature,
      response_format: { type: "json_object" }
    });

    if (!completion?.choices?.[0]?.message?.content) {
      throw new Error("Invalid response from OpenAI API");
    }

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    
    // Validate the response structure
    if (!result.improvements || !Array.isArray(result.improvements)) {
      throw new Error("Invalid response structure from Braintrust analysis");
    }

    // Validate each improvement item
    const validatedImprovements = result.improvements.map((item: any, index: number) => {
      if (!item.location || !item.improvement || !item.reasoning) {
        console.warn(`Skipping invalid improvement item at index ${index}:`, item);
        return null;
      }
      return {
        location: String(item.location),
        improvement: String(item.improvement),
        reasoning: String(item.reasoning)
      };
    }).filter(Boolean);

    return {
      improvements: validatedImprovements
    };
  } catch (error) {
    console.error("Braintrust analysis error:", error);
    throw new Error("Failed to analyze conversation with Braintrust: " + (error as Error).message);
  }
}

// Helper function to format transcript for Braintrust analysis
function formatTranscriptForAnalysis(transcript: string): string[] {
  // Split transcript into lines and format as expected by Braintrust
  const lines = transcript.split('\n').filter(line => line.trim().length > 0);
  return lines.map(line => {
    // Convert "role: message" format to "Person A: message" / "Person B: message"
    if (line.startsWith('agent:')) {
      return line.replace('agent:', 'Person A:');
    } else if (line.startsWith('user:')) {
      return line.replace('user:', 'Person B:');
    }
    return line;
  });
}

// Adapter function to convert Braintrust response to legacy format for backward compatibility
export function adaptBraintrustResponseToLegacy(
  braintrustResponse: BraintrustResponse,
  transcript: string
): ConversationAnalysis {
  // Convert Braintrust improvements to legacy format
  const improvements: Improvement[] = braintrustResponse.improvements.map((item, index) => {
    // Find the position of the quoted text in the transcript
    const startPos = transcript.indexOf(item.location);
    const endPos = startPos >= 0 ? startPos + item.location.length : 0;
    
    return {
      id: 0, // Will be set by database
      reviewId: 0, // Will be set by caller
      transcriptSectionStart: Math.max(0, startPos),
      transcriptSectionEnd: Math.max(0, endPos),
      feedbackText: item.improvement,
      improvementType: "improvement" as const,
      priority: "medium" as const,
      category: "conversation_flow",
      createdAt: new Date()
    };
  });

  // Generate legacy fields from improvements
  const summary = improvements.length > 0 
    ? `Analysis completed with ${improvements.length} improvement suggestions.`
    : "Conversation practice session completed successfully.";
    
  const overallRating = Math.max(1, Math.min(5, 4 - Math.floor(improvements.length / 3)));

  return {
    highlights: [], // Legacy field, not used with Braintrust
    summary,
    overallRating,
    suggestions: [], // Legacy field, not used with Braintrust
    strengths: [], // Legacy field, not used with Braintrust
    improvements
  };
}

// Main analysis function that maintains backward compatibility
export async function analyzeConversation(transcript: string): Promise<ConversationAnalysis> {
  try {
    // Use Braintrust for analysis
    const braintrustResponse = await analyzeConversationWithBraintrust(transcript);
    
    // Convert to legacy format for existing code compatibility
    return adaptBraintrustResponseToLegacy(braintrustResponse, transcript);
  } catch (error) {
    console.error("Conversation analysis failed:", error);
    
    // Fallback to basic response structure
    return {
      highlights: [],
      summary: "Analysis completed with basic feedback.",
      overallRating: 3,
      suggestions: [],
      strengths: [],
      improvements: []
    };
  }
}

// Legacy function for summary generation - keeping for compatibility
export async function generateConversationSummary(transcript: string): Promise<string> {
  try {
    const analysis = await analyzeConversation(transcript);
    return analysis.summary;
  } catch (error) {
    console.error("Summary generation error:", error);
    return "Conversation practice session completed.";
  }
}