import type { ModelMetadata, RetroConfig } from '../lib/config'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Finding {
  type: 'praise' | 'blocker' | 'suggestion' | 'nitpick'
  content: string
  context?: string | null
  severity: 'low' | 'medium' | 'high'
  tags: string[]
}

export interface StructuredMessage {
  role: 'user' | 'assistant' | 'unknown'
  content: string
}

export interface AnalysisContext {
  config: RetroConfig
  modelMeta: ModelMetadata | null
  chunkSize: number
  useJsonSchema: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const VALID_TYPES = new Set(['praise', 'blocker', 'suggestion', 'nitpick'])
export const VALID_SEVERITIES = new Set(['low', 'medium', 'high'])

export const FINDINGS_SCHEMA = {
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

export function isValidFinding(f: unknown): f is Finding {
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

export function buildAnalysisPrompt(transcript: string, partInfo?: string): string {
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

export function buildDedupPrompt(findings: Finding[]): string {
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

export function extractMessages(content: string): StructuredMessage[] {
  return content
    .split('\n')
    .filter((l) => l.trim())
    .map(parseJsonlLine)
    .filter((m): m is StructuredMessage => m !== null)
}

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

export function chunkMessages(messages: StructuredMessage[], maxChars: number): string[] {
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

export function parseFindings(content: string): Finding[] {
  const cleaned = stripCodeFences(content)
  const parsed = extractJson(cleaned)
  return unwrapFindingsArray(parsed).filter(isValidFinding)
}
