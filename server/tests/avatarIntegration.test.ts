import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { app } from "../index";
import { storage } from "../storage";
import { AVATARS } from "@shared/schema";

describe("Avatar Integration Tests", () => {
  let testUserId: number;

  beforeEach(async () => {
    // Create test user
    const user = await storage.createUser({
      email: "avatar-test@conversly.com",
      authProvider: "local",
    });
    testUserId = user.id;
  });

  describe("ElevenLabs Signed URL Generation", () => {
    it("should generate signed URL for each avatar agent_id", async () => {
      for (const avatar of AVATARS) {
        const response = await request(app)
          .post("/api/elevenlabs/signed-url")
          .send({ agentId: avatar.agent_id })
          .expect(200);

        expect(response.body).toHaveProperty("signedUrl");
        expect(typeof response.body.signedUrl).toBe("string");
        expect(response.body.signedUrl).toMatch(/^https:\/\/api\.elevenlabs\.io/);
      }
    });

    it("should reject invalid agent_id format", async () => {
      const response = await request(app)
        .post("/api/elevenlabs/signed-url")
        .send({ agentId: "invalid_agent_id" })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject missing agent_id", async () => {
      const response = await request(app)
        .post("/api/elevenlabs/signed-url")
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Conversation Creation with Avatar Selection", () => {
    it("should create conversation with specific avatar agent_id", async () => {
      const selectedAvatar = AVATARS[1]; // Shawn

      const response = await request(app)
        .post("/api/conversations")
        .send({
          userId: testUserId,
          elevenlabsConversationId: "conv_test_avatar_selection",
          agentId: selectedAvatar.agent_id,
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.userId).toBe(testUserId);
      expect(response.body.elevenlabsConversationId).toBe("conv_test_avatar_selection");
      
      // Verify metadata contains agent information
      if (response.body.metadata) {
        expect(response.body.metadata.agentId).toBe(selectedAvatar.agent_id);
      }
    });

    it("should handle conversation flow for different avatars", async () => {
      // Test with multiple avatars
      const testAvatars = [AVATARS[0], AVATARS[2]]; // Jessie and Maya

      for (const avatar of testAvatars) {
        const conversationResponse = await request(app)
          .post("/api/conversations")
          .send({
            userId: testUserId,
            elevenlabsConversationId: `conv_test_${avatar.name.toLowerCase()}`,
            agentId: avatar.agent_id,
          })
          .expect(201);

        expect(conversationResponse.body.userId).toBe(testUserId);
        
        // Verify conversation can be retrieved
        const getResponse = await request(app)
          .get(`/api/conversations/${conversationResponse.body.id}`)
          .expect(200);

        expect(getResponse.body.id).toBe(conversationResponse.body.id);
      }
    });
  });

  describe("Webhook Processing with Avatar Context", () => {
    it("should process webhook with avatar-specific agent_id", async () => {
      const selectedAvatar = AVATARS[3]; // Sam
      const elevenlabsConversationId = "conv_webhook_avatar_test";

      // Create conversation first
      const conversationResponse = await request(app)
        .post("/api/conversations")
        .send({
          userId: testUserId,
          elevenlabsConversationId,
          agentId: selectedAvatar.agent_id,
        })
        .expect(201);

      // Mock webhook payload with avatar context
      const webhookPayload = {
        type: "post_call_transcription",
        conversation_id: elevenlabsConversationId,
        transcript: [
          {
            index: 0,
            role: "agent" as const,
            message: `Hello! I'm ${selectedAvatar.name}, ${selectedAvatar.description}.`,
            time_in_call_secs: 0,
          },
          {
            index: 1,
            role: "user" as const,
            message: "Hi there!",
            time_in_call_secs: 2,
          },
        ],
        analysis: {
          call_successful: "success",
          transcript_summary: `Conversation with ${selectedAvatar.name}`,
        },
        conversation_initiation_client_data: {
          dynamic_variables: {
            system__agent_id: selectedAvatar.agent_id,
            system__conversation_id: elevenlabsConversationId,
          },
        },
      };

      const webhookResponse = await request(app)
        .post("/api/webhook/elevenlabs")
        .send(webhookPayload)
        .expect(200);

      expect(webhookResponse.body.success).toBe(true);

      // Verify conversation was updated with correct agent context
      const updatedConversation = await request(app)
        .get(`/api/conversations/${conversationResponse.body.id}`)
        .expect(200);

      expect(updatedConversation.body.status).toBe("completed");
      expect(updatedConversation.body.transcript).toBeDefined();
      expect(updatedConversation.body.review).toBeDefined();
    });
  });

  describe("Avatar Data Consistency", () => {
    it("should maintain avatar selection context throughout conversation flow", async () => {
      const selectedAvatar = AVATARS[0]; // Jessie

      // 1. Get signed URL
      const signedUrlResponse = await request(app)
        .post("/api/elevenlabs/signed-url")
        .send({ agentId: selectedAvatar.agent_id })
        .expect(200);

      expect(signedUrlResponse.body.signedUrl).toContain(selectedAvatar.agent_id);

      // 2. Create conversation
      const conversationResponse = await request(app)
        .post("/api/conversations")
        .send({
          userId: testUserId,
          elevenlabsConversationId: "conv_consistency_test",
          agentId: selectedAvatar.agent_id,
        })
        .expect(201);

      // 3. Verify agent_id consistency
      const conversation = await storage.getConversation(conversationResponse.body.id);
      expect(conversation).toBeDefined();
      
      if (conversation?.metadata) {
        expect(conversation.metadata.agentId).toBe(selectedAvatar.agent_id);
      }
    });
  });

  describe("Error Handling for Avatar Selection", () => {
    it("should handle invalid avatar agent_id gracefully", async () => {
      const response = await request(app)
        .post("/api/conversations")
        .send({
          userId: testUserId,
          elevenlabsConversationId: "conv_invalid_agent",
          agentId: "invalid_agent_format",
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should validate agent_id format in signed URL request", async () => {
      const invalidAgentIds = [
        "",
        "agent_",
        "invalid_format",
        "agent_tooshort",
        "agent_01234567890123456789012345678901234567890", // too long
      ];

      for (const invalidId of invalidAgentIds) {
        const response = await request(app)
          .post("/api/elevenlabs/signed-url")
          .send({ agentId: invalidId })
          .expect(400);

        expect(response.body).toHaveProperty("error");
      }
    });
  });
});