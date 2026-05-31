import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

/**
 * Synchronizes a Firebase user with the PostgreSQL database.
 * Uses upsert to handle concurrent login requests safely.
 */
export async function getOrCreateUser(uid: string, email: string, displayName?: string, photoURL?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        displayName,
        photoURL,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName,
          photoURL,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Failed to sync user to database:", error);
    // Fallback to searching if returning fails or in case of other issues
    const existing = await db.select().from(users).where(eq(users.uid, uid));
    if (existing.length > 0) return existing[0];
    throw new Error("Database synchronization failed", { cause: error });
  }
}
