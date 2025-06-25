-- Migration: 001_initial_schema.sql
-- Create initial tables for Conversly application

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  auth_provider TEXT NOT NULL DEFAULT 'local',
  stripe_customer_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
  id SERIAL PRIMARY KEY,
  file_location TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  transcript_id INTEGER REFERENCES transcripts(id),
  audio_url TEXT,
  elevenlabs_conversation_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id),
  summary TEXT NOT NULL,
  overall_rating INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Improvements table
CREATE TABLE IF NOT EXISTS improvements (
  id SERIAL PRIMARY KEY,
  review_id INTEGER NOT NULL REFERENCES reviews(id),
  transcript_section_start INTEGER NOT NULL,
  transcript_section_end INTEGER NOT NULL,
  feedback_text TEXT NOT NULL,
  improvement_type TEXT NOT NULL CHECK (improvement_type IN ('positive', 'improvement', 'neutral')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  category TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_transcript_id ON conversations(transcript_id);
CREATE INDEX IF NOT EXISTS idx_reviews_conversation_id ON reviews(conversation_id);
CREATE INDEX IF NOT EXISTS idx_improvements_review_id ON improvements(review_id);
CREATE INDEX IF NOT EXISTS idx_improvements_section ON improvements(transcript_section_start, transcript_section_end);