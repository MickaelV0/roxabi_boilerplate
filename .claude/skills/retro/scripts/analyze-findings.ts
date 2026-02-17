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
import type { ModelMetadata, RetroConfig } from '../lib/config'
import { computeChunkSize, fetchModelMetadata, loadConfig, resolveApiKey } from '../lib/config'
import { getDatabase } from '../lib/db'
import { embed, initEmbedder } from '../lib/embedder'
import { getSessionsDir } from '../lib/parser'
import { redact, redactFinding } from '../lib/redactor'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Finding {
  type: 'praise' | 'blocker' | 'suggestion' | 'nitpick'
  content: string
  context?: string | null
  severity: 'low' | 'medium' | 'high'
  tags: string[]
}

interface StructuredMessage {
  role: 'user' | 'assistant' | 'unknown'
  content: string
}

/** Runtime context resolved once at startup. */
interface AnalysisContext {
  config: RetroConfig
  modelMeta: ModelMetadata | null
  chunkSize: number
  useJsonSchema: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_TYPES = new Set(['praise', 'blocker', 'suggestion', 'nitpick'])
const VALID_SEVERITIES = new Set(['low', 'medium', 'high'])
const RETRY_DELAYS = [0, 5_000, 30_000]

/** JSON Schema shared by both OpenRouter and Claude CLI. */
const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['praise', 'blocker', 'suggestion', 'nitpick'] },
          content: { type: 'string' },
          context: { type: 'string' },
          severity: { type: 'string', enum: ['low', 'medium', 'high'] },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['type', 'content', 'severity', 'tags'],
      },
    },
  },
  required: ['findings'],
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function isValidFinding(f: unknown): f is Finding {
  if (typeof f !== 'object' || f === null) return false
  const obj = f as Record<string, unknown>
  return (
    typeof obj.type === 'string' &&
    VALID_TYPES.has(obj.type) &&
    typeof obj.content === 'string' &&
    typeof obj.severity === 'string' &&
    VALID_SEVERITIES.has(obj.severity) &&
    Array.isArray(obj.tags)
  )
}

// ---------------------------------------------------------------------------
// Prompt building
// ---------------------------------------------------------------------------

function buildAnalysisPrompt(transcript: string, partInfo?: string): string {
  const partLine = partInfo ? `\nNote: ${partInfo}\n` : ''
  return `Analyze this Claude Code session transcript and extract findings.
Return a JSON object with a "findings" array. Each finding has:
- type: "praise" | "blocker" | "suggestion" | "nitpick"
- content: brief description of the finding (1-2 sentences)
- context: relevant context from the session (1-2 sentences)
- severity: "low" | "medium" | "high"
- tags: array of 1-3 short tags (e.g. ["auth", "hooks", "performance"])

Finding types:
- praise: Pattern or approach that worked well
- blocker: Problem that blocked progress or caused significant friction
- suggestion: Improvement proposed by Claude or the developer
- nitpick: Minor style, naming, or convention issue
${partLine}
Session transcript:
${transcript}`
}

function buildDedupPrompt(findings: Finding[]): string {
  return `You are given findings extracted from different parts of the same Claude Code session.
Some findings may be duplicates or near-duplicates describing the same issue from different angles.

Merge duplicates, remove redundant entries, and return the deduplicated list.
Return a JSON object with a "findings" array using the same schema.

Findings to deduplicate:
${JSON.stringify(findings, null, 2)}`
}

// ---------------------------------------------------------------------------
// Transcript extraction & chunking
// ---------------------------------------------------------------------------

function resolveRole(parsed: Record<string, unknown>): StructuredMessage['role'] {
  if (parsed.role === 'user') return 'user'
  if (parsed.role === 'assistant') return 'assistant'
  return 'unknown'
}

function resolveContent(parsed: Record<string, unknown>): string | null {
  const mc = (parsed.message as Record<string, unknown> | undefined)?.content
  if (mc) return typeof mc === 'string' ? mc : JSON.stringify(mc)
  const c = parsed.content
  if (c) return typeof c === 'string' ? c : JSON.stringify(c)
  return null
}

function parseJsonlLine(line: string): StructuredMessage | null {
  try {
    const parsed = JSON.parse(line)
    const text = resolveContent(parsed)
    return text ? { role: resolveRole(parsed), content: text } : null
  } catch {
    return null
  }
}

function extractMessages(content: string): StructuredMessage[] {
  return content
    .split('\n')
    .filter((l) => l.trim())
    .map(parseJsonlLine)
    .filter((m): m is StructuredMessage => m !== null)
}

/**
 * Find the best assistant-boundary cut index within a chunk.
 * Returns the chunk length (no split) if no boundary is found.
 */
function findAssistantBoundary(
  messages: StructuredMessage[],
  currentIdx: number,
  chunkLen: number
): number {
  for (let j = currentIdx - 1; j >= currentIdx - chunkLen && j >= 0; j--) {
    if (messages[j].role === 'assistant') {
      return j - (currentIdx - chunkLen) + 1
    }
  }
  return chunkLen
}

