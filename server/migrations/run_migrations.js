// Migration runner script
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Read and execute the initial schema migration
    const migrationPath = join(__dirname, '001_initial_schema.sql');
    const migrationSQL = await readFile(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    console.log('✅ Migration 001_initial_schema.sql completed successfully');
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export { runMigrations };