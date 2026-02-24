#!/usr/bin/env bun

/**
 * Phase 2: AI-powered finding extraction.
 *
 * Sends session transcripts to an AI provider for classification.
 * Extracts findings (praise, blocker, suggestion, nitpick) with severity and tags.
 * Generates embeddings via Transformers.js and stores in sqlite-vec.
 *
 * Features:
 * - Strict JSON schema enforcement (OpenRouter structured_outputs / Claude CLI --json-schema)
 * - Character-based chunking for large sessions (split at assistant message boundaries)
 * - Dedup pass for multi-chunk sessions
 * - Retry with exponential backoff (3 attempts: 0s, 5s, 30s)
 * - Auto-detection of model capabilities via OpenRouter metadata
 *
 * Usage:
 *   bun run .claude/skills/retro/scripts/analyze-findings.ts
 *   bun run .claude/skills/retro/scripts/analyze-findings.ts --limit 10
 *   bun run .claude/skills/retro/scripts/analyze-findings.ts --reanalyze <session-id>
 *   bun run .claude/skills/retro/scripts/analyze-findings.ts --reanalyze all
 */

import type { Database } from 'bun:sqlite'
import { readFileSync, readSync } from 'node:fs'
import { join } from 'node:path'
import type { RetroConfig } from '../lib/config'
import { computeChunkSize, fetchModelMetadata, loadConfig, resolveApiKey } from '../lib/config'
import { getDatabase } from '../lib/db'
import { embed, initEmbedder } from '../lib/embedder'
import { getSessionsDir } from '../lib/parser'
import { redact, redactFinding } from '../lib/redactor'
import { invokeWithRetry } from './analyze-providers'
import type { AnalysisContext, Finding } from './analyze-transcript'
import {
  buildAnalysisPrompt,
  buildDedupPrompt,
  chunkMessages,
  extractMessages,
} from './analyze-transcript'

export type { AnalysisContext, Finding }

// ---------------------------------------------------------------------------
// Session analysis
// ---------------------------------------------------------------------------

function logProcessing(
  db: Database,
  sessionId: string,
  status: string,
  errorMessage: string | null
): void {
  db.prepare(
    'INSERT OR REPLACE INTO processing_log (session_id, phase, status, error_message) VALUES (?, ?, ?, ?)'
  ).run(sessionId, 'analyze', status, errorMessage)
}

function readSessionFile(sessionId: string): string | null {
  const filePath = join(getSessionsDir(), `${sessionId}.jsonl`)
  try {
    const content = readFileSync(filePath, 'utf-8')
    return content.trim() ? content : null
  } catch {
    return null
  }
}

async function analyzeChunks(chunks: string[], ctx: AnalysisContext): Promise<Finding[]> {
  const findings: Finding[] = []
  const total = chunks.length

  for (let ci = 0; ci < chunks.length; ci++) {
    const partInfo =
      total > 1 ? `This is part ${ci + 1} of ${total} of a session transcript.` : undefined
    const prompt = buildAnalysisPrompt(chunks[ci], partInfo)

    try {
      const chunkFindings = await invokeWithRetry(prompt, ctx.config, ctx)
      findings.push(...chunkFindings)
      if (total > 1) console.log(`  Chunk ${ci + 1}/${total}: ${chunkFindings.length} findings`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  Chunk ${ci + 1}/${total} failed after 3 attempts: ${msg}`)
    }
  }

  return findings
}

async function deduplicateFindings(
  findings: Finding[],
  totalChunks: number,
  ctx: AnalysisContext
): Promise<Finding[]> {
  if (totalChunks <= 1 || findings.length === 0) return findings

  console.log(`  Deduplicating ${findings.length} findings from ${totalChunks} chunks...`)
  try {
    const deduplicated = await invokeWithRetry(buildDedupPrompt(findings), ctx.config, ctx)
    console.log(`  Dedup: ${findings.length} → ${deduplicated.length} findings`)
    return deduplicated
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`  Dedup failed, keeping all findings: ${msg}`)
    return findings
  }
}

async function storeFindings(
  db: Database,
  sessionId: string,
  findings: Finding[],
  counts: Record<string, number>
): Promise<void> {
  const session = db.prepare('SELECT created_at FROM sessions WHERE id = ?').get(sessionId) as
    | { created_at: string | null }
    | undefined
  const sessionTimestamp = session?.created_at ?? null

  const insertFinding = db.prepare(
    'INSERT INTO findings (session_id, type, content, context, severity, tags, session_timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const insertEmbedding = db.prepare(
    'INSERT INTO finding_embeddings (finding_id, embedding) VALUES (?, ?)'
  )

  for (const finding of findings) {
    const redacted = redactFinding(finding)
    const result = insertFinding.run(
      sessionId,
      finding.type,
      redacted.content,
      redacted.context ?? null,
      finding.severity,
      JSON.stringify(finding.tags),
      sessionTimestamp
    )
    const findingId = Number(result.lastInsertRowid)

    try {
      const embeddingVec = await embed(redacted.content)
      insertEmbedding.run(findingId, new Uint8Array(embeddingVec.buffer))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  Embedding failed for finding ${findingId}: ${msg}`)
    }

    counts[finding.type] = (counts[finding.type] || 0) + 1
  }
}

