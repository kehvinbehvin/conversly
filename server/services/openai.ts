import OpenAI from "openai";
import type { ReviewHighlight, ReviewSuggestion, ReviewStrength, Improvement } from "@shared/schema";
import { storage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface ConversationAnalysis {
  highlights: ReviewHighlight[];
  summary: string;
  overallRating: number;
  suggestions: ReviewSuggestion[];
  strengths: ReviewStrength[];
  improvements: Improvement[];
}

export async function analyzeConversation(transcript: string): Promise<ConversationAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert conversation coach analyzing a practice conversation about "How was your weekend?" 
          
          Your role is to provide constructive, encouraging feedback that helps socially self-aware individuals improve their interpersonal communication skills.
          
          Analyze the conversation for:
          1. Communication strengths and effective techniques
          2. Areas for improvement with specific, actionable suggestions
          3. Overall conversation flow and engagement
          4. Tone, clarity, and interpersonal connection
          
          Provide feedback that is warm, professional, and growth-oriented. Focus on building confidence while offering practical improvement strategies.
          
          Respond with JSON in this exact format:
          {
            "highlights": [
              {
                "text": "specific quote from conversation",
                "feedback": "specific feedback about this moment",
                "type": "positive|improvement|neutral"
              }
            ],
            "summary": "overall conversation assessment in 2-3 sentences",
            "overallRating": 1-5,
            "suggestions": [
              {
                "category": "specific skill area",
                "suggestion": "actionable improvement tip",
                "priority": "high|medium|low"
              }
            ],
            "strengths": [
              {
                "category": "communication skill",
                "description": "what they did well",
                "examples": ["specific examples from conversation"]
              }
            ],
            "improvements": [
              {
                "transcriptSectionStart": 0,
                "transcriptSectionEnd": 50,
                "feedbackText": "specific improvement feedback",
                "improvementType": "positive|improvement|neutral",
                "priority": "high|medium|low",
                "category": "tone|clarity|engagement|timing"
              }
            ]
          }`
        },
        {
          role: "user",
          content: `Please analyze this weekend conversation practice session:\n\n${transcript}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate and ensure proper structure
    return {
      highlights: result.highlights || [],
      summary: result.summary || "Analysis completed.",
      overallRating: Math.max(1, Math.min(5, Math.round(result.overallRating || 3))),
      suggestions: result.suggestions || [],
      strengths: result.strengths || [],
      improvements: result.improvements || []
    };
  } catch (error) {
    console.error("OpenAI analysis error:", error);
    throw new Error("Failed to analyze conversation: " + (error as Error).message);
  }
}

export async function generateConversationSummary(transcript: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Create a brief, encouraging summary of this weekend conversation practice session. Focus on what went well and key learning moments. Keep it positive and motivating."
        },
        {
          role: "user",
          content: transcript
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    });

    return response.choices[0].message.content || "Conversation practice completed successfully.";
  } catch (error) {
    console.error("Summary generation error:", error);
    return "Conversation practice session completed.";
  }
}
