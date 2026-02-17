#!/usr/bin/env bun
/**
 * Phase 2: AI-powered finding extraction via Claude CLI.
 *
 * Sends session transcripts to `claude -p --output-format json` for classification.
 * Extracts findings (praise, blocker, suggestion, nitpick) with severity and tags.
 * Generates embeddings via Transformers.js and stores in sqlite-vec.
 *
 * Usage:
 *   bun run .claude/skills/retro/scripts/analyze-findings.ts
 *   bun run .claude/skills/retro/scripts/analyze-findings.ts --limit 10
 *   bun run .claude/skills/retro/scripts/analyze-findings.ts --reanalyze <session-id>
 *   bun run .claude/skills/retro/scripts/analyze-findings.ts --reanalyze all
 */

import { getDatabase } from '../lib/db'
import { initEmbedder } from '../lib/embedder'

// TODO: implement
// 1. Parse CLI arguments (--limit N, --reanalyze <id|all>)
// 2. Get database connection
// 3. Initialize embedder
// 4. Handle --reanalyze flow (clear + re-process)
// 5. Query unanalyzed sessions
// 6. For each session:
//    a. Read JSONL transcript
//    b. Truncate if >500 messages (first 50 + last 50)
//    c. Invoke: claude -p --output-format json
//    d. Double JSON parse (outer CLI wrapper, inner findings array)
//    e. Redact secrets from each finding
//    f. Insert findings into DB (FTS5 triggers handle index)
//    g. Generate embedding for each finding, insert into finding_embeddings
//    h. Set analyzed_at on session
//    i. Log to processing_log
// 7. Report summary

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  const limitIdx = args.indexOf('--limit')
  const _limit = limitIdx !== -1 ? Number.parseInt(args[limitIdx + 1], 10) : undefined

  const reanalyzeIdx = args.indexOf('--reanalyze')
  const reanalyzeTarget = reanalyzeIdx !== -1 ? args[reanalyzeIdx + 1] : undefined

  console.log('Phase 2: Analyzing sessions with AI...')

  const db = getDatabase()
  try {
    await initEmbedder()

    if (reanalyzeTarget) {
      // TODO: implement reanalyze flow
      console.log(`Reanalyze target: ${reanalyzeTarget}`)
      throw new Error('Not implemented')
    }

    // TODO: implement main analyze flow
    throw new Error('Not implemented')
  } finally {
    db.close()
  }
}

main().catch((err) => {
  console.error('Analysis failed:', err.message)
  process.exit(1)
})
