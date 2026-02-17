/**
 * SQLite database setup with sqlite-vec extension for vector search.
 *
 * Uses bun:sqlite (built-in) + sqlite-vec for vector operations.
 * Database is stored at .claude/skills/retro/data/retro.db
 */

import type { Database } from 'bun:sqlite'

const DATA_DIR = '.claude/skills/retro/data'
const DB_PATH = `${DATA_DIR}/retro.db`

/**
 * Open or create the retro database with WAL mode and sqlite-vec extension.
 */
export function openDatabase(): Database {
  // TODO: implement
  // 1. Ensure DATA_DIR exists
  // 2. Open database with WAL mode
  // 3. Load sqlite-vec extension
  // 4. Return database instance
  throw new Error('Not implemented')
}

/**
 * Initialize the database: create tables, FTS5, vec0, and triggers.
 */
export function initializeDatabase(): Database {
  // TODO: implement
  // 1. Open database via openDatabase()
  // 2. Apply schema via applySchema()
  // 3. Return initialized database
  throw new Error('Not implemented')
}

/**
 * Get an existing database connection (fails if DB does not exist).
 */
export function getDatabase(): Database {
  // TODO: implement
  // 1. Check if DB_PATH exists
  // 2. If not, throw "No retro database found. Run `/retro --setup` first."
  // 3. Open and return database
  throw new Error('Not implemented')
}

export { DB_PATH, DATA_DIR }
