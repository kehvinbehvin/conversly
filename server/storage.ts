import { 
  users, 
  conversations, 
  reviews,
  transcripts,
  nextSteps,
  feedback,
  type User, 
  type InsertUser, 
  type Conversation,
  type InsertConversation,
  type Review,
  type InsertReview,
  type Transcript,
  type InsertTranscript,
  type NextSteps,
  type InsertNextSteps,
  type Feedback,
  type InsertFeedback,
  type ConversationWithReview,
  type TranscriptObject,
  type ReviewObject,
  type TranscriptWithReview
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Transcript operations
  getTranscript(id: number): Promise<Transcript | undefined>;
  createTranscript(transcript: InsertTranscript): Promise<Transcript>;
  updateTranscript(id: number, updates: Partial<Transcript>): Promise<Transcript | undefined>;

  // Conversation operations
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationsByUserId(userId: number): Promise<ConversationWithReview[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  updateConversationFromWebhook(id: number, transcriptData: TranscriptObject[], audioUrl: string | null, metadata: any): Promise<Conversation | undefined>;
  getConversationByElevenlabsId(elevenlabsId: string): Promise<Conversation | undefined>;

  // Review operations
  getReview(id: number): Promise<Review | undefined>;
  getReviewByConversationId(conversationId: number): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, updates: Partial<Review>): Promise<Review | undefined>;

  // Next Steps operations
  getNextSteps(id: number): Promise<NextSteps | undefined>;
  getNextStepsByConversationId(conversationId: number): Promise<NextSteps | undefined>;
  createNextSteps(nextSteps: InsertNextSteps): Promise<NextSteps>;
  updateNextSteps(id: number, updates: Partial<NextSteps>): Promise<NextSteps | undefined>;

  // Feedback operations
  getFeedback(id: number): Promise<Feedback | undefined>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private conversations: Map<number, Conversation>;
  private reviews: Map<number, Review>;
  private transcripts: Map<number, Transcript>;
  private nextSteps: Map<number, NextSteps>;
  private feedback: Map<number, Feedback>;
  private currentUserId: number;
  private currentConversationId: number;
  private currentReviewId: number;
  private currentTranscriptId: number;
  private currentNextStepsId: number;
  private currentFeedbackId: number;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.reviews = new Map();
    this.transcripts = new Map();
    this.nextSteps = new Map();
    this.feedback = new Map();
    this.currentUserId = 1;
    this.currentConversationId = 1;
    this.currentReviewId = 1;
    this.currentTranscriptId = 1;
    this.currentNextStepsId = 1;
    this.currentFeedbackId = 1;

    // Create a demo user for testing
    this.createUser({
      email: "demo@conversly.com",
      authProvider: "local"
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser,
      authProvider: insertUser.authProvider || "local",
      stripeCustomerId: insertUser.stripeCustomerId || null,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getConversationsByUserId(userId: number): Promise<ConversationWithReview[]> {
    const userConversations = Array.from(this.conversations.values())
      .filter(conv => conv.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const conversationsWithReviews: ConversationWithReview[] = [];
    
    for (const conversation of userConversations) {
      const review = await this.getReviewByConversationId(conversation.id);
      conversationsWithReviews.push({
        ...conversation,
        review
      });
    }

    return conversationsWithReviews;
  }

  // Transcript operations
  async getTranscript(id: number): Promise<Transcript | undefined> {
    return this.transcripts.get(id);
  }

  async createTranscript(insertTranscript: InsertTranscript): Promise<Transcript> {
    const id = this.currentTranscriptId++;
    const now = new Date();
    const transcript: Transcript = {
      ...insertTranscript,
      id,
      createdAt: now
    };
    this.transcripts.set(id, transcript);
    return transcript;
  }

  async updateTranscript(id: number, updates: Partial<Transcript>): Promise<Transcript | undefined> {
    const transcript = this.transcripts.get(id);
    if (!transcript) return undefined;

    const updated = { ...transcript, ...updates };
    this.transcripts.set(id, updated);
    return updated;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.currentConversationId++;
    const conversation: Conversation = {
      ...insertConversation,
      transcriptId: insertConversation.transcriptId || null,
      audioUrl: insertConversation.audioUrl || null,
      elevenlabsConversationId: insertConversation.elevenlabsConversationId || null,
      status: insertConversation.status || "pending",
      metadata: insertConversation.metadata || null,
      id,
      createdAt: new Date()
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;

    const updated = { ...conversation, ...updates };
    this.conversations.set(id, updated);
    return updated;
  }

  async updateConversationFromWebhook(
    id: number, 
    transcriptData: TranscriptObject[], 
    audioUrl: string | null, 
    metadata: Record<string, unknown>
  ): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;

    // Create or update transcript with new data structure
    let transcriptId = conversation.transcriptId;
    if (transcriptData && transcriptData.length > 0 && !transcriptId) {
      const transcript = await this.createTranscript({
        transcriptData: transcriptData
      });
      transcriptId = transcript.id;
    } else if (transcriptData && transcriptData.length > 0 && transcriptId) {
      await this.updateTranscript(transcriptId, { transcriptData: transcriptData });
    }

    // Merge webhook metadata with existing metadata
    const existingMetadata = conversation.metadata || null;
    const mergedMetadata = {
      ...(existingMetadata && typeof existingMetadata === 'object' ? existingMetadata as Record<string, any> : {}),
      elevenlabs: {
        ...(existingMetadata && typeof existingMetadata === 'object' && 'elevenlabs' in existingMetadata ? (existingMetadata as any).elevenlabs : {}),
        ...metadata,
        lastWebhookUpdate: new Date().toISOString(),
      }
    };

    const updated = { 
      ...conversation, 
      transcriptId,
      audioUrl: audioUrl || conversation.audioUrl,
      status: transcriptData ? "completed" : conversation.status,
      metadata: mergedMetadata
    };
    
    this.conversations.set(id, updated);
    return updated;
  }

  async getConversationByElevenlabsId(elevenlabsId: string): Promise<Conversation | undefined> {
    return Array.from(this.conversations.values())
      .find(conv => conv.elevenlabsConversationId === elevenlabsId);
  }

  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async getReviewByConversationId(conversationId: number): Promise<Review | undefined> {
    return Array.from(this.reviews.values())
      .find(review => review.conversationId === conversationId);
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.currentReviewId++;
    const review: Review = {
      ...insertReview,
      overallRating: insertReview.overallRating || null,
      id,
      createdAt: new Date()
    };
    this.reviews.set(id, review);
    return review;
  }

  async updateReview(id: number, updates: Partial<Review>): Promise<Review | undefined> {
    const review = this.reviews.get(id);
    if (!review) return undefined;

    const updated = { ...review, ...updates };
    this.reviews.set(id, updated);
    return updated;
  }

  // Next Steps operations
  async getNextSteps(id: number): Promise<NextSteps | undefined> {
    return this.nextSteps.get(id);
  }

  async getNextStepsByConversationId(conversationId: number): Promise<NextSteps | undefined> {
    for (const [, nextSteps] of this.nextSteps) {
      if (nextSteps.conversationId === conversationId) {
        return nextSteps;
      }
    }
    return undefined;
  }

  async createNextSteps(insertNextSteps: InsertNextSteps): Promise<NextSteps> {
    const nextSteps: NextSteps = {
      id: this.currentNextStepsId++,
      conversationId: insertNextSteps.conversationId,
      steps: insertNextSteps.steps,
      createdAt: new Date(),
    };

    this.nextSteps.set(nextSteps.id, nextSteps);
    return nextSteps;
  }

  async updateNextSteps(id: number, updates: Partial<NextSteps>): Promise<NextSteps | undefined> {
    const nextSteps = this.nextSteps.get(id);
    if (!nextSteps) return undefined;

    const updated = { ...nextSteps, ...updates };
    this.nextSteps.set(id, updated);
    return updated;
  }

  async getFeedback(id: number): Promise<Feedback | undefined> {
    return this.feedback.get(id);
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const feedback: Feedback = {
      id: this.currentFeedbackId++,
      conversationId: insertFeedback.conversationId || null,
      name: insertFeedback.name || null,
      email: insertFeedback.email || null,
      feedback: insertFeedback.feedback || null,
      createdAt: new Date(),
    };

    this.feedback.set(feedback.id, feedback);
    return feedback;
  }

}

// Import database storage implementation
import { DatabaseStorage } from "./services/databaseStorage";

// Use database storage for persistent data
export const storage = new DatabaseStorage();

// Legacy memory storage available for development if needed:
// export const storage = new MemStorage();
