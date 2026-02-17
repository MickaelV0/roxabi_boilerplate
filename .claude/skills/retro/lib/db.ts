/**
 * SQLite database setup with sqlite-vec extension for vector search.
 *
 * Uses bun:sqlite (built-in) + sqlite-vec for vector operations.
 * Database is stored at .claude/skills/retro/data/retro.db
 */

import { Database } from 'bun:sqlite'
import { existsSync, mkdirSync } from 'node:fs'
import * as sqliteVec from 'sqlite-vec'
import { applySchema } from './schema'

const DATA_DIR = '.claude/skills/retro/data'
const DB_PATH = `${DATA_DIR}/retro.db`

/**
 * Open or create the retro database with WAL mode and sqlite-vec extension.
 */
export function openDatabase(): Database {
  mkdirSync(DATA_DIR, { recursive: true })
  const db = new Database(DB_PATH)
  db.run('PRAGMA journal_mode=WAL')
  sqliteVec.load(db)
  return db
}

/**
 * Initialize the database: create tables, FTS5, vec0, and triggers.
 */
export function initializeDatabase(): Database {
  const db = openDatabase()
  applySchema(db)
  return db
}

/**
 * Get an existing database connection (fails if DB does not exist).
 */
export function getDatabase(): Database {
  if (!existsSync(DB_PATH)) {
    throw new Error('No retro database found. Run "/retro --setup" first.')
  }
  return openDatabase()
}

export { DB_PATH, DATA_DIR }