function splitAtBoundary(
  chunks: string[],
  currentChunk: string[],
  cutIdx: number,
  msgContent: string,
  msgLen: number
): { currentChunk: string[]; currentLen: number } {
  if (cutIdx > 0 && cutIdx < currentChunk.length) {
    chunks.push(currentChunk.slice(0, cutIdx).join('\n'))
    const remainder = currentChunk.slice(cutIdx)
    return {
      currentChunk: [...remainder, msgContent],
      currentLen: remainder.reduce((sum, c) => sum + c.length + 1, 0) + msgLen,
    }
  }
  chunks.push(currentChunk.join('\n'))
  return { currentChunk: [msgContent], currentLen: msgLen }
}

/**
 * Split messages into chunks that fit within maxChars.
 * Cuts at assistant message boundaries for clean conversation segments.
 */
function chunkMessages(messages: StructuredMessage[], maxChars: number): string[] {
  if (messages.length === 0) return []

  const fullText = messages.map((m) => m.content).join('\n')
  if (fullText.length <= maxChars) return [fullText]

  const chunks: string[] = []
  let currentChunk: string[] = []
  let currentLen = 0

  for (let i = 0; i < messages.length; i++) {
    const msgLen = messages[i].content.length + 1

    if (currentLen + msgLen > maxChars && currentChunk.length > 0) {
      const cutIdx = findAssistantBoundary(messages, i, currentChunk.length)
      const result = splitAtBoundary(chunks, currentChunk, cutIdx, messages[i].content, msgLen)
      currentChunk = result.currentChunk
      currentLen = result.currentLen
    } else {
      currentChunk.push(messages[i].content)
      currentLen += msgLen
    }
  }

  if (currentChunk.length > 0) chunks.push(currentChunk.join('\n'))
  return chunks
}

// ---------------------------------------------------------------------------
// Response parsing
// ---------------------------------------------------------------------------

function stripCodeFences(text: string): string {
  const m = text.match(/^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/m)
  return m ? m[1] : text
}

function extractJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    const arrayMatch = text.match(/\[[\s\S]*\]/)
    if (arrayMatch) return JSON.parse(arrayMatch[0])

    const objMatch = text.match(/\{[\s\S]*\}/)
    if (objMatch) return JSON.parse(objMatch[0])

    throw new Error(`No JSON found in response: ${text.slice(0, 100)}...`)
  }
}

function unwrapFindingsArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>
    if (Array.isArray(obj.findings)) return obj.findings
    const arrKey = Object.keys(obj).find((k) => Array.isArray(obj[k]))
    if (arrKey) return obj[arrKey] as unknown[]
  }
  return []
}

/**
 * Parse the AI response into validated findings.
 * Handles: raw JSON array, { findings: [...] } wrapper, prose with embedded JSON.
 */
function parseFindings(content: string): Finding[] {
  const cleaned = stripCodeFences(content)
  const parsed = extractJson(cleaned)
  return unwrapFindingsArray(parsed).filter(isValidFinding)
}

// ---------------------------------------------------------------------------
// Provider invocations
// ---------------------------------------------------------------------------

async function invokeClaudeCli(prompt: string): Promise<Finding[]> {
  const schemaArg = JSON.stringify(FINDINGS_SCHEMA)
  const proc = Bun.spawn(['claude', '-p', '--output-format', 'json', '--json-schema', schemaArg], {
    stdin: Buffer.from(prompt),
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const timeoutId = setTimeout(() => proc.kill(), 120_000)

  try {
    const stdout = await new Response(proc.stdout).text()
    const exitCode = await proc.exited
    clearTimeout(timeoutId)

    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text()
      throw new Error(`Claude CLI exited with code ${exitCode}: ${stderr}`)
    }

    // CLI returns {"result": "...", ...} where result is a JSON string
    const outer = JSON.parse(stdout)
    const inner = typeof outer.result === 'string' ? outer.result : JSON.stringify(outer.result)
    return parseFindings(inner)
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

async function invokeOpenRouter(
  prompt: string,
  config: RetroConfig,
  ctx: AnalysisContext
): Promise<Finding[]> {
  const apiKey = resolveApiKey(config)

  const body: Record<string, unknown> = {
    model: config.model,
    messages: [{ role: 'user', content: prompt }],
  }

  // Use strict json_schema if supported, otherwise json_object, otherwise nothing
  if (ctx.useJsonSchema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: { name: 'findings_response', strict: true, schema: FINDINGS_SCHEMA },
    }
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[]
  }

  return parseFindings(data.choices[0].message.content)
}

async function invokeProvider(
  prompt: string,
  config: RetroConfig,
  ctx: AnalysisContext
): Promise<Finding[]> {
  if (config.provider === 'openrouter') {
    return invokeOpenRouter(prompt, config, ctx)
  }
  return invokeClaudeCli(prompt)
}

// ---------------------------------------------------------------------------
// Retry logic
// ---------------------------------------------------------------------------

async function invokeWithRetry(
  prompt: string,
  config: RetroConfig,
  ctx: AnalysisContext
): Promise<Finding[]> {
  let lastError = new Error('All retry attempts failed')

  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
    const delay = RETRY_DELAYS[attempt]
    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay))
    }

    try {
      return await invokeProvider(prompt, config, ctx)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < RETRY_DELAYS.length - 1) {
        const nextDelay = RETRY_DELAYS[attempt + 1] / 1000
        console.error(
          `  Attempt ${attempt + 1} failed: ${lastError.message.slice(0, 80)}. Retrying in ${nextDelay}s...`
        )
      }
    }
  }

  throw lastError
}

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