async function analyzeSession(
  db: Database,
  sessionId: string,
  index: number,
  total: number,
  counts: Record<string, number>,
  ctx: AnalysisContext
): Promise<void> {
  console.log(`Analyzing session ${index + 1}/${total}...`)

  const fileContent = readSessionFile(sessionId)
  if (!fileContent) {
    logProcessing(db, sessionId, 'error', 'Session file not found or empty')
    return
  }

  const messages = extractMessages(fileContent)
  const redactedMessages = messages.map((m) => ({ ...m, content: redact(m.content) }))
  const chunks = chunkMessages(redactedMessages, ctx.chunkSize)

  if (chunks.length > 1) console.log(`  Large session: splitting into ${chunks.length} chunks`)

  const rawFindings = await analyzeChunks(chunks, ctx)
  const allFindings = await deduplicateFindings(rawFindings, chunks.length, ctx)

  if (allFindings.length === 0) {
    logProcessing(db, sessionId, 'error', 'No findings extracted after all attempts')
    return
  }

  await storeFindings(db, sessionId, allFindings, counts)
  db.prepare('UPDATE sessions SET analyzed_at = datetime("now") WHERE id = ?').run(sessionId)
  logProcessing(db, sessionId, 'success', null)
  console.log(
    `  Found ${allFindings.length} findings${chunks.length > 1 ? ` (from ${chunks.length} chunks)` : ''}`
  )
}

// ---------------------------------------------------------------------------
// Reanalyze helpers
// ---------------------------------------------------------------------------

function deleteFindingEmbeddings(db: Database, findingIds: { id: number }[]): void {
  if (findingIds.length === 0) return
  const deleteEmbedding = db.prepare('DELETE FROM finding_embeddings WHERE finding_id = ?')
  for (const r of findingIds) {
    deleteEmbedding.run(r.id)
  }
}

function isPaidProvider(config: RetroConfig): boolean {
  if (config.provider === 'claude-cli') return true
  if (config.provider === 'openrouter' && !config.model.endsWith(':free')) return true
  return false
}

function confirmStdin(prompt: string): boolean {
  process.stdout.write(prompt)
  const buf = Buffer.alloc(10)
  const bytesRead = readSync(0, buf, 0, 10)
  const answer = buf.toString('utf-8', 0, bytesRead).trim().toLowerCase()
  return answer === 'y' || answer === 'yes'
}

function confirmReanalyzeAll(db: Database): boolean {
  const sessionCount = (
    db.prepare('SELECT COUNT(*) as count FROM sessions').get() as { count: number }
  ).count
  const findingCount = (
    db.prepare('SELECT COUNT(*) as count FROM findings').get() as { count: number }
  ).count
  console.log(`This will delete ${findingCount} findings and re-analyze ${sessionCount} sessions.`)
  return confirmStdin('Continue? (y/N) ')
}

async function handleReanalyze(db: Database, target: string): Promise<void> {
  if (target === 'all') {
    console.log('WARNING: This will re-analyze ALL sessions. This may take a long time.')

    if (!confirmReanalyzeAll(db)) {
      console.log('Aborted.')
      return
    }

    console.log('Clearing all findings and embeddings...')

    const findingIds = db.prepare('SELECT id FROM findings').all() as { id: number }[]
    deleteFindingEmbeddings(db, findingIds)

    db.run('DELETE FROM findings')
    db.run('UPDATE sessions SET analyzed_at = NULL')
    db.run("DELETE FROM processing_log WHERE phase = 'analyze'")

    console.log('Cleared. Re-analyzing all sessions...')
  } else {
    const session = db.prepare('SELECT id FROM sessions WHERE id = ?').get(target) as
      | { id: string }
      | undefined

    if (!session) {
      throw new Error(`Session not found: ${target}`)
    }

    console.log(`Clearing findings for session ${target}...`)

    const findingIds = db.prepare('SELECT id FROM findings WHERE session_id = ?').all(target) as {
      id: number
    }[]
    deleteFindingEmbeddings(db, findingIds)

    db.prepare('DELETE FROM findings WHERE session_id = ?').run(target)
    db.prepare('UPDATE sessions SET analyzed_at = NULL WHERE id = ?').run(target)
    db.prepare("DELETE FROM processing_log WHERE session_id = ? AND phase = 'analyze'").run(target)

    console.log('Cleared. Re-analyzing...')
  }
}

