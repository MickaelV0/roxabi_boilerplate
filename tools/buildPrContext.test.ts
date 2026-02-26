import { describe, expect, it, vi } from 'vitest'
import { stubBun } from './__tests__/stubBun.js'

// ─── Stub Bun global ──────────────────────────────────────────────────────
// buildPrContext.ts calls json() twice in sequence: first call returns a PR
// object (needs .head.sha), second returns an empty array (comments, needs
// Array.find). Pass a custom json mock to stubBun() for this ordering.
stubBun(
  vi
    .fn()
    .mockResolvedValueOnce({ head: { sha: 'abc123def456' } })
    .mockResolvedValueOnce([])
)

// Stub process.argv so the PR-number guard passes; mock exit so it never fires.
vi.spyOn(process, 'exit').mockImplementation((() => {}) as never)
process.argv = ['bun', 'buildPrContext.ts', '42']

// writeFileSync is called at the end of the script — mock to avoid /tmp writes.
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return { ...actual, writeFileSync: vi.fn() }
})

const { parsePriorReview } = await import('./buildPrContext.js')

// ─── parsePriorReview — detection ────────────────────────────────────────

describe('parsePriorReview — marker detection', () => {
  it('detects reviewed-by-bot marker', () => {
    // Arrange
    const comments = [{ id: 1, body: '<!-- reviewed-by-bot -->\n## Code Review\nsome findings' }]

    // Act
    const result = parsePriorReview(comments)

    // Assert
    expect(result.priorReviewFound).toBe(true)
    expect(result.priorReviewCommentId).toBe(1)
    expect(result.priorReviewCommitSha).toBeNull()
  })

  it('extracts review-sha when present', () => {
    // Arrange
    const sha = 'abc123def456'
    const comments = [
      { id: 2, body: `<!-- reviewed-by-bot -->\n<!-- review-sha: ${sha} -->\n## Code Review` },
    ]

    // Act
    const result = parsePriorReview(comments)

    // Assert
    expect(result.priorReviewFound).toBe(true)
    expect(result.priorReviewCommitSha).toBe(sha)
  })

  it('returns priorReviewCommentId matching the comment id', () => {
    // Arrange
    const comments = [{ id: 42, body: '<!-- reviewed-by-bot -->\nsome content' }]

    // Act
    const result = parsePriorReview(comments)

    // Assert
    expect(result.priorReviewCommentId).toBe(42)
  })

  it('returns null sha when marker present but no review-sha comment', () => {
    // Arrange
    const comments = [{ id: 5, body: '<!-- reviewed-by-bot -->\nNo findings.' }]

    // Act
    const result = parsePriorReview(comments)

    // Assert
    expect(result.priorReviewFound).toBe(true)
    expect(result.priorReviewCommitSha).toBeNull()
  })
})

// ─── parsePriorReview — no-marker cases ──────────────────────────────────

describe('parsePriorReview — no marker / edge cases', () => {
  it('returns false when no marker present', () => {
    // Arrange
    const comments = [{ id: 3, body: '## Manual review comment' }]

    // Act
    const result = parsePriorReview(comments)

    // Assert
    expect(result.priorReviewFound).toBe(false)
    expect(result.priorReviewCommentId).toBeNull()
    expect(result.priorReviewCommitSha).toBeNull()
  })

  it('returns false for empty comments array', () => {
    // Act
    const result = parsePriorReview([])

    // Assert
    expect(result.priorReviewFound).toBe(false)
    expect(result.priorReviewCommentId).toBeNull()
  })

  it('uses the last matching comment when multiple bot comments exist', () => {
    // Arrange — Array.findLast returns the last match; the deterministic marker step
    // is always posted after Claude's review comment, so it takes priority.
    const comments = [
      { id: 10, body: '<!-- reviewed-by-bot -->\n<!-- review-sha: aaa111 -->' },
      { id: 20, body: '<!-- reviewed-by-bot -->\n<!-- review-sha: bbb222 -->' },
    ]

    // Act
    const result = parsePriorReview(comments)

    // Assert
    expect(result.priorReviewCommentId).toBe(20)
    expect(result.priorReviewCommitSha).toBe('bbb222')
  })

  it('ignores non-bot comments before the bot comment', () => {
    // Arrange
    const comments = [
      { id: 1, body: 'Normal comment by a human' },
      { id: 2, body: '<!-- reviewed-by-bot -->\n<!-- review-sha: deadbeef -->' },
    ]

    // Act
    const result = parsePriorReview(comments)

    // Assert
    expect(result.priorReviewFound).toBe(true)
    expect(result.priorReviewCommentId).toBe(2)
    expect(result.priorReviewCommitSha).toBe('deadbeef')
  })
})
