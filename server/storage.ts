import { 
  users, 
  conversations, 
  reviews,
  type User, 
  type InsertUser, 
  type Conversation,
  type InsertConversation,
  type Review,
  type InsertReview,
  type ConversationWithReview
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Conversation operations
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationsByUserId(userId: number): Promise<ConversationWithReview[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  updateConversationFromWebhook(id: number, transcript: string, audioUrl: string | null, metadata: any): Promise<Conversation | undefined>;
  getConversationByElevenlabsId(elevenlabsId: string): Promise<Conversation | undefined>;

  // Review operations
  getReview(id: number): Promise<Review | undefined>;
  getReviewByConversationId(conversationId: number): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, updates: Partial<Review>): Promise<Review | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private conversations: Map<number, Conversation>;
  private reviews: Map<number, Review>;
  private currentUserId: number;
  private currentConversationId: number;
  private currentReviewId: number;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.reviews = new Map();
    this.currentUserId = 1;
    this.currentConversationId = 1;
    this.currentReviewId = 1;

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
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.currentConversationId++;
    const conversation: Conversation = {
      ...insertConversation,
      transcriptUrl: insertConversation.transcriptUrl || null,
      audioUrl: insertConversation.audioUrl || null,
      transcript: insertConversation.transcript || null,
      elevenlabsConversationId: insertConversation.elevenlabsConversationId || null,
      status: insertConversation.status || "pending",
      metadata: insertConversation.metadata || {},
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
    transcript: string, 
    audioUrl: string | null, 
    metadata: any
  ): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;

    // Merge webhook metadata with existing metadata
    const mergedMetadata = {
      ...conversation.metadata,
      elevenlabs: {
        ...conversation.metadata?.elevenlabs,
        ...metadata,
        lastWebhookUpdate: new Date().toISOString(),
      }
    };

    const updated = { 
      ...conversation, 
      transcript: transcript || conversation.transcript,
      audioUrl: audioUrl || conversation.audioUrl,
      status: transcript ? "completed" : conversation.status,
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
}

export const storage = new MemStorage();