// ---------------------------------------------------------------------------
// Concurrency
// ---------------------------------------------------------------------------

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>
): Promise<void> {
  let nextIndex = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const i = nextIndex++
      await fn(items[i], i)
    }
  })
  await Promise.all(workers)
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(): { limit: number | undefined; reanalyzeTarget: string | undefined } {
  const args = process.argv.slice(2)

  const limitIdx = args.indexOf('--limit')
  const limit = limitIdx !== -1 ? Number.parseInt(args[limitIdx + 1], 10) : undefined

  const reanalyzeIdx = args.indexOf('--reanalyze')
  const reanalyzeTarget = reanalyzeIdx !== -1 ? args[reanalyzeIdx + 1] : undefined

  if (limit !== undefined && (Number.isNaN(limit) || limit <= 0)) {
    console.error('--limit must be a positive integer')
    process.exit(1)
  }

  if (reanalyzeTarget && reanalyzeTarget !== 'all' && !/^[a-zA-Z0-9_-]+$/.test(reanalyzeTarget)) {
    console.error(
      'Invalid session ID format. Session IDs must be alphanumeric (with hyphens and underscores).'
    )
    process.exit(1)
  }

  return { limit, reanalyzeTarget }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function printSummary(total: number, counts: Record<string, number>): void {
  const totalFindings = Object.values(counts).reduce((a, b) => a + b, 0)
  console.log('\n--- Analysis Summary ---')
  console.log(`Sessions analyzed: ${total}`)
  console.log(`Total findings: ${totalFindings}`)
  console.log(`  Praise:     ${counts.praise}`)
  console.log(`  Blockers:   ${counts.blocker}`)
  console.log(`  Suggestions: ${counts.suggestion}`)
  console.log(`  Nitpicks:   ${counts.nitpick}`)
}

async function resolveAnalysisContext(config: RetroConfig): Promise<AnalysisContext> {
  if (config.provider !== 'openrouter') {
    const chunkSize = computeChunkSize(null, config.qualityCapChars)
    return { config, modelMeta: null, chunkSize, useJsonSchema: true }
  }

  console.log('Fetching model metadata from OpenRouter...')
  const apiKey = resolveApiKey(config)
  const modelMeta = await fetchModelMetadata(config.model, apiKey)

  if (modelMeta) {
    const useJsonSchema = modelMeta.supportsStructuredOutputs || modelMeta.supportsResponseFormat
    console.log(
      `  Context: ${modelMeta.contextLength.toLocaleString()} tokens | JSON schema: ${useJsonSchema ? 'yes' : 'no'}`
    )
    const chunkSize = computeChunkSize(modelMeta, config.qualityCapChars)
    return { config, modelMeta, chunkSize, useJsonSchema }
  }

  console.log('  Could not fetch model metadata, using defaults')
  const chunkSize = computeChunkSize(null, config.qualityCapChars)
  return { config, modelMeta: null, chunkSize, useJsonSchema: false }
}

function confirmPaidProvider(config: RetroConfig): boolean {
  if (!isPaidProvider(config)) return true
  const providerLabel =
    config.provider === 'claude-cli'
      ? 'Claude Code CLI (paid)'
      : `OpenRouter: ${config.model} (paid)`
  console.log(`\nWARNING: This will make AI calls via ${providerLabel}.`)
  if (!confirmStdin('Continue? (y/N) ')) {
    console.log('Aborted.')
    return false
  }
  console.log()
  return true
}

async function main(): Promise<void> {
  const { limit, reanalyzeTarget } = parseArgs()

  const config = loadConfig()
  console.log(
    `Provider: ${config.provider}${config.provider === 'openrouter' ? ` (${config.model})` : ''}`
  )

  const ctx = await resolveAnalysisContext(config)
  console.log(`Chunk size: ${(ctx.chunkSize / 1000).toFixed(0)}K chars`)
  console.log('Phase 2: Analyzing sessions with AI...')

  const db = getDatabase()
  try {
    await initEmbedder()

    if (reanalyzeTarget) await handleReanalyze(db, reanalyzeTarget)

    let sessions = db.prepare('SELECT id FROM sessions WHERE analyzed_at IS NULL').all() as {
      id: string
    }[]
    if (limit && limit > 0) sessions = sessions.slice(0, limit)

    if (sessions.length === 0) {
      console.log('No unanalyzed sessions found.')
      return
    }

    console.log(
      `Found ${sessions.length} session(s) to analyze (concurrency: ${config.concurrency}).`
    )

    if (!confirmPaidProvider(config)) return

    const counts: Record<string, number> = { praise: 0, blocker: 0, suggestion: 0, nitpick: 0 }

    await runWithConcurrency(sessions, config.concurrency, async (session, i) => {
      try {
        await analyzeSession(db, session.id, i, sessions.length, counts, ctx)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`  Unexpected error analyzing session ${session.id}: ${msg}`)
        logProcessing(db, session.id, 'error', `Unexpected: ${msg}`)
      }
    })

    printSummary(sessions.length, counts)
  } finally {
    db.close()
  }
}

main().catch((err) => {
  console.error('Analysis failed:', err.message)
  process.exit(1)
})
