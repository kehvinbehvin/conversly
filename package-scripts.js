// Package scripts for database operations
import { spawn } from 'child_process';

// Run database migrations
export async function runMigrations() {
  return new Promise((resolve, reject) => {
    const migration = spawn('node', ['server/migrations/run_migrations.js'], {
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    migration.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Migration failed with code ${code}`));
      }
    });
  });
}

// Add migration script to package.json if needed
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  if (command === 'migrate') {
    runMigrations().catch(console.error);
  }
}