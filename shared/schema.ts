import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
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
  transcriptUrl: text("transcript_url"),
  audioUrl: text("audio_url"),
  transcript: text("transcript"),
  elevenlabsConversationId: text("elevenlabs_conversation_id"),
  status: text("status").notNull().default("pending"), // pending, completed, analyzed
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  highlights: jsonb("highlights").notNull(), // Array of highlighted sections with feedback
  summary: text("summary").notNull(),
  overallRating: integer("overall_rating"), // 1-5 scale
  suggestions: jsonb("suggestions").notNull(), // Array of improvement suggestions
  strengths: jsonb("strengths").notNull(), // Array of identified strengths
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

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// Extended types for API responses
export type ConversationWithReview = Conversation & {
  review?: Review;
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
