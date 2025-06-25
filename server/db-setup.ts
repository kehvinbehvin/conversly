// Database setup and initialization script
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function initializeDatabase() {
  try {
    console.log("🗄️ Initializing database...");
    
    // Check if demo user exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, "demo@conversly.com"));
    
    if (!existingUser) {
      // Create demo user
      const [newUser] = await db
        .insert(users)
        .values({
          email: "demo@conversly.com",
          authProvider: "local"
        })
        .returning();
      
      console.log("✅ Demo user created:", newUser.email);
    } else {
      console.log("✅ Demo user already exists:", existingUser.email);
    }
    
    console.log("✅ Database initialization complete");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

// Run initialization if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase().catch(console.error);
}