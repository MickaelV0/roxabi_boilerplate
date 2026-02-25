import { eq } from 'drizzle-orm'
import type { DrizzleDB } from '../database/drizzle.provider.js'
import { users } from '../database/schema/auth.schema.js'
import { AdminUserNotFoundException } from './exceptions/userNotFound.exception.js'

/**
 * Fetch a user snapshot or throw AdminUserNotFoundException.
 *
 * Shared between AdminUsersService (update) and
 * AdminUsersLifecycleService (ban / unban / delete / restore).
 */
export async function findUserSnapshotOrThrow(db: DrizzleDB, userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      banned: users.banned,
      banReason: users.banReason,
      banExpires: users.banExpires,
      deletedAt: users.deletedAt,
      deleteScheduledFor: users.deleteScheduledFor,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) {
    throw new AdminUserNotFoundException(userId)
  }
  return user
}
