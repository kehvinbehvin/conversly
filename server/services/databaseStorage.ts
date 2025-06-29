import { 
  users, 
  conversations, 
  reviews,
  transcripts,
  nextSteps,
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
  type ConversationWithReview,
  type TranscriptObject,
  type ReviewObject,
  type TranscriptWithReview
} from "@shared/schema";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import type { IStorage } from "../storage";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Transcript operations
  async getTranscript(id: number): Promise<Transcript | undefined> {
    const [transcript] = await db.select().from(transcripts).where(eq(transcripts.id, id));
    return transcript || undefined;
  }

  async createTranscript(insertTranscript: InsertTranscript): Promise<Transcript> {
    const [transcript] = await db
      .insert(transcripts)
      .values(insertTranscript)
      .returning();
    return transcript;
  }

  async updateTranscript(id: number, updates: Partial<Transcript>): Promise<Transcript | undefined> {
    const [transcript] = await db
      .update(transcripts)
      .set(updates)
      .where(eq(transcripts.id, id))
      .returning();
    return transcript || undefined;
  }

  // Conversation operations
  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async getConversationsByUserId(userId: number): Promise<ConversationWithReview[]> {
    const userConversations = await db
      .select()
      .from(conversations)
      .leftJoin(reviews, eq(conversations.id, reviews.conversationId))
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt));

    return userConversations.map(row => ({
      ...row.conversations,
      review: row.reviews || undefined
    }));
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const [conversation] = await db
      .update(conversations)
      .set(updates)
      .where(eq(conversations.id, id))
      .returning();
    return conversation || undefined;
  }

  async updateConversationFromWebhook(
    id: number, 
    transcriptData: TranscriptObject[], 
    audioUrl: string | null, 
    metadata: any
  ): Promise<Conversation | undefined> {
    const conversation = await this.getConversation(id);
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

    // Update conversation
    const [updated] = await db
      .update(conversations)
      .set({
        transcriptId,
        audioUrl: audioUrl || conversation.audioUrl,
        status: transcriptData.length > 0 ? "pending" : conversation.status,
        metadata: metadata || conversation.metadata
      })
      .where(eq(conversations.id, id))
      .returning();

    return updated || undefined;
  }

  async getConversationByElevenlabsId(elevenlabsId: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.elevenlabsConversationId, elevenlabsId));
    return conversation || undefined;
  }

  // Review operations
  async getReview(id: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review || undefined;
  }

  async getReviewByConversationId(conversationId: number): Promise<Review | undefined> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.conversationId, conversationId));
    return review || undefined;
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(insertReview)
      .returning();
    return review;
  }

  async updateReview(id: number, updates: Partial<Review>): Promise<Review | undefined> {
    const [review] = await db
      .update(reviews)
      .set(updates)
      .where(eq(reviews.id, id))
      .returning();
    return review || undefined;
  }

  // Next Steps operations
  async getNextSteps(id: number): Promise<NextSteps | undefined> {
    const [nextStepsRecord] = await db.select().from(nextSteps).where(eq(nextSteps.id, id));
    return nextStepsRecord || undefined;
  }

  async getNextStepsByConversationId(conversationId: number): Promise<NextSteps | undefined> {
    const [nextStepsRecord] = await db
      .select()
      .from(nextSteps)
      .where(eq(nextSteps.conversationId, conversationId));
    return nextStepsRecord || undefined;
  }

  async createNextSteps(insertNextSteps: InsertNextSteps): Promise<NextSteps> {
    const [nextStepsRecord] = await db
      .insert(nextSteps)
      .values(insertNextSteps)
      .returning();
    return nextStepsRecord;
  }

  async updateNextSteps(id: number, updates: Partial<NextSteps>): Promise<NextSteps | undefined> {
    const [nextStepsRecord] = await db
      .update(nextSteps)
      .set(updates)
      .where(eq(nextSteps.id, id))
      .returning();
    return nextStepsRecord || undefined;
  }

}