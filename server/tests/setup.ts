import { beforeEach, afterEach } from 'vitest';
import { storage } from '../storage';
import { db } from '../db';
import { users, conversations, reviews, transcripts, improvements } from '@shared/schema';

// Set test environment
process.env.NODE_ENV = 'test';

// Reset storage before each test
beforeEach(async () => {
  // Clear database tables for tests
  try {
    // Delete in order to respect foreign key constraints
    await db.delete(improvements);
    await db.delete(reviews); 
    await db.delete(conversations);
    await db.delete(transcripts);
    await db.delete(users);
    
    // Recreate demo user with known ID for tests
    const [user] = await db.insert(users).values({
      email: "demo@conversly.com",
      authProvider: "local"
    }).returning();
    
    // Store user ID for tests
    (global as any).testUserId = user.id;
  } catch (error) {
    console.error('Test setup error:', error);
  }
});

afterEach(async () => {
  // Clean up after each test if needed
});