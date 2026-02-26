import { describe, expect, it, vi } from 'vitest'

// ─── Stub Bun global ──────────────────────────────────────────────────────
// buildPrContext.ts uses Bun.$ as a global template literal for shell commands.
// Vitest runs under Node.js where Bun is undefined. We inject a fake Bun.$
// into globalThis before importing the module so the top-level script code
// does not throw. The stub returns empty/no-op results for all shell calls.
// json() is called for both the PR object and the comments array.
// PR object needs .head.sha; comments array needs to be iterable (Array.find).
// We alternate: first call returns a PR-like object, second returns an array.
const bunShellResult = {
  text: vi.fn().mockResolvedValue(''),
  json: vi
    .fn()
    .mockResolvedValueOnce({ head: { sha: 'abc123def456' } }) // gh api PR
    .mockResolvedValueOnce([]), // gh api comments
  quiet: vi.fn().mockResolvedValue({}),
}
const bunShellTag = Object.assign(vi.fn().mockReturnValue(bunShellResult), bunShellResult)
;(globalThis as Record<string, unknown>).Bun = { $: bunShellTag }

// ─── Stub process.argv + process.exit ────────────────────────────────────
// The script checks process.argv[2] for a PR number at the module's top level
// and calls process.exit(1) when missing. Stub argv to a valid value and mock
// exit so it never actually exits.
vi.spyOn(process, 'exit').mockImplementation((() => {}) as never)
process.argv = ['bun', 'buildPrContext.ts', '42']

// ─── Mock node:fs ─────────────────────────────────────────────────────────
// writeFileSync is called at the end of the script. Mock it to avoid writing
// to /tmp in the test environment.
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return { ...actual, writeFileSync: vi.fn() }
})

// Dynamic import happens AFTER all mocks are registered
const { parsePriorReview } = await import('./buildPrContext.js')

// ─── parsePriorReview ─────────────────────────────────────────────────────

describe('parsePriorReview', () => {
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
      {
        id: 2,
        body: `<!-- reviewed-by-bot -->\n<!-- review-sha: ${sha} -->\n## Code Review`,
      },
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
    expect(result.priorReviewCommitSha).toBeNull()
  })

  it('uses the first matching comment when multiple bot comments exist', () => {
    // Arrange — two bot comments; Array.find returns the first match
    const comments = [
      { id: 10, body: '<!-- reviewed-by-bot -->\n<!-- review-sha: aaa111 -->' },
      { id: 20, body: '<!-- reviewed-by-bot -->\n<!-- review-sha: bbb222 -->' },
    ]

    // Act
    const result = parsePriorReview(comments)

    // Assert
    expect(result.priorReviewCommentId).toBe(10)
    expect(result.priorReviewCommitSha).toBe('aaa111')
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

  it('returns null sha when marker is present but no review-sha comment', () => {
    // Arrange
    const comments = [{ id: 5, body: '<!-- reviewed-by-bot -->\nNo findings.' }]

    // Act
    const result = parsePriorReview(comments)

    // Assert
    expect(result.priorReviewFound).toBe(true)
    expect(result.priorReviewCommitSha).toBeNull()
  })
})
