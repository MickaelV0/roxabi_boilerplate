import type { CursorPaginatedResponse } from '@repo/types'
import { and, eq, lt, or, type SQL } from 'drizzle-orm'
import type { PgColumn } from 'drizzle-orm/pg-core'

/**
 * Encode a (timestamp, id) pair into a Base64 cursor string.
 */
export function encodeCursor(timestamp: Date, id: string): string {
  return btoa(JSON.stringify({ t: timestamp.toISOString(), i: id }))
}

/**
 * Decode a Base64-encoded cursor into its (timestamp, id) components.
 */
export function decodeCursor(cursor: string): { timestamp: Date; id: string } {
  if (!cursor) {
    throw new Error('Invalid cursor: empty string')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(atob(cursor))
  } catch {
    throw new Error('Invalid cursor: malformed Base64 or JSON')
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('t' in parsed) ||
    !('i' in parsed) ||
    typeof (parsed as Record<string, unknown>).t !== 'string' ||
    typeof (parsed as Record<string, unknown>).i !== 'string'
  ) {
    throw new Error('Invalid cursor: missing required fields')
  }

  const { t, i } = parsed as { t: string; i: string }
  const timestamp = new Date(t)

  if (Number.isNaN(timestamp.getTime())) {
    throw new Error('Invalid cursor: timestamp is not a valid date')
  }

  return { timestamp, id: i }
}

/**
 * Build a Drizzle SQL condition for cursor-based pagination.
 * Returns: `tsColumn < cursor_ts OR (tsColumn = cursor_ts AND idColumn < cursor_id)`
 *
 * Each service composes its own query and applies this condition in the WHERE clause.
 */
export function buildCursorCondition(cursor: string, tsColumn: PgColumn, idColumn: PgColumn): SQL {
  const { timestamp, id } = decodeCursor(cursor)
  return or(lt(tsColumn, timestamp), and(eq(tsColumn, timestamp), lt(idColumn, id)))!
}

/**
 * Build a cursor-paginated response from N+1 rows.
 * Trims to N rows and computes the next cursor.
 */
export function buildCursorResponse<T>(
  rows: T[],
  limit: number,
  getTimestamp: (row: T) => Date,
  getId: (row: T) => string
): CursorPaginatedResponse<T> {
  const hasMore = rows.length > limit
  const data = hasMore ? rows.slice(0, limit) : rows
  const lastRow = data[data.length - 1]
  const next = hasMore && lastRow ? encodeCursor(getTimestamp(lastRow), getId(lastRow)) : null
  return { data, cursor: { next, hasMore } }
}
