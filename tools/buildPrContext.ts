/**
 * Build PR review context file for the automated review pipeline.
 * Outputs /tmp/pr-context.json consumed by pr-review.yml.
 *
 * Usage: GH_TOKEN=... bun run tools/build-pr-context.ts <pr-number>
 * Exit 0 on success, 1 on error.
 */
import { writeFileSync } from 'node:fs'

interface PrContext {
  prNumber: number
  headSha: string
  diff: string
  priorReviewFound: boolean
  priorReviewCommentId: number | null
  priorReviewCommitSha: string | null
  threads: ReviewThread[]
}

interface ReviewThread {
  id: string
  databaseId: number
  path: string
  line: number | null
  body: string
  isMinimized: boolean
}

interface PrComment {
  id: number
  body: string
}

interface PriorReviewResult {
  priorReviewFound: boolean
  priorReviewCommentId: number | null
  priorReviewCommitSha: string | null
}

export function parsePriorReview(comments: PrComment[]): PriorReviewResult {
  // findLast: prefer the deterministic marker step comment (posted after Claude's review)
  // over Claude's own review comment, which may omit or misformat the markers.
  const botComment = comments.findLast((c) => c.body.includes('<!-- reviewed-by-bot -->'))
  if (!botComment) {
    return { priorReviewFound: false, priorReviewCommentId: null, priorReviewCommitSha: null }
  }
  const shaMatch = botComment.body.match(/<!-- review-sha: ([a-f0-9]+) -->/)
  return {
    priorReviewFound: true,
    priorReviewCommentId: botComment.id,
    priorReviewCommitSha: shaMatch?.[1] ?? null,
  }
}

async function fetchReviewThreads(prNumber: number, repo: string): Promise<ReviewThread[]> {
  try {
    const result = await Bun.$`gh api repos/${repo}/pulls/${prNumber}/comments --paginate`.json()
    return (Array.isArray(result) ? result : []).map((c: Record<string, unknown>) => ({
      id: String(c.node_id),
      databaseId: Number(c.id),
      path: String(c.path ?? ''),
      line: c.line != null ? Number(c.line) : null,
      body: String(c.body ?? ''),
      isMinimized: false,
    }))
  } catch {
    return []
  }
}

const prNumber = parseInt(process.argv[2] ?? '', 10)
if (!prNumber) {
  console.error('Usage: build-pr-context.ts <pr-number>')
  process.exit(1)
}

const repo =
  process.env.GITHUB_REPOSITORY ??
  (await Bun.$`gh repo view --json nameWithOwner --jq '.nameWithOwner'`.text()).trim()

const [diffResult, prResult, commentsResult] = await Promise.all([
  Bun.$`gh pr diff ${prNumber} --patch`.text(),
  Bun.$`gh api repos/${repo}/pulls/${prNumber}`.json(),
  Bun.$`gh api repos/${repo}/issues/${prNumber}/comments`.json(),
])

const priorReview = parsePriorReview(commentsResult as PrComment[])
const threads = await fetchReviewThreads(prNumber, repo)

const ctx: PrContext = {
  prNumber,
  headSha: (prResult as Record<string, Record<string, string>>).head.sha,
  diff: diffResult,
  ...priorReview,
  threads,
}

writeFileSync('/tmp/pr-context.json', JSON.stringify(ctx, null, 2))
console.log(
  `Context written: priorReviewFound=${ctx.priorReviewFound}, headSha=${ctx.headSha.slice(0, 8)}`
)
