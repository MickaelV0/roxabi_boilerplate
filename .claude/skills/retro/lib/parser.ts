/**
 * JSONL transcript parser for Claude Code session files.
 *
 * Extracts session metadata from JSONL files and optional sessions-index.json.
 * Handles malformed files gracefully (skip + log, no crash).
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

/** Path to Claude Code session transcripts */
const SESSIONS_DIR =
  process.env.RETRO_SESSIONS_DIR || '~/.claude/projects/-home-mickael-projects-roxabi-boilerplate'

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
  const home = process.env.HOME || Bun.env.HOME || ''
  const expanded = SESSIONS_DIR.replace(/^~/, home)
  return path.resolve(expanded)
}

/**
 * List all .jsonl session files in the sessions directory.
 */
export function listSessionFiles(): string[] {
  try {
    const dir = getSessionsDir()
    const entries = readdirSync(dir)
    return entries
      .filter((f) => f.endsWith('.jsonl'))
      .sort()
      .map((f) => path.join(dir, f))
  } catch {
    return []
  }
}

/**
 * Load sessions-index.json for metadata enrichment.
 * Returns null if the file doesn't exist or is malformed.
 */
export function loadSessionsIndex(): Record<string, unknown> | null {
  try {
    const indexPath = path.join(getSessionsDir(), 'sessions-index.json')
    if (!existsSync(indexPath)) {
      return null
    }
    const raw = readFileSync(indexPath, 'utf-8')
    return JSON.parse(raw) as Record<string, unknown>
  } catch (err) {
    console.warn('Warning: could not load sessions-index.json:', (err as Error).message)
    return null
  }
}

/** Parse raw JSONL content into an array of JSON objects, skipping malformed lines. */
function parseJsonlLines(raw: string): Record<string, unknown>[] {
  const lines = raw.split('\n').filter((line) => line.trim().length > 0)
  const entries: Record<string, unknown>[] = []
  for (const line of lines) {
    try {
      entries.push(JSON.parse(line) as Record<string, unknown>)
    } catch {
      // Skip malformed JSON lines
    }
  }
  return entries
}

/** Extract the text content from a user message entry. */
function extractMessageText(msg: unknown): string | null {
  if (typeof msg === 'string') {
    return msg
  }
  if (msg && typeof msg === 'object') {
    const msgObj = msg as Record<string, unknown>
    if (typeof msgObj.text === 'string') {
      return msgObj.text
    }
  }
  return null
}

/** Intermediate accumulator for session metadata extracted from JSONL entries. */
interface SessionMetadata {
  firstPrompt: string | null
  messageCount: number
  projectPath: string | null
  gitBranch: string | null
  summary: string | null
  timestamps: string[]
}

/** Accumulate metadata from a single JSONL entry into the session metadata. */
function accumulateEntry(meta: SessionMetadata, entry: Record<string, unknown>): void {
  if (typeof entry.timestamp === 'string') {
    meta.timestamps.push(entry.timestamp)
  }
  if (typeof entry.project_path === 'string' && !meta.projectPath) {
    meta.projectPath = entry.project_path
  }
  if (typeof entry.git_branch === 'string' && !meta.gitBranch) {
    meta.gitBranch = entry.git_branch
  }
  if (entry.type === 'summary' && typeof entry.summary === 'string' && !meta.summary) {
    meta.summary = entry.summary
  }
  if (typeof entry.role === 'string') {
    meta.messageCount++
  }
  if (entry.role === 'user' && !meta.firstPrompt) {
    meta.firstPrompt = extractMessageText(entry.message)
  }
}

/** Extract session metadata from parsed JSONL entries. */
function extractMetadata(entries: Record<string, unknown>[]): SessionMetadata {
  const meta: SessionMetadata = {
    firstPrompt: null,
    messageCount: 0,
    projectPath: null,
    gitBranch: null,
    summary: null,
    timestamps: [],
  }

  for (const entry of entries) {
    accumulateEntry(meta, entry)
  }

  return meta
}

