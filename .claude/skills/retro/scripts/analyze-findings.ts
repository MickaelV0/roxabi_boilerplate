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

import type { Database } from 'bun:sqlite'
import { execFileSync } from 'node:child_process'
import { readFileSync, readSync } from 'node:fs'
import { join } from 'node:path'
import type { RetroConfig } from '../lib/config'
import { loadConfig, resolveApiKey } from '../lib/config'
import { getDatabase } from '../lib/db'
import { embed, initEmbedder } from '../lib/embedder'
import { getSessionsDir } from '../lib/parser'
import { redactFinding } from '../lib/redactor'

interface Finding {
  type: 'praise' | 'blocker' | 'suggestion' | 'nitpick'
  content: string
  context?: string | null
  severity: 'low' | 'medium' | 'high'
  tags: string[]
}

const VALID_TYPES = new Set(['praise', 'blocker', 'suggestion', 'nitpick'])
const VALID_SEVERITIES = new Set(['low', 'medium', 'high'])

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

function buildPrompt(transcript: string): string {
  return `Analyze this Claude Code session transcript and extract findings. Return ONLY a JSON array of findings, where each finding has:
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

Session transcript:
${transcript}`
}

function extractTranscript(content: string): string {
  const lines = content.split('\n').filter((l) => l.trim())

  const messages: string[] = []
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line)
      if (parsed.message?.content) {
        messages.push(
          typeof parsed.message.content === 'string'
            ? parsed.message.content
            : JSON.stringify(parsed.message.content)
        )
      } else if (parsed.content) {
        messages.push(
          typeof parsed.content === 'string' ? parsed.content : JSON.stringify(parsed.content)
        )
      }
    } catch {
      // Skip malformed lines
    }
  }

  // Truncate very large sessions: first 50 + last 50 messages
  if (messages.length > 500) {
    const first50 = messages.slice(0, 50)
    const last50 = messages.slice(-50)
    return [...first50, '\n[... truncated ...]\n', ...last50].join('\n')
  }

  return messages.join('\n')
}

function invokeClaudeCli(prompt: string): Finding[] {
  const result = execFileSync('claude', ['-p', '--output-format', 'json'], {
    input: prompt,
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024, // 50MB
    timeout: 120_000, // 2 min per session
  })

  // Double JSON parse: CLI returns {"result": "...", ...} where result is a JSON string
  const outer = JSON.parse(result)
  const inner = typeof outer.result === 'string' ? JSON.parse(outer.result) : outer.result

  const findings: Finding[] = []
  const arr = Array.isArray(inner) ? inner : []
  for (const item of arr) {
    if (isValidFinding(item)) {
      findings.push(item)
    }
  }
  return findings
}

async function invokeOpenRouter(prompt: string, config: RetroConfig): Promise<Finding[]> {
  const apiKey = resolveApiKey(config)

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(120_000),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[]
  }

  let content = data.choices[0].message.content

  // Strip markdown code fences if present
  const fenceMatch = content.match(/^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/m)
  if (fenceMatch) {
    content = fenceMatch[1]
  }

  const parsed: unknown = JSON.parse(content)
  const arr = Array.isArray(parsed) ? parsed : []

  const findings: Finding[] = []
  for (const item of arr) {
    if (isValidFinding(item)) {
      findings.push(item)
    }
  }
  return findings
}

async function invokeProvider(prompt: string, config: RetroConfig): Promise<Finding[]> {
  if (config.provider === 'openrouter') {
    return invokeOpenRouter(prompt, config)
  }
  return invokeClaudeCli(prompt)
}

async function analyzeSession(
  db: Database,
  sessionId: string,
  index: number,
  total: number,
  counts: Record<string, number>,
  config: RetroConfig
): Promise<void> {
  console.log(`Analyzing session ${index + 1}/${total}...`)

  const filePath = join(getSessionsDir(), `${sessionId}.jsonl`)

  let fileContent: string
  try {
    fileContent = readFileSync(filePath, 'utf-8')
  } catch {
    console.error(`  Session file not found: ${filePath}`)
    logProcessing(db, sessionId, 'error', `Session file not found: ${filePath}`)
    return
  }

  if (!fileContent.trim()) {
    console.error(`  Session file is empty: ${filePath}`)
    logProcessing(db, sessionId, 'error', 'Session file is empty')
    return
  }

  const transcript = extractTranscript(fileContent)
  const prompt = buildPrompt(transcript)

  let findings: Finding[]
  try {
    findings = await invokeProvider(prompt, config)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`  CLI invocation failed for session ${sessionId}: ${msg}`)
    logProcessing(db, sessionId, 'error', `CLI failed: ${msg}`)
    return
  }

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
    const tagsJson = JSON.stringify(finding.tags)

    const result = insertFinding.run(
      sessionId,
      finding.type,
      redacted.content,
      redacted.context ?? null,
      finding.severity,
      tagsJson,
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

  db.prepare('UPDATE sessions SET analyzed_at = datetime("now") WHERE id = ?').run(sessionId)

  logProcessing(db, sessionId, 'success', null)

  console.log(`  Found ${findings.length} findings`)
}

function deleteFindingEmbeddings(db: Database, findingIds: { id: number }[]): void {
  if (findingIds.length === 0) return
  const deleteEmbedding = db.prepare('DELETE FROM finding_embeddings WHERE finding_id = ?')
  for (const r of findingIds) {
    deleteEmbedding.run(r.id)
  }
}

function confirmReanalyzeAll(db: Database): boolean {
  const sessionCount = (
    db.prepare('SELECT COUNT(*) as count FROM sessions').get() as { count: number }
  ).count
  const findingCount = (
    db.prepare('SELECT COUNT(*) as count FROM findings').get() as { count: number }
  ).count
  console.log(`This will delete ${findingCount} findings and re-analyze ${sessionCount} sessions.`)
  process.stdout.write('Continue? (y/N) ')
  const buf = Buffer.alloc(10)
  const bytesRead = readSync(0, buf, 0, 10)
  const answer = buf.toString('utf-8', 0, bytesRead).trim().toLowerCase()
  return answer === 'y' || answer === 'yes'
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

async function main(): Promise<void> {
  const { limit, reanalyzeTarget } = parseArgs()

  const config = loadConfig()
  console.log(
    `Provider: ${config.provider}${config.provider === 'openrouter' ? ` (${config.model})` : ''}`
  )

  console.log('Phase 2: Analyzing sessions with AI...')

  const db = getDatabase()
  try {
    await initEmbedder()

    if (reanalyzeTarget) {
      await handleReanalyze(db, reanalyzeTarget)
    }

    let sessions = db.prepare('SELECT id FROM sessions WHERE analyzed_at IS NULL').all() as {
      id: string
    }[]

    if (limit && limit > 0) {
      sessions = sessions.slice(0, limit)
    }

    if (sessions.length === 0) {
      console.log('No unanalyzed sessions found.')
      return
    }

    console.log(`Found ${sessions.length} session(s) to analyze.`)

    const counts: Record<string, number> = { praise: 0, blocker: 0, suggestion: 0, nitpick: 0 }

    for (let i = 0; i < sessions.length; i++) {
      try {
        await analyzeSession(db, sessions[i].id, i, sessions.length, counts, config)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`  Unexpected error analyzing session ${sessions[i].id}: ${msg}`)
        logProcessing(db, sessions[i].id, 'error', `Unexpected: ${msg}`)
      }
    }

    printSummary(sessions.length, counts)
  } finally {
    db.close()
  }
}

main().catch((err) => {
  console.error('Analysis failed:', err.message)
  process.exit(1)
})
