import { type AnyColumn, isNull } from 'drizzle-orm'

/**
 * Drizzle query helper for soft-delete filtering.
 * Use in `.where()` to exclude soft-deleted records.
 *
 * @example
 * db.select().from(users).where(whereActive(users))
 */
export function whereActive(table: { deletedAt: AnyColumn }) {
  return isNull(table.deletedAt)
}