/** Calculate duration in minutes between two ISO timestamp strings. */
function calculateDuration(startIso: string, endIso: string): number | null {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return null
  }
  return Math.round(((end - start) / 60000) * 100) / 100
}

/**
 * Parse a single JSONL session file into a ParsedSession.
 * Returns null for malformed or empty files.
 */
export function parseSessionFile(filePath: string): ParsedSession | null {
  try {
    const raw = readFileSync(filePath, 'utf-8')
    const entries = parseJsonlLines(raw)

    if (entries.length === 0) {
      return null
    }

    const sessionId = path.basename(filePath, '.jsonl')
    const meta = extractMetadata(entries)

    const sortedTimestamps = meta.timestamps.sort()
    const createdAt = sortedTimestamps.length > 0 ? sortedTimestamps[0] : null
    const modifiedAt =
      sortedTimestamps.length > 0 ? sortedTimestamps[sortedTimestamps.length - 1] : null
    const durationMinutes =
      createdAt && modifiedAt ? calculateDuration(createdAt, modifiedAt) : null

    return {
      id: sessionId,
      project_path: meta.projectPath,
      git_branch: meta.gitBranch,
      first_prompt: meta.firstPrompt,
      summary: meta.summary,
      message_count: meta.messageCount,
      created_at: createdAt,
      modified_at: modifiedAt,
      duration_minutes: durationMinutes,
    }
  } catch {
    return null
  }
}

/** Enrich a session with data from the sessions index. */
function enrichFromIndex(
  session: ParsedSession,
  sessionId: string,
  sessionsIndex: Record<string, unknown> | null
): void {
  if (!sessionsIndex || !(sessionId in sessionsIndex)) return
  const indexEntry = sessionsIndex[sessionId] as Record<string, unknown> | undefined
  if (indexEntry && typeof indexEntry.summary === 'string' && !session.summary) {
    session.summary = indexEntry.summary
  }
}

/**
 * Parse all session files and insert into the database.
 * Idempotent: skips sessions already in the database.
 *
 * @returns { parsed: number, skipped: number, existing: number, total: number }
 */
export function parseAllSessions(db: import('bun:sqlite').Database): {
  parsed: number
  skipped: number
  existing: number
  total: number
} {
  const files = listSessionFiles()
  const sessionsIndex = loadSessionsIndex()

  // Get existing session IDs
  const existingRows = db.prepare('SELECT id FROM sessions').all() as { id: string }[]
  const existingIds = new Set(existingRows.map((row) => row.id))

  const insertSession = db.prepare(`
    INSERT INTO sessions (id, project_path, git_branch, first_prompt, summary, message_count, created_at, modified_at, duration_minutes, processed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `)

  const insertLog = db.prepare(`
    INSERT OR REPLACE INTO processing_log (session_id, phase, status, error_message)
    VALUES (?, 'parse', ?, ?)
  `)

  let parsed = 0
  let skipped = 0
  const existing = existingIds.size

  const processFile = (filePath: string): void => {
    const sessionId = path.basename(filePath, '.jsonl')

    if (existingIds.has(sessionId)) {
      return
    }

    const session = parseSessionFile(filePath)

    if (!session) {
      skipped++
      insertLog.run(sessionId, 'skipped', 'Malformed or empty session file')
      return
    }

    enrichFromIndex(session, sessionId, sessionsIndex)

    insertSession.run(
      session.id,
      session.project_path,
      session.git_branch,
      session.first_prompt,
      session.summary,
      session.message_count,
      session.created_at,
      session.modified_at,
      session.duration_minutes
    )

    insertLog.run(sessionId, 'success', null)
    parsed++

    if (parsed % 50 === 0) {
      console.log(`  Progress: ${parsed} sessions parsed...`)
    }
  }

  const runInTransaction = db.transaction(() => {
    for (const filePath of files) {
      processFile(filePath)
    }
  })
  runInTransaction()

  const total = existing + parsed

  return { parsed, skipped, existing, total }
}

export { SESSIONS_DIR }
