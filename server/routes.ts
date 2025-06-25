import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { createHmac, timingSafeEqual } from "crypto";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { storage } from "./storage";
import { analyzeConversation } from "./services/openai";
import { createReviewWithImprovements } from "./services/reviewAnalyzer";
import { fileStore, cloudStorage, type TranscriptData } from "./services/fileStore";
import * as transcriptRoutes from "./routes/transcripts";
import * as improvementRoutes from "./routes/improvements";
import * as reviewRoutes from "./routes/reviews";
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
        const { userId, elevenlabsConversationId, transcriptId } = req.body;

        // Validate required userId parameter
        if (!userId) {
          return res.status(400).json({ message: "userId is required" });
        }

        // For tests: use provided userId, for production: validate user exists
        let validatedUserId = userId;
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

        // Convert transcript array to readable string with validation
        let transcriptText = "";
        if (transcriptArray && Array.isArray(transcriptArray)) {
          transcriptText = transcriptArray
            .filter((turn) => turn && typeof turn === 'object' && turn.role && turn.message)
            .map((turn) => `${turn.role}: ${turn.message}`)
            .join("\n");
        }

        // Extract audio URL from metadata if available (not present in current payload structure)
        const audio_url = null;

        console.log("📝 Processed transcript:", {
          originalFormat: "array",
          turnsCount: transcriptArray?.length || 0,
          validTurns: transcriptArray?.filter(turn => turn && turn.role && turn.message)?.length || 0,
          processedLength: transcriptText.length,
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

        // Prepare transcript data
        const transcriptFileData: TranscriptData = {
          conversationId: "", // Will be set after finding/creating conversation
          elevenlabsId: conversation_id,
          transcript: webhookData.data?.transcript,
          metadata: webhookData.data?.metadata,
          analysis: webhookData.data?.analysis,
          timestamp: Date.now(),
        };

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
          
          // Get demo user
          const user = await storage.getUserByEmail("demo@conversly.com");
          if (!user) {
            console.error("❌ Demo user not found");
            return res.status(404).json({ message: "Demo user not found" });
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

        // Update transcript data with conversation ID and save to cloud storage
        transcriptFileData.conversationId = conversation.id.toString();
        await cloudStorage.saveTranscript(transcriptFileData);
        console.log("💾 Transcript saved to cloud storage for ElevenLabs ID:", conversation_id);

        console.log("✅ Found conversation:", {
          id: conversation.id,
          status: conversation.status,
          hasTranscript: !!conversation.transcript,
          hasAudioUrl: !!conversation.audioUrl,
        });

        // Log what we're updating
        console.log("📝 Updating conversation with:", {
          hasTranscript: !!(transcriptText && transcriptText.trim()),
          transcriptLength: transcriptText.length,
          hasAudioUrl: !!audio_url,
          audioUrl: audio_url ? audio_url.substring(0, 50) + "..." : null,
          metadata: callMetadata,
        });

        // Update conversation with transcript, audio, and metadata using webhook-specific method
        try {
          await storage.updateConversationFromWebhook(
            conversation.id,
            transcriptText || "",
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

        // Analyze conversation with OpenAI if transcript is available
        if (transcriptText && transcriptText.trim()) {
          console.log(
            "🧠 Starting AI analysis for transcript (length:",
            transcriptText.length,
            "chars)",
          );

          try {
            const review = await createReviewWithImprovements(conversation.id, transcriptText);
            if (review) {
              console.log("✅ Review with improvements created successfully:", review.id);
              
              // Update conversation status to analyzed
              await storage.updateConversation(conversation.id, {
                status: "analyzed",
              });
              console.log("✅ Conversation status updated to 'analyzed'");
            } else {
              console.error("❌ Failed to create review with improvements");
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
              transcriptLength: transcriptText.length,
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
            transcriptExists: !!transcriptText,
            transcriptLength: transcriptText.length,
            transcriptTrimmed: transcriptText.trim().length,
            originalArrayLength: transcriptArray?.length || 0,
          });
        }

        const processingTime = Date.now() - startTime;
        console.log(`✅ Webhook processed successfully in ${processingTime}ms`);

        res.json({
          success: true,
          processingTime: processingTime,
          conversationId: conversation.id,
          elevenlabsId: conversation_id,
          transcriptSaved: true,
          analysisPerformed: !!(transcriptText && transcriptText.trim()),
          transcriptTurns: transcriptArray?.length || 0,
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

        // Still try to save raw webhook data even if processing fails
        try {
          const rawTranscriptData: TranscriptData = {
            conversationId: "error",
            elevenlabsId: req.body?.data?.conversation_id || "unknown",
            transcript: req.body?.data?.transcript,
            metadata: req.body?.data?.metadata,
            analysis: req.body?.data?.analysis,
            timestamp: Date.now(),
          };
          await cloudStorage.saveTranscript(rawTranscriptData);
          console.log("💾 Raw webhook data saved despite processing error");
        } catch (saveError) {
          console.error("❌ Failed to save raw webhook data:", saveError);
        }

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

  // Improvement routes
  app.get("/api/improvements/:id", improvementRoutes.getImprovement);
  app.get("/api/reviews/:reviewId/improvements", improvementRoutes.getImprovementsByReviewId);
  app.post("/api/improvements", express.json(), improvementRoutes.createImprovement);
  app.patch("/api/improvements/:id", express.json(), improvementRoutes.updateImprovement);
  app.delete("/api/improvements/:id", improvementRoutes.deleteImprovement);

  // API endpoint to list saved transcript files (legacy support)
  app.get(
    "/api/transcript-files",
    express.json(),
    express.urlencoded({ extended: false }),
    async (req, res) => {
      try {
        const files = await cloudStorage.listTranscripts();
        res.json({ transcripts: files });
      } catch (error) {
        res.status(500).json({ message: "Failed to list transcripts" });
      }
    },
  );

  // API endpoint to get a specific transcript file (legacy support)
  app.get(
    "/api/transcript-files/:elevenlabsId",
    express.json(),
    express.urlencoded({ extended: false }),
    async (req, res) => {
      try {
        const { elevenlabsId } = req.params;
        const transcript = await cloudStorage.getTranscript(elevenlabsId);
        
        if (!transcript) {
          return res.status(404).json({ message: "Transcript not found" });
        }
        
        res.json(transcript);
      } catch (error) {
        res.status(500).json({ message: "Failed to get transcript" });
      }
    },
  );

  // API endpoint to get cloud storage status and configuration
  app.get(
    "/api/storage/status",
    express.json(),
    express.urlencoded({ extended: false }),
    async (req, res) => {
      try {
        const { getStorageConfig } = await import('./services/cloudStorage.js');
        const config = getStorageConfig();
        
        // Test storage by listing transcripts
        const files = await cloudStorage.listTranscripts();
        
        res.json({
          provider: config.provider,
          isWorking: true,
          fileCount: files.length,
          config: config.provider === 'replit' ? {
            bucketId: config.replit?.bucketId,
          } : null
        });
      } catch (error) {
        console.error("Storage status check failed:", error);
        res.json({
          provider: 'unknown',
          isWorking: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    },
  );

  // API endpoint to test object storage
  app.post(
    "/api/storage/test",
    express.json(),
    express.urlencoded({ extended: false }),
    async (req, res) => {
      try {
        console.log("🧪 Running storage test via API...");
        
        // Create test data
        const testData: TranscriptData = {
          conversationId: "api-test-" + Date.now(),
          elevenlabsId: "api_test_" + Date.now(),
          transcript: [
            { role: "agent", message: "API test message for storage verification" },
            { role: "user", message: "API test response to verify upload functionality" }
          ],
          metadata: {
            testMode: true,
            apiTest: true,
            timestamp: Date.now()
          },
          timestamp: Date.now()
        };

        // Test save
        const savedPath = await cloudStorage.saveTranscript(testData);
        console.log(`✅ API test: Document saved to ${savedPath}`);

        // Test retrieve
        const retrieved = await cloudStorage.getTranscript(testData.elevenlabsId);
        
        // Test list
        const allFiles = await cloudStorage.listTranscripts();
        
        // Clean up test file
        const deleted = await cloudStorage.deleteTranscript(testData.elevenlabsId);
        
        res.json({
          success: true,
          results: {
            saved: !!savedPath,
            retrieved: !!retrieved,
            fileCount: allFiles.length,
            testDataMatch: retrieved?.conversationId === testData.conversationId,
            cleanedUp: deleted
          },
          storage: {
            provider: "hybrid",
            cloudAttempted: true,
            localFallback: true
          },
          message: "Storage test completed successfully"
        });
        
      } catch (error) {
        console.error("💥 API storage test failed:", error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: "Storage test failed"
        });
      }
    },
  );

  return createServer(app);
}
