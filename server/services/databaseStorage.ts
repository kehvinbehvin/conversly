import { 
  users, 
  conversations, 
  reviews,
  transcripts,
  improvements,
  type User, 
  type InsertUser, 
  type Conversation,
  type InsertConversation,
  type Review,
  type InsertReview,
  type Transcript,
  type InsertTranscript,
  type Improvement,
  type InsertImprovement,
  type ConversationWithReview,
  type ReviewWithImprovements,
  type ConversationWithReviewAndImprovements
} from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
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
      .orderBy(conversations.createdAt);

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
    transcriptContent: string, 
    audioUrl: string | null, 
    metadata: any
  ): Promise<Conversation | undefined> {
    const conversation = await this.getConversation(id);
    if (!conversation) return undefined;

    // Create or update transcript
    let transcriptId = conversation.transcriptId;
    if (transcriptContent && !transcriptId) {
      const transcript = await this.createTranscript({
        fileLocation: `data/transcripts/${id}-${Date.now()}.json`,
        content: transcriptContent
      });
      transcriptId = transcript.id;
    } else if (transcriptContent && transcriptId) {
      await this.updateTranscript(transcriptId, { content: transcriptContent });
    }

    // Update conversation
    const [updated] = await db
      .update(conversations)
      .set({
        transcriptId,
        audioUrl: audioUrl || conversation.audioUrl,
        status: transcriptContent ? "completed" : conversation.status,
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

  // Improvement operations
  async getImprovement(id: number): Promise<Improvement | undefined> {
    const [improvement] = await db.select().from(improvements).where(eq(improvements.id, id));
    return improvement || undefined;
  }

  async getImprovementsByReviewId(reviewId: number): Promise<Improvement[]> {
    return await db
      .select()
      .from(improvements)
      .where(eq(improvements.reviewId, reviewId))
      .orderBy(improvements.transcriptSectionStart);
  }

  async createImprovement(insertImprovement: InsertImprovement): Promise<Improvement> {
    const [improvement] = await db
      .insert(improvements)
      .values(insertImprovement)
      .returning();
    return improvement;
  }

  async updateImprovement(id: number, updates: Partial<Improvement>): Promise<Improvement | undefined> {
    const [improvement] = await db
      .update(improvements)
      .set(updates)
      .where(eq(improvements.id, id))
      .returning();
    return improvement || undefined;
  }

  async deleteImprovement(id: number): Promise<boolean> {
    const result = await db
      .delete(improvements)
      .where(eq(improvements.id, id));
    return result.rowCount > 0;
  }
}