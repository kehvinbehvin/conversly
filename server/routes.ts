import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { createHmac, timingSafeEqual } from "crypto";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { storage } from "./storage";
import { analyzeConversation } from "./services/openai";
import { z } from "zod";
import bodyParser from "body-parser";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize ElevenLabs client
  const elevenLabsClient = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });

  // Get current user (demo user for MVP)
  app.get(
    "/api/user",
    express.json(),
    express.urlencoded({ extended: false }),
    async (req, res) => {
      try {
        const user = await storage.getUserByEmail("demo@conversly.com");
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
      } catch (error) {
        res.status(500).json({ message: "Failed to get user" });
      }
    },
  );

  // Generate signed URL for ElevenLabs conversation
  app.post(
    "/api/elevenlabs/signed-url",
    express.json(),
    express.urlencoded({ extended: false }),
    async (req, res) => {
      try {
        const { agentId } = req.body;
        const defaultAgentId = "agent_01jyfb9fh8f67agfzvv09tvg3t";
        const finalAgentId = agentId || defaultAgentId;

        if (!process.env.ELEVENLABS_API_KEY) {
          return res
            .status(500)
            .json({ message: "ElevenLabs API key not configured" });
        }

        console.log("Generating signed URL for agent:", finalAgentId);

        // Use ElevenLabs SDK to generate signed URL
        const response =
          await elevenLabsClient.conversationalAi.conversations.getSignedUrl({
            agentId: finalAgentId,
          });

        console.log("Successfully generated signed URL");
        res.json({ signedUrl: response.signedUrl });
      } catch (error) {
        console.error("Error generating signed URL:", error);
        res.status(500).json({
          message: "Failed to generate signed URL",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  // Get user conversations with reviews
  app.get(
    "/api/conversations",
    express.json(),
    express.urlencoded({ extended: false }),
    async (req, res) => {
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
    },
  );

  // Get specific conversation with review
  app.get(
    "/api/conversations/:id",
    express.json(),
    express.urlencoded({ extended: false }),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const conversation = await storage.getConversation(id);

        if (!conversation) {
          return res.status(404).json({ message: "Conversation not found" });
        }

        const review = await storage.getReviewByConversationId(id);

        res.json({
          ...conversation,
          review,
        });
      } catch (error) {
        res.status(500).json({ message: "Failed to get conversation" });
      }
    },
  );

  // Create new conversation
  app.post(
    "/api/conversations",
    express.json(),
    express.urlencoded({ extended: false }),
    async (req, res) => {
      try {
        const user = await storage.getUserByEmail("demo@conversly.com");
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const conversationData = {
          userId: user.id,
          status: "pending",
          elevenlabsConversationId: req.body.elevenlabsConversationId,
          metadata: req.body.metadata || {},
        };

        const conversation = await storage.createConversation(conversationData);
        res.json(conversation);
      } catch (error) {
        res.status(500).json({ message: "Failed to create conversation" });
      }
    },
  );

  // Helper function to verify ElevenLabs webhook signature
  const verifyElevenLabsWebhook = (
    rawBody: Buffer,
    signatureHeader: string,
    secret: string,
  ) => {
    if (!secret) {
      console.warn(
        "No webhook secret configured, skipping signature verification",
      );
      return { isValid: true };
    }

    if (!signatureHeader) {
      return { isValid: false, error: "Missing signature header" };
    }

    try {
      // Parse ElevenLabs signature header format: "t=1719263154,v0=123abc456def..."
      const headers = signatureHeader.split(",");
      const timestampHeader = headers.find((e) => e.startsWith("t="));
      const signatureHeader_v0 = headers.find((e) => e.startsWith("v0="));

      if (!timestampHeader || !signatureHeader_v0) {
        return { isValid: false, error: "Invalid signature header format" };
      }

      const timestamp = timestampHeader.substring(2);
      const signature = signatureHeader_v0.substring(3);

      // Validate timestamp range (not older than 30 minutes, not more than 5 minutes in future)
      const reqTimestamp = Number(timestamp) * 1000;
      if (isNaN(reqTimestamp)) {
        return { isValid: false, error: "Invalid timestamp format" };
      }

      const now = Date.now();
      const tolerance = 30 * 60 * 1000; // 30 minutes
      const futureLimit = 5 * 60 * 1000; // 5 minutes

      if (reqTimestamp < now - tolerance || reqTimestamp > now + futureLimit) {
        return { isValid: false, error: "Timestamp outside allowable range" };
      }

      // Create expected signature
      const message = Buffer.concat([
        Buffer.from(`${timestamp}.`, "utf8"),
        rawBody, // already a buffer
      ]);

      const expectedSignature = createHmac("sha256", secret)
        .update(message)
        .digest("hex");

      // Compare signatures
      const isValidSignature = timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(signature, "hex"),
      );

      console.log("Expected:", expectedSignature);
      console.log("Acutal:", signature);

      return { isValid: isValidSignature };
    } catch (error) {
      console.error("Signature verification error:", error);
      return { isValid: false, error: "Signature verification failed" };
    }
  };

  // Webhook signature verification middleware
  function verifyWebhookSignature(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // Only process POST requests
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    // Handle case-sensitive headers
    const signature: string =
      (req.headers["elevenlabs-signature"] as string) ||
      (req.headers["ElevenLabs-Signature"] as string);

    // TODO: Check at app startup if secret exists
    const secret = process.env.ELEVENLABS_WEBHOOK_SECRET || "";
    const rawBody = (req as any).body; // assume already a buffer
    console.log("📦 Raw body:", rawBody);

    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      console.error("❌ No raw body found or it is not a Buffer");
      return res.status(400).json({ message: "Raw body missing or invalid" });
    }

    console.log("🔑 Webhook secret configured:", secret);
    console.log("🔐 Signature provided:", signature);

    const result = verifyElevenLabsWebhook(rawBody, signature, secret);
    if (!result.isValid) {
      console.error("❌ Webhook verification failed:", result.error);
      const statusCode = result.error?.includes("Timestamp") ? 403 : 401;
      return res
        .status(statusCode)
        .json({ message: result.error || "Invalid signature" });
    }

    if (secret) {
      console.log("✅ Webhook signature verified successfully");
    } else {
      console.log("⚠️ Skipping signature verification (no secret configured)");
    }

    next();
  }

  // ElevenLabs webhook endpoint
  app.post(
    "/api/webhook/elevenlabs",
    bodyParser.raw({
      type: "*/*",
    }),
    verifyWebhookSignature,
    async (req, res) => {
      const startTime = Date.now();
      console.log(
        "🎯 ElevenLabs webhook received at",
        new Date().toISOString(),
      );

      try {
        // Log request headers for debugging
        console.log("📋 Webhook headers:", {
          "content-type": req.headers["content-type"],
          "elevenlabs-signature": req.headers["elevenlabs-signature"]
            ? "present"
            : "missing",
          "ElevenLabs-Signature": req.headers["ElevenLabs-Signature"]
            ? "present"
            : "missing",
          "user-agent": req.headers["user-agent"],
          "content-length": req.headers["content-length"],
        });

        // Parse JSON from raw buffer
        let webhookData;
        try {
          webhookData = JSON.parse(req.body.toString());
        } catch (parseError) {
          console.error("❌ Failed to parse webhook JSON:", parseError);
          return res.status(400).json({ message: "Invalid JSON payload" });
        }

        // Log the complete webhook payload
        console.log(
          "📦 ElevenLabs webhook payload:",
          JSON.stringify(webhookData, null, 2),
        );

        const { conversation_id, transcript, audio_url } = webhookData.data;

        // Validate required fields
        if (!conversation_id) {
          console.error("❌ Missing conversation_id in webhook payload");
          console.error("📋 Available fields:", Object.keys(webhookData));
          return res.status(400).json({ message: "Missing conversation_id" });
        }

        console.log(
          "🔍 Looking for conversation with ElevenLabs ID:",
          conversation_id,
        );

        // Find conversation by ElevenLabs ID
        let conversation;
        try {
          conversation =
            await storage.getConversationByElevenlabsId(conversation_id);
        } catch (storageError) {
          console.error(
            "❌ Database error while finding conversation:",
            storageError,
          );
          return res
            .status(500)
            .json({ message: "Database error finding conversation" });
        }

        if (!conversation) {
          console.error(
            `❌ Conversation not found for ElevenLabs ID: ${conversation_id}`,
          );

          // Log all existing conversations for debugging
          try {
            const allConversations = await storage.getConversationsByUserId(1); // Demo user
            console.log(
              "📋 Existing conversations:",
              allConversations.map((c) => ({
                id: c.id,
                elevenlabsId: c.elevenlabsConversationId,
                status: c.status,
              })),
            );
          } catch (debugError) {
            console.error(
              "❌ Error fetching conversations for debug:",
              debugError,
            );
          }

          return res.status(404).json({ message: "Conversation not found" });
        }

        console.log("✅ Found conversation:", {
          id: conversation.id,
          status: conversation.status,
          hasTranscript: !!conversation.transcript,
          hasAudioUrl: !!conversation.audioUrl,
        });

        // Log what we're updating
        console.log("📝 Updating conversation with:", {
          hasTranscript: !!(transcript && transcript.trim()),
          transcriptLength: transcript ? transcript.length : 0,
          hasAudioUrl: !!audio_url,
          audioUrl: audio_url ? audio_url.substring(0, 50) + "..." : null,
        });

        // Update conversation with transcript and audio
        try {
          await storage.updateConversation(conversation.id, {
            transcript: transcript || "",
            audioUrl: audio_url,
            status: "completed",
          });
          console.log("✅ Conversation updated successfully");
        } catch (updateError) {
          console.error("❌ Error updating conversation:", updateError);
          return res
            .status(500)
            .json({ message: "Failed to update conversation" });
        }

        // Analyze conversation with OpenAI if transcript is available
        if (transcript && transcript.trim()) {
          console.log(
            "🧠 Starting AI analysis for transcript (length:",
            transcript.length,
            "chars)",
          );

          try {
            const analysis = await analyzeConversation(transcript);
            console.log("✅ AI analysis completed:", {
              highlightsCount: analysis.highlights?.length || 0,
              summaryLength: analysis.summary?.length || 0,
              overallRating: analysis.overallRating,
              suggestionsCount: analysis.suggestions?.length || 0,
              strengthsCount: analysis.strengths?.length || 0,
            });

            try {
              await storage.createReview({
                conversationId: conversation.id,
                highlights: analysis.highlights,
                summary: analysis.summary,
                overallRating: analysis.overallRating,
                suggestions: analysis.suggestions,
                strengths: analysis.strengths,
              });
              console.log("✅ Review created successfully");
            } catch (reviewError) {
              console.error("❌ Error creating review:", reviewError);
              throw reviewError;
            }

            try {
              await storage.updateConversation(conversation.id, {
                status: "analyzed",
              });
              console.log("✅ Conversation status updated to 'analyzed'");
            } catch (statusError) {
              console.error(
                "❌ Error updating conversation status:",
                statusError,
              );
              throw statusError;
            }

            console.log(
              `🎉 Analysis completed successfully for conversation ${conversation.id}`,
            );
          } catch (analysisError) {
            console.error("❌ Analysis failed:", {
              error:
                analysisError instanceof Error
                  ? analysisError.message
                  : String(analysisError),
              stack:
                analysisError instanceof Error
                  ? analysisError.stack
                  : undefined,
              conversationId: conversation.id,
              transcriptLength: transcript.length,
            });

            // Try to update status to indicate analysis failed
            try {
              await storage.updateConversation(conversation.id, {
                status: "analysis_failed",
              });
              console.log(
                "⚠️ Conversation status updated to 'analysis_failed'",
              );
            } catch (statusUpdateError) {
              console.error(
                "❌ Failed to update status after analysis error:",
                statusUpdateError,
              );
            }

            // Continue without failing the webhook
            console.log(
              "⚠️ Continuing webhook processing despite analysis failure",
            );
          }
        } else {
          console.log("⚠️ No transcript available for analysis:", {
            transcriptExists: !!transcript,
            transcriptLength: transcript ? transcript.length : 0,
            transcriptTrimmed: transcript ? transcript.trim().length : 0,
          });
        }

        const processingTime = Date.now() - startTime;
        console.log(`✅ Webhook processed successfully in ${processingTime}ms`);

        res.json({
          success: true,
          processingTime: processingTime,
          conversationId: conversation.id,
          analysisPerformed: !!(transcript && transcript.trim()),
        });
      } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error("💥 Webhook processing failed:", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          processingTime: processingTime,
          requestBody: webhookData,
        });

        res.status(500).json({
          message: "Webhook processing failed",
          error: error instanceof Error ? error.message : String(error),
          processingTime: processingTime,
        });
      }
    },
  );

  // Manually trigger analysis (for testing)
  app.post("/api/conversations/:id/analyze", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await storage.getConversation(id);

      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      if (!conversation.transcript) {
        return res
          .status(400)
          .json({ message: "No transcript available for analysis" });
      }

      const analysis = await analyzeConversation(conversation.transcript);

      const review = await storage.createReview({
        conversationId: conversation.id,
        highlights: analysis.highlights,
        summary: analysis.summary,
        overallRating: analysis.overallRating,
        suggestions: analysis.suggestions,
        strengths: analysis.strengths,
      });

      await storage.updateConversation(conversation.id, {
        status: "analyzed",
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
