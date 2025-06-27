import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import bodyParser from "body-parser";
import { createServer, type Server } from "http";
import { createHmac, timingSafeEqual } from "crypto";
// Removed WebSocket import - using SSE instead
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { storage } from "./storage";
import { analyzeConversationWithBraintrust } from "./services/braintrust";
import type { TranscriptObject } from "@shared/schema";
import * as transcriptRoutes from "./routes/transcripts";
import * as reviewRoutes from "./routes/reviews";
import { createReviewWithTranscripts } from "./services/reviewAnalyzer";
import { z } from "zod";

// SSE connection management for real-time notifications
const sseConnections = new Map<string, Response>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize ElevenLabs client
  const elevenLabsClient = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });

  // Ensure anonymous user exists
  async function ensureAnonymousUser() {
    try {
      let anonymousUser = await storage.getUserByEmail("anonymous@conversly.com");
      if (!anonymousUser) {
        anonymousUser = await storage.createUser({
          email: "anonymous@conversly.com",
          authProvider: "demo",
          stripeCustomerId: null,
        });
        console.log("✅ Created anonymous user:", anonymousUser.email);
      }
      return anonymousUser;
    } catch (error) {
      console.error("❌ Failed to ensure anonymous user:", error);
      throw error;
    }
  }

  // Initialize anonymous user on server start
  await ensureAnonymousUser();

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

  // Get anonymous user for landing page
  app.get(
    "/api/user/anonymous",
    express.json(),
    express.urlencoded({ extended: false }),
    async (req, res) => {
      try {
        const user = await storage.getUserByEmail("anonymous@conversly.com");
        if (!user) {
          return res.status(404).json({ message: "Anonymous user not found" });
        }
        res.json(user);
      } catch (error) {
        res.status(500).json({ message: "Failed to get anonymous user" });
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
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid conversation ID" });
        }

        const conversation = await storage.getConversation(id);
        if (!conversation) {
          return res.status(404).json({ message: "Conversation not found" });
        }

        const review = await storage.getReviewByConversationId(id);

        // Include transcript data if available
        const transcript = conversation.transcriptId ? 
          await storage.getTranscript(conversation.transcriptId) : null;

        res.json({
          ...conversation,
          review,
          transcript,
          // Helper flags for frontend
          isComplete: conversation.status === 'completed' && !!review,
        });
      } catch (error) {
        console.error("Error fetching conversation:", error);
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
        const { userId, elevenlabsConversationId, transcriptId } = req.body;

        // Validate required userId parameter
        let validatedUserId = userId;
        
        // If no userId provided, use demo user
        if (!validatedUserId) {
          const user = await storage.getUserByEmail("demo@conversly.com");
          if (!user) {
            return res.status(404).json({ message: "Demo user not found" });
          }
          validatedUserId = user.id;
        }
        if (process.env.NODE_ENV !== 'test') {
          const user = await storage.getUser(userId);
          if (!user) {
            return res.status(404).json({ message: "User not found" });
          }
          validatedUserId = user.id;
        }

        // Check if conversation with this ElevenLabs ID already exists (only for webhook handling)
        if (elevenlabsConversationId && req.headers['elevenlabs-signature']) {
          const existingConversation = await storage.getConversationByElevenlabsId(elevenlabsConversationId);
          if (existingConversation) {
            console.log("📝 Conversation already exists:", existingConversation.id, "for ElevenLabs ID:", elevenlabsConversationId);
            return res.json(existingConversation);
          }
        }

        const conversationData = {
          userId: validatedUserId,
          transcriptId: transcriptId || null,
          status: "pending",
          elevenlabsConversationId: elevenlabsConversationId || null,
          metadata: req.body.metadata || null,
        };

        const conversation = await storage.createConversation(conversationData);
        console.log("📝 Created conversation:", conversation.id, "for ElevenLabs ID:", elevenlabsConversationId);
        console.log("📝 Request body:", JSON.stringify(req.body, null, 2));
        console.log("📝 Call stack trace for conversation creation");
        res.status(201).json(conversation);
      } catch (error) {
        console.error("❌ Failed to create conversation:", error);
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

        // Validate webhook payload structure
        if (!webhookData || typeof webhookData !== 'object') {
          console.error("❌ Invalid webhook payload structure");
          return res.status(400).json({ message: "Invalid webhook payload" });
        }

        if (!webhookData.data || typeof webhookData.data !== 'object') {
          console.error("❌ Missing or invalid 'data' field in webhook payload");
          console.error("📋 Available top-level fields:", Object.keys(webhookData));
          return res.status(400).json({ message: "Missing or invalid data field" });
        }

        // Extract data from the nested structure with validation
        const { conversation_id, transcript: transcriptArray, metadata, analysis } = webhookData.data;

        // Validate required fields
        if (!conversation_id || typeof conversation_id !== 'string') {
          console.error("❌ Missing or invalid conversation_id in webhook payload");
          console.error("📋 Available data fields:", Object.keys(webhookData.data || {}));
          return res.status(400).json({ message: "Missing or invalid conversation_id" });
        }

        console.log(
          "🔍 Looking for conversation with ElevenLabs ID:",
          conversation_id,
        );

        // Extract and format transcript data with new structure
        let transcriptData: TranscriptObject[] = [];
        if (transcriptArray && Array.isArray(transcriptArray)) {
          transcriptData = transcriptArray
            .filter((turn) => turn && typeof turn === 'object' && turn.role && turn.message)
            .map((turn, index) => ({
              index: index,
              role: turn.role === 'agent' ? 'agent' : 'user',
              message: turn.message,
              time_in_call_secs: turn.time_in_call_secs || 0
            }));
        }

        // Extract audio URL from metadata if available (not present in current payload structure)
        const audio_url = null;

        console.log("📝 Processed transcript:", {
          originalFormat: "array",
          turnsCount: transcriptArray?.length || 0,
          validTurns: transcriptData.length,
          hasAudioUrl: !!audio_url,
        });

        // Extract and validate additional metadata
        const callMetadata = {
          webhookType: webhookData.type || null,
          eventTimestamp: webhookData.event_timestamp || null,
          status: webhookData.data?.status || null,
          duration: metadata?.call_duration_secs || null,
          cost: metadata?.cost || null,
          terminationReason: metadata?.termination_reason || null,
          language: metadata?.main_language || null,
          callSuccessful: analysis?.call_successful || null,
          transcriptSummary: analysis?.transcript_summary || null,
          startTime: metadata?.start_time_unix_secs || null,
          acceptedTime: metadata?.accepted_time_unix_secs || null,
        };

        console.log("📊 Call metadata:", callMetadata);

        // Find conversation by ElevenLabs ID
        let conversation;
        try {
          conversation = await storage.getConversationByElevenlabsId(conversation_id);
        } catch (storageError) {
          console.error("❌ Database error while finding conversation:", storageError);
          return res.status(500).json({ message: "Database error finding conversation" });
        }

        if (!conversation) {
          console.log(`🔍 No existing conversation found for ElevenLabs ID: ${conversation_id}`);
          console.log("⚠️ This shouldn't happen as conversations should be created on connect");
          
          // Try anonymous user first, then demo user as fallback
          let user = await storage.getUserByEmail("anonymous@conversly.com");
          if (!user) {
            user = await storage.getUserByEmail("demo@conversly.com");
          }
          if (!user) {
            console.error("❌ No fallback user found");
            return res.status(404).json({ message: "No fallback user found" });
          }

          // Create new conversation record only as fallback
          const conversationData = {
            userId: user.id,
            status: "completed" as const,
            elevenlabsConversationId: conversation_id,
            metadata: { webhookReceived: true, fallbackCreated: true, ...callMetadata },
          };

          try {
            conversation = await storage.createConversation(conversationData);
            console.log("⚠️ Created fallback conversation:", conversation.id, "for ElevenLabs ID:", conversation_id);
          } catch (createError) {
            console.error("❌ Failed to create conversation:", createError);
            return res.status(500).json({ message: "Failed to create conversation" });
          }
        }

        console.log("✅ Found conversation:", {
          id: conversation.id,
          status: conversation.status,
          hasTranscriptId: !!conversation.transcriptId,
          hasAudioUrl: !!conversation.audioUrl,
        });

        // Log what we're updating
        console.log("📝 Updating conversation with:", {
          transcriptTurns: transcriptData.length,
          hasAudioUrl: !!audio_url,
          audioUrl: audio_url && typeof audio_url === 'string' ? String(audio_url).substring(0, 50) + "..." : null,
          metadata: callMetadata,
        });

        // Update conversation with transcript data, audio, and metadata using webhook-specific method
        try {
          await storage.updateConversationFromWebhook(
            conversation.id,
            transcriptData,
            audio_url,
            callMetadata
          );
          console.log("✅ Conversation updated successfully");
        } catch (updateError) {
          console.error("❌ Error updating conversation:", updateError);
          return res
            .status(500)
            .json({ message: "Failed to update conversation" });
        }

        // Analyze conversation with LLM if transcript data is available
        if (transcriptData && transcriptData.length > 0) {
          console.log(
            "🧠 Starting AI analysis for transcript (turns:",
            transcriptData.length,
            ")",
          );

          try {
            const review = await createReviewWithTranscripts(conversation.id, transcriptData);
            if (review) {
              console.log("✅ Review with transcript analysis created successfully:", review.id);
              
              // Update conversation status to completed
              await storage.updateConversation(conversation.id, {
                status: "completed",
              });
              console.log("✅ Conversation status updated to 'completed'");

              // Notify SSE clients that review is ready
              const sseClient = sseConnections.get(conversation_id);
              if (sseClient && !sseClient.destroyed) {
                sseClient.write(`data: ${JSON.stringify({
                  type: "review_ready",
                  conversationId: conversation_id,
                  dbConversationId: conversation.id
                })}\n\n`);
                console.log("📡 Sent review_ready notification to SSE client");
              } else {
                console.log("📡 No active SSE connection for conversation:", conversation_id);
              }
            } else {
              console.error("❌ Failed to create review with transcript analysis");
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
              transcriptTurns: transcriptData.length,
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
          console.log("⚠️ No transcript data available for analysis:", {
            transcriptDataExists: !!transcriptData,
            transcriptTurns: transcriptData ? transcriptData.length : 0,
            originalTranscriptLength: transcriptArray?.length || 0,
          });

          // Update conversation status to indicate empty transcript
          try {
            await storage.updateConversation(conversation.id, {
              status: "empty_transcript",
            });
            console.log("⚠️ Conversation status updated to 'empty_transcript'");
          } catch (statusUpdateError) {
            console.error("❌ Failed to update status for empty transcript:", statusUpdateError);
          }

          // Notify SSE clients that an error occurred due to empty transcript
          const sseClient = sseConnections.get(conversation_id);
          if (sseClient && !sseClient.destroyed) {
            sseClient.write(`data: ${JSON.stringify({
              type: "empty_transcript_error",
              conversationId: conversation_id,
              dbConversationId: conversation.id,
              message: "No conversation data was captured. Please try again."
            })}\n\n`);
            console.log("📡 Sent empty_transcript_error notification to SSE client");
          } else {
            console.log("📡 No active SSE connection for conversation:", conversation_id);
          }
        }

        const processingTime = Date.now() - startTime;
        console.log(`✅ Webhook processed successfully in ${processingTime}ms`);

        res.json({
          success: true,
          processingTime: processingTime,
          conversationId: conversation.id,
          elevenlabsId: conversation_id,
          transcriptSaved: transcriptData.length > 0,
          analysisPerformed: transcriptData.length > 0,
          transcriptTurns: transcriptData.length,
          callDuration: callMetadata.duration,
        });
      } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error("💥 Webhook processing failed:", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          elevenlabsId: req.body?.data?.conversation_id || "unknown",
          processingTime,
        });

        // Log error details for debugging
        console.error("❌ Error details logged for debugging");

        res.status(500).json({
          message: "Failed to process webhook",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  // Transcript routes
  app.get("/api/transcripts/:id", transcriptRoutes.getTranscript);
  app.post("/api/transcripts", express.json(), transcriptRoutes.createTranscript);
  app.patch("/api/transcripts/:id", express.json(), transcriptRoutes.updateTranscript);

  // Review routes
  app.get("/api/reviews/:id", reviewRoutes.getReview);
  app.get("/api/conversations/:conversationId/review", reviewRoutes.getReviewByConversationId);
  app.post("/api/reviews", express.json(), reviewRoutes.createReview);
  app.patch("/api/reviews/:id", express.json(), reviewRoutes.updateReview);







  // Add SSE endpoint for real-time notifications
  app.get('/api/events/:conversationId', (req, res) => {
    const conversationId = req.params.conversationId;
    
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });
    
    // Store the connection
    sseConnections.set(conversationId, res);
    console.log('📡 SSE connection established for conversation:', conversationId);
    
    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', conversationId })}\n\n`);
    
    // Handle client disconnect
    req.on('close', () => {
      sseConnections.delete(conversationId);
      console.log('📡 SSE connection closed for conversation:', conversationId);
    });
    
    req.on('aborted', () => {
      sseConnections.delete(conversationId);
      console.log('📡 SSE connection aborted for conversation:', conversationId);
    });
  });

  return createServer(app);
}
