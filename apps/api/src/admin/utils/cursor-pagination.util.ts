import type { CursorPaginatedResponse } from '@repo/types'
import type { SQL } from 'drizzle-orm'

/**
 * Decode a Base64-encoded cursor into its (timestamp, id) components.
 */
export function decodeCursor(cursor: string): { timestamp: Date; id: string } {
  // TODO: implement — decode Base64 cursor string to { timestamp, id }
  throw new Error('Not implemented')
}

/**
 * Encode a (timestamp, id) pair into a Base64 cursor string.
 */
export function encodeCursor(timestamp: Date, id: string): string {
  // TODO: implement — encode { timestamp, id } to Base64 string
  throw new Error('Not implemented')
}

/**
 * Build a Drizzle SQL condition for cursor-based pagination.
 * Returns: `tsColumn < cursor_ts OR (tsColumn = cursor_ts AND idColumn < cursor_id)`
 *
 * Each service composes its own query and applies this condition in the WHERE clause.
 */
export function buildCursorCondition(cursor: string, tsColumn: unknown, idColumn: unknown): SQL {
  // TODO: implement — parse cursor, return Drizzle SQL condition
  throw new Error('Not implemented')
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
  // TODO: implement — trim rows, compute hasMore and next cursor
  throw new Error('Not implemented')
}
