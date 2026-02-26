import { and, count, eq, isNull, ne } from 'drizzle-orm'
import type { DrizzleDB, DrizzleTx } from '../database/drizzle.provider.js'
import { users } from '../database/schema/auth.schema.js'
import { AdminUserNotFoundException } from './exceptions/userNotFound.exception.js'

/**
 * Check whether the given user is the last active superadmin.
 *
 * Counts active (non-banned, non-deleted) superadmins excluding excludeUserId.
 * Returns true when that count is zero, meaning no other active superadmin exists.
 *
 * Accepts either a plain DrizzleDB connection or a transaction (they share the
 * same query-builder interface), so it works both inside and outside transactions.
 */
export async function isLastActiveSuperadmin(
  db: DrizzleDB | DrizzleTx,
  excludeUserId: string
): Promise<boolean> {
  const [result] = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        eq(users.role, 'superadmin'),
        eq(users.banned, false),
        isNull(users.deletedAt),
        ne(users.id, excludeUserId)
      )
    )
  return (result?.count ?? 0) === 0
}

/**
 * Fetch a user snapshot or throw AdminUserNotFoundException.
 *
 * Shared between AdminUsersService (update) and
 * AdminUsersLifecycleService (ban / unban / delete / restore).
 */
export async function findUserSnapshotOrThrow(db: DrizzleDB | DrizzleTx, userId: string) {
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
