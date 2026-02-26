/**
 * Resolve PR review threads for verified-fixed findings.
 * Reads /tmp/pr-context.json and /tmp/prior-findings/review-findings.json.
 *
 * Usage: GH_TOKEN=... bun run tools/resolve-threads.ts <pr-number>
 * Exit 0 on success, 1 on error.
 */
import { existsSync, readFileSync } from 'node:fs'
import { buildPositionMap } from './postInlineComments'

interface Finding {
  file: string
  line: number
  body: string
  databaseId?: number
}

/**
 * A finding is verified-fixed when its file:line no longer appears as a changed line in the current diff.
 */
export function isVerifiedFixed(finding: Finding, currentDiff: string): boolean {
  const posMap = buildPositionMap(currentDiff)
  return !posMap.has(`${finding.file}:${finding.line}`)
}

const prNumber = parseInt(process.argv[2] ?? '', 10)
if (!prNumber) {
  console.error('Usage: resolve-threads.ts <pr-number>')
  process.exit(1)
}

const priorPath = '/tmp/prior-findings/review-findings.json'
if (!existsSync(priorPath)) {
  console.log('No prior findings — nothing to resolve')
  process.exit(0)
}

const repo =
  process.env.GITHUB_REPOSITORY ??
  (await Bun.$`gh repo view --json nameWithOwner --jq '.nameWithOwner'`.text()).trim()

const priorFindings: Finding[] = JSON.parse(readFileSync(priorPath, 'utf-8'))
const ctx = JSON.parse(readFileSync('/tmp/pr-context.json', 'utf-8'))
const { headSha, diff } = ctx as { headSha: string; diff: string }

const existingComments =
  (await Bun.$`gh api repos/${repo}/pulls/${prNumber}/comments`.json()) as Record<string, unknown>[]
const botComments = existingComments.filter((c) =>
  String(c.body ?? '').includes('<!-- reviewed-by-bot-comment -->')
)

const fixed: Finding[] = []
const remaining: Finding[] = []

for (const prior of priorFindings) {
  if (isVerifiedFixed(prior, diff)) {
    fixed.push(prior)
    if (prior.databaseId) {
      try {
        await Bun.$`gh api graphql -f query=${`mutation { minimizeComment(input: {subjectId: "${prior.databaseId}", classifier: RESOLVED}) { minimizedComment { isMinimized } } }`}`.quiet()
      } catch {
        // non-fatal — thread resolution best-effort
      }
    }
  } else {
    const alreadyPosted = botComments.some(
      (c) => String(c.path ?? '') === prior.file && Number(c.line ?? 0) === prior.line
    )
    if (!alreadyPosted) remaining.push(prior)
  }
}

const summary = [
  '<!-- reviewed-by-bot -->',
  `<!-- review-sha: ${headSha} -->`,
  '## Follow-up Review',
  `✅ **${fixed.length} verified fixed** | ⚠️ **${remaining.length} remaining**`,
  '',
  fixed.length > 0 ? `### Fixed\n${fixed.map((f) => `- ${f.file}:${f.line}`).join('\n')}` : '',
  remaining.length > 0
    ? `### Remaining\n${remaining.map((f) => `- ${f.file}:${f.line} — ${f.body.slice(0, 80)}`).join('\n')}`
    : '',
]
  .filter(Boolean)
  .join('\n')

await Bun.$`gh pr comment ${prNumber} --body ${summary}`.quiet()
console.log(`Resolved ${fixed.length} threads, ${remaining.length} remaining`)
