import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeConversation } from "./services/openai";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get current user (demo user for MVP)
  app.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getUserByEmail("demo@conversly.com");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Get user conversations with reviews
  app.get("/api/conversations", async (req, res) => {
    try {
      // For MVP, use demo user
      const user = await storage.getUserByEmail("demo@conversly.com");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const conversations = await storage.getConversationsByUserId(user.id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to get conversations" });
    }
  });

  // Get specific conversation with review
  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await storage.getConversation(id);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const review = await storage.getReviewByConversationId(id);
      
      res.json({
        ...conversation,
        review
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req, res) => {
    try {
      const user = await storage.getUserByEmail("demo@conversly.com");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const conversationData = {
        userId: user.id,
        status: "pending",
        elevenlabsConversationId: req.body.elevenlabsConversationId,
        metadata: req.body.metadata || {}
      };

      const conversation = await storage.createConversation(conversationData);
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // ElevenLabs webhook endpoint
  app.post("/api/webhook/elevenlabs", async (req, res) => {
    try {
      console.log("ElevenLabs webhook received:", req.body);
      
      const { conversation_id, transcript, audio_url } = req.body;
      
      if (!conversation_id) {
        return res.status(400).json({ message: "Missing conversation_id" });
      }

      // Find conversation by ElevenLabs ID
      const conversation = await storage.getConversationByElevenlabsId(conversation_id);
      if (!conversation) {
        console.log(`Conversation not found for ElevenLabs ID: ${conversation_id}`);
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Update conversation with transcript and audio
      await storage.updateConversation(conversation.id, {
        transcript: transcript || "",
        audioUrl: audio_url,
        status: "completed"
      });

      // Analyze conversation with OpenAI if transcript is available
      if (transcript && transcript.trim()) {
        try {
          const analysis = await analyzeConversation(transcript);
          
          await storage.createReview({
            conversationId: conversation.id,
            highlights: analysis.highlights,
            summary: analysis.summary,
            overallRating: analysis.overallRating,
            suggestions: analysis.suggestions,
            strengths: analysis.strengths
          });

          await storage.updateConversation(conversation.id, {
            status: "analyzed"
          });

          console.log(`Analysis completed for conversation ${conversation.id}`);
        } catch (analysisError) {
          console.error("Analysis failed:", analysisError);
          // Continue without failing the webhook
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // Manually trigger analysis (for testing)
  app.post("/api/conversations/:id/analyze", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await storage.getConversation(id);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      if (!conversation.transcript) {
        return res.status(400).json({ message: "No transcript available for analysis" });
      }

      const analysis = await analyzeConversation(conversation.transcript);
      
      const review = await storage.createReview({
        conversationId: conversation.id,
        highlights: analysis.highlights,
        summary: analysis.summary,
        overallRating: analysis.overallRating,
        suggestions: analysis.suggestions,
        strengths: analysis.strengths
      });

      await storage.updateConversation(conversation.id, {
        status: "analyzed"
      });

      res.json(review);
    } catch (error) {
      console.error("Manual analysis error:", error);
      res.status(500).json({ message: "Analysis failed" });
    }
  });

  // Get conversation review
  app.get("/api/conversations/:id/review", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const review = await storage.getReviewByConversationId(conversationId);
      
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      res.json(review);
    } catch (error) {
      res.status(500).json({ message: "Failed to get review" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
