/**
 * Post review findings as inline PR diff comments.
 * Reads /tmp/review-findings.json and /tmp/pr-context.json.
 * Deletes prior bot inline comments before posting (clean slate).
 *
 * Usage: GH_TOKEN=... bun run tools/post-inline-comments.ts <pr-number> <head-sha>
 * Exit 0 on success, 1 on error.
 */
import { readFileSync } from 'node:fs'

export interface DiffPosition {
  path: string
  line: number
  side: 'RIGHT' | 'LEFT'
}

interface Finding {
  file: string
  line: number
  body: string
  category: string
  confidence: number
}

/**
 * Parse unified diff hunk headers to build a map of "file:line" → DiffPosition.
 * Only lines present in the diff (added/context lines on RIGHT side) are included.
 */
export function buildPositionMap(diff: string): Map<string, DiffPosition> {
  const map = new Map<string, DiffPosition>()
  let currentFile = ''
  let newLine = 0

  for (const raw of diff.split('\n')) {
    const fileMatch = raw.match(/^\+\+\+ b\/(.+)$/)
    if (fileMatch) {
      currentFile = fileMatch[1]
      continue
    }
    const hunkMatch = raw.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
    if (hunkMatch) {
      newLine = parseInt(hunkMatch[1], 10) - 1
      continue
    }
    if (!currentFile) continue
    if (raw.startsWith('\\')) continue // "\ No newline at end of file"
    if (raw.startsWith('-')) continue // removed line — not a valid comment target
    if (raw.startsWith('+') || raw.startsWith(' ')) {
      newLine++
      map.set(`${currentFile}:${newLine}`, { path: currentFile, line: newLine, side: 'RIGHT' })
    }
  }

  return map
}

async function deletePriorBotComments(prNumber: number, repo: string): Promise<void> {
  try {
    const comments =
      (await Bun.$`gh api repos/${repo}/pulls/${prNumber}/comments`.json()) as Record<
        string,
        unknown
      >[]
    const botComments = comments.filter((c) =>
      String(c.body ?? '').includes('<!-- reviewed-by-bot-comment -->')
    )
    await Promise.allSettled(
      botComments.map((c) => Bun.$`gh api repos/${repo}/pulls/comments/${c.id} -X DELETE`.quiet())
    )
  } catch {
    // non-fatal — proceed with posting
  }
}

const prNumber = parseInt(process.argv[2] ?? '', 10)
const headSha = process.argv[3] ?? ''

if (!(prNumber && headSha)) {
  console.error('Usage: post-inline-comments.ts <pr-number> <head-sha>')
  process.exit(1)
}

const repo =
  process.env.GITHUB_REPOSITORY ??
  (await Bun.$`gh repo view --json nameWithOwner --jq '.nameWithOwner'`.text()).trim()

let findings: Finding[] = []
let diff = ''

try {
  findings = JSON.parse(readFileSync('/tmp/review-findings.json', 'utf-8')) as Finding[]
} catch {
  console.log('No findings file — nothing to post')
  process.exit(0)
}

try {
  const ctx = JSON.parse(readFileSync('/tmp/pr-context.json', 'utf-8'))
  diff = ctx.diff as string
} catch {
  console.error('No pr-context.json — cannot map diff positions')
  process.exit(1)
}

await deletePriorBotComments(prNumber, repo)

const posMap = buildPositionMap(diff)
const fallback: string[] = []
let posted = 0

for (const f of findings) {
  const key = `${f.file}:${f.line}`
  const pos = posMap.get(key)
  if (!pos) {
    fallback.push(`**${f.file}:${f.line}** — ${f.body}`)
    continue
  }
  try {
    await Bun.$`gh api repos/${repo}/pulls/${prNumber}/comments \
      -f commit_id=${headSha} \
      -f path=${pos.path} \
      -F line=${pos.line} \
      -f side=${pos.side} \
      -f body=${`<!-- reviewed-by-bot-comment -->\n${f.body}`}`.quiet()
    posted++
  } catch {
    fallback.push(`**${f.file}:${f.line}** — ${f.body}`)
  }
}

if (fallback.length > 0) {
  const extra = fallback.map((s) => `- ${s}`).join('\n')
  await Bun.$`gh pr comment ${prNumber} --body ${`<!-- reviewed-by-bot-extra -->\n**Additional findings (out of diff):**\n${extra}`}`.quiet()
}

console.log(`Posted ${posted} inline comments, ${fallback.length} fallback`)
