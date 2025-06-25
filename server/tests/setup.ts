import { beforeAll, afterAll } from 'vitest';
import { initializeDatabase } from '../db-setup';

beforeAll(async () => {
  // Initialize database for testing
  await initializeDatabase();
});

afterAll(async () => {
  // Cleanup can be added here if needed
});