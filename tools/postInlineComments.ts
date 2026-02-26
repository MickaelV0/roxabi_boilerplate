/**
 * Post review findings as inline PR diff comments.
 * Reads /tmp/review-findings.json and /tmp/pr-context.json.
 * Deletes prior bot inline comments before posting (clean slate).
 *
 * Usage: GH_TOKEN=... bun run tools/post-inline-comments.ts <pr-number> <head-sha>
 * Exit 0 on success, 1 on error.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { buildPositionMap, type DiffPosition } from './diffUtils'

export type { DiffPosition }

interface Finding {
  file: string
  line: number
  body: string
  category: string
  confidence: number
  nodeId?: string // GitHub global node_id of posted inline comment (for minimizeComment)
}

export { buildPositionMap }

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

if (!Array.isArray(findings)) {
  console.error('review-findings.json is not an array — skipping inline comments')
  process.exit(0)
}
findings = findings.filter((f) => {
  if (typeof f.file !== 'string' || !Number.isFinite(f.line) || typeof f.body !== 'string') {
    console.warn(`Skipping malformed finding: ${JSON.stringify(f)}`)
    return false
  }
  return true
})
if (findings.length === 0) {
  console.log('No valid findings after validation — nothing to post')
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
    const result = (await Bun.$`gh api repos/${repo}/pulls/${prNumber}/comments \
      -f commit_id=${headSha} \
      -f path=${pos.path} \
      -F line=${pos.line} \
      -f side=${pos.side} \
      -f body=${`<!-- reviewed-by-bot-comment -->\n${f.body}`}`.json()) as Record<string, unknown>
    f.nodeId = typeof result.node_id === 'string' ? result.node_id : undefined
    posted++
  } catch {
    fallback.push(`**${f.file}:${f.line}** — ${f.body}`)
  }
}

// Write enriched findings (with nodeId) back for artifact upload + resolveThreads
writeFileSync('/tmp/review-findings.json', JSON.stringify(findings, null, 2))

if (fallback.length > 0) {
  const extra = fallback.map((s) => `- ${s}`).join('\n')
  await Bun.$`gh pr comment ${prNumber} --body ${`<!-- reviewed-by-bot-extra -->\n**Additional findings (out of diff):**\n${extra}`}`.quiet()
}

console.log(`Posted ${posted} inline comments, ${fallback.length} fallback`)
