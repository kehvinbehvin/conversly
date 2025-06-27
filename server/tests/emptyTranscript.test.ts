import { describe, it, expect, beforeEach } from "vitest";
import { storage } from "../storage";

describe("Empty Transcript Database Handling", () => {
  beforeEach(async () => {
    // Ensure we have a test user available
    const user = await storage.getUserByEmail("anonymous@conversly.com");
    expect(user).toBeDefined();
  });

  it("should update conversation status to empty_transcript when no transcript data is available", async () => {
    // Get anonymous user
    const user = await storage.getUserByEmail("anonymous@conversly.com");
    expect(user).toBeDefined();

    // Create a test conversation
    const conversation = await storage.createConversation({
      userId: user!.id,
      elevenlabsConversationId: "conv_empty_test_123",
      status: "pending",
      metadata: { test: true },
    });

    expect(conversation).toBeDefined();
    expect(conversation.status).toBe("pending");

    // Simulate empty transcript scenario by updating status directly
    // This mimics what happens in the webhook when transcriptData.length === 0
    const updatedConversation = await storage.updateConversation(conversation.id, {
      status: "empty_transcript",
    });

    expect(updatedConversation).toBeDefined();
    expect(updatedConversation!.status).toBe("empty_transcript");

    // Verify we can retrieve the updated conversation
    const retrievedConversation = await storage.getConversation(conversation.id);
    expect(retrievedConversation).toBeDefined();
    expect(retrievedConversation!.status).toBe("empty_transcript");
  });

  it("should handle conversation status updates correctly", async () => {
    // Get anonymous user
    const user = await storage.getUserByEmail("anonymous@conversly.com");
    expect(user).toBeDefined();

    // Create a test conversation
    const conversation = await storage.createConversation({
      userId: user!.id,
      elevenlabsConversationId: "conv_status_test_456",
      status: "pending",
      metadata: { test: true },
    });

    // Test various status transitions that could occur
    const statusUpdates = ["completed", "analysis_failed", "empty_transcript"];
    
    for (const status of statusUpdates) {
      const updated = await storage.updateConversation(conversation.id, { status });
      expect(updated).toBeDefined();
      expect(updated!.status).toBe(status);
    }
  });
});