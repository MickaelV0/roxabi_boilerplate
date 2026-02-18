#!/usr/bin/env bun
/**
 * Phase 1: Mechanical parse of Claude Code session transcripts.
 *
 * Scans JSONL files, extracts metadata, inserts into sessions table.
 * Idempotent: re-running skips sessions already in the database.
 *
 * Usage: bun run .claude/skills/retro/scripts/parse-sessions.ts
 */

import { getDatabase } from '../lib/db'
import { parseAllSessions } from '../lib/parser'

async function main(): Promise<void> {
  console.log('Phase 1: Parsing session transcripts...')

  const db = getDatabase()
  try {
    const result = parseAllSessions(db)
    console.log(
      `Parsed ${result.parsed} new sessions (${result.existing} already existed, ${result.skipped} skipped). Total: ${result.total} sessions.`
    )
  } finally {
    db.close()
  }
}

main().catch((err) => {
  console.error('Parse failed:', err.message)
  process.exit(1)
})
