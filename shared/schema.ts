import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
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
  transcriptData: jsonb("transcript_data").notNull(), // Array of transcript objects
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  summary: text("summary").notNull(),
  overallRating: integer("overall_rating"), // Score: +1 per complement, -1 per improvement
  transcriptWithReviews: jsonb("transcript_with_reviews").notNull(), // Merged transcript and review data
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertTranscript = z.infer<typeof insertTranscriptSchema>;
export type Transcript = typeof transcripts.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// New data structures as per requirements
export type TranscriptObject = {
  index: number;
  role: "agent" | "user";
  message: string;
  time_in_call_secs: number;
};

export type ReviewObject = {
  index: number;
  review: string;
  category: "complement" | "improvement";
};

export type TranscriptWithReview = TranscriptObject & {
  review?: string | null;
};

// Extended types for API responses
export type ConversationWithReview = Conversation & {
  review?: Review;
  transcript?: Transcript;
};

// Avatar type for conversation agent selection
export type Avatar = {
  name: string;
  description: string;
  agent_id: string;
};

// Avatar validation schema
export const avatarSchema = z.object({
  name: z.string().min(1, "Avatar name is required"),
  description: z.string().min(1, "Avatar description is required"),
  agent_id: z
    .string()
    .regex(/^agent_[a-z0-9]{26}$/, "Invalid ElevenLabs agent ID format"),
});

// Type for validated avatar
export type ValidatedAvatar = z.infer<typeof avatarSchema>;

// Environment detection utility
function getEnvironment(): 'development' | 'production' {
  // Check server-side environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'production' ? 'production' : 'development';
  }
  
  // Check client-side environment (Vite)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.PROD ? 'production' : 'development';
  }
  
  // Default to development for safety
  return 'development';
}

// Avatar data definitions - development environment
const DEVELOPMENT_AVATARS: Avatar[] = [
  {
    name: "Jessie",
    description: "Your local cafe barista",
    agent_id: "agent_01jyfb9fh8f67agfzvv09tvg3t",
  },
  {
    name: "Shawn",
    description: "A mutual friend at a house party",
    agent_id: "agent_01jypzmj9heh3rhmn47anjbsr8",
  },
  {
    name: "Maya",
    description: "A cyclist at a cycling event",
    agent_id: "agent_01jyq00m9aev8rq8e6a040rjmv",
  },
  {
    name: "Sam",
    description: "A fellow housewarming guest",
    agent_id: "agent_01jyq0j92gfxdrv3me49xygae1",
  },
];

// Avatar data definitions - production environment
const PRODUCTION_AVATARS: Avatar[] = [
  {
    name: "Jessie",
    description: "Your local cafe barista",
    agent_id: "agent_01jys1g9ndfcqthwrs8p9fy4bn",
  },
  {
    name: "Shawn",
    description: "A mutual friend at a house party",
    agent_id: "agent_01jys1h6dfe0dt1x186wkqcnmb",
  },
  {
    name: "Maya",
    description: "A cyclist at a cycling event",
    agent_id: "agent_01jys1jsmje7wvb6vak1dt4t54",
  },
  {
    name: "Sam",
    description: "A fellow housewarming guest",
    agent_id: "agent_01jys1hz8zf9crk3j8aq7hnk9b",
  },
];

// Environment-aware avatar configuration
export const AVATARS: Avatar[] = getEnvironment() === 'production' 
  ? PRODUCTION_AVATARS 
  : DEVELOPMENT_AVATARS;

// Utility function to get avatars for specific environment (useful for testing)
export function getAvatarsForEnvironment(env: 'development' | 'production'): Avatar[] {
  return env === 'production' ? PRODUCTION_AVATARS : DEVELOPMENT_AVATARS;
}

// Legacy types removed - no longer used after refactor

// Database relations
export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
}));

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [conversations.userId],
      references: [users.id],
    }),
    transcript: one(transcripts, {
      fields: [conversations.transcriptId],
      references: [transcripts.id],
    }),
    review: one(reviews, {
      fields: [conversations.id],
      references: [reviews.conversationId],
    }),
  }),
);

export const transcriptsRelations = relations(transcripts, ({ many }) => ({
  conversations: many(conversations),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  conversation: one(conversations, {
    fields: [reviews.conversationId],
    references: [conversations.id],
  }),
}));
