import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  authProvider: text("auth_provider").notNull().default("local"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  transcriptId: integer("transcript_id"),
  audioUrl: text("audio_url"),
  elevenlabsConversationId: text("elevenlabs_conversation_id"),
  status: text("status").notNull().default("pending"), // pending, completed, analyzed
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transcripts = pgTable("transcripts", {
  id: serial("id").primaryKey(),
  fileLocation: text("file_location").notNull(),
  content: text("content"), // Full transcript text
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  summary: text("summary").notNull(),
  overallRating: integer("overall_rating"), // 1-5 scale
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const improvements = pgTable("improvements", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(),
  transcriptSectionStart: integer("transcript_section_start").notNull(), // Character position start
  transcriptSectionEnd: integer("transcript_section_end").notNull(), // Character position end
  feedbackText: text("feedback_text").notNull(),
  improvementType: text("improvement_type").notNull(), // "positive" | "improvement" | "neutral"
  priority: text("priority").notNull().default("medium"), // "high" | "medium" | "low"
  category: text("category"), // e.g., "tone", "clarity", "engagement"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertTranscriptSchema = createInsertSchema(transcripts).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertImprovementSchema = createInsertSchema(improvements).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertTranscript = z.infer<typeof insertTranscriptSchema>;
export type Transcript = typeof transcripts.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertImprovement = z.infer<typeof insertImprovementSchema>;
export type Improvement = typeof improvements.$inferSelect;

// Extended types for API responses
export type ConversationWithReview = Conversation & {
  review?: Review;
  transcript?: Transcript;
};

export type ReviewWithImprovements = Review & {
  improvements: Improvement[];
};

export type ConversationWithReviewAndImprovements = Conversation & {
  review?: ReviewWithImprovements;
  transcript?: Transcript;
};

export type ReviewHighlight = {
  text: string;
  feedback: string;
  type: "positive" | "improvement" | "neutral";
  startTime?: number;
  endTime?: number;
};

export type ReviewSuggestion = {
  category: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
};

export type ReviewStrength = {
  category: string;
  description: string;
  examples: string[];
};

// Database relations
export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, { fields: [conversations.userId], references: [users.id] }),
  transcript: one(transcripts, { fields: [conversations.transcriptId], references: [transcripts.id] }),
  reviews: many(reviews),
}));

export const transcriptsRelations = relations(transcripts, ({ many }) => ({
  conversations: many(conversations),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  conversation: one(conversations, { fields: [reviews.conversationId], references: [conversations.id] }),
  improvements: many(improvements),
}));

export const improvementsRelations = relations(improvements, ({ one }) => ({
  review: one(reviews, { fields: [improvements.reviewId], references: [reviews.id] }),
}));
