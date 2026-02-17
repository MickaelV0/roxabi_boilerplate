/**
 * JSONL transcript parser for Claude Code session files.
 *
 * Extracts session metadata from JSONL files and optional sessions-index.json.
 * Handles malformed files gracefully (skip + log, no crash).
 */

/** Path to Claude Code session transcripts */
const SESSIONS_DIR = '~/.claude/projects/-home-mickael-projects-roxabi-boilerplate'

/** Parsed session metadata before DB insertion */
export interface ParsedSession {
  id: string
  project_path: string | null
  git_branch: string | null
  first_prompt: string | null
  summary: string | null
  message_count: number
  created_at: string | null
  modified_at: string | null
  duration_minutes: number | null
}

/**
 * Resolve the sessions directory path (expand ~).
 */
export function getSessionsDir(): string {
  // TODO: implement — expand ~ to HOME
  throw new Error('Not implemented')
}

/**
 * List all .jsonl session files in the sessions directory.
 */
export function listSessionFiles(): string[] {
  // TODO: implement
  // 1. Resolve sessions dir
  // 2. Read directory
  // 3. Filter for .jsonl files
  // 4. Return sorted list of full paths
  throw new Error('Not implemented')
}

/**
 * Load sessions-index.json for metadata enrichment.
 * Returns null if the file doesn't exist or is malformed.
 */
export function loadSessionsIndex(): Record<string, unknown> | null {
  // TODO: implement
  // 1. Try to read sessions-index.json from SESSIONS_DIR
  // 2. Parse as JSON
  // 3. Return parsed data or null on error
  throw new Error('Not implemented')
}

/**
 * Parse a single JSONL session file into a ParsedSession.
 * Returns null for malformed or empty files.
 */
export function parseSessionFile(_filePath: string): ParsedSession | null {
  // TODO: implement
  // 1. Read file line by line
  // 2. Parse each line as JSON
  // 3. Extract: session ID, project path, git branch, first prompt
  // 4. Calculate: message count, timestamps, duration
  // 5. Return ParsedSession or null on error
  throw new Error('Not implemented')
}

/**
 * Parse all session files and insert into the database.
 * Idempotent: skips sessions already in the database.
 *
 * @returns { parsed: number, skipped: number, existing: number, total: number }
 */
export function parseAllSessions(_db: import('bun:sqlite').Database): {
  parsed: number
  skipped: number
  existing: number
  total: number
} {
  // TODO: implement
  // 1. List all session files
  // 2. Load sessions index for enrichment
  // 3. Query existing session IDs
  // 4. For each new file: parse, enrich, insert, log
  // 5. Report progress
  throw new Error('Not implemented')
}

export { SESSIONS_DIR }
