/**
 * Tests for the resolveThreads.ts resolution loop.
 *
 * This file is separate from resolveThreads.test.ts because it needs different
 * module-level mocks: existsSync=true to exercise the full resolution loop rather
 * than the early-exit "no prior findings" path.
 *
 * Each Vitest worker runs test files in isolation, so module-level mocks and
 * top-level script execution are independent between this file and
 * resolveThreads.test.ts.
 */
import { describe, expect, it, vi } from 'vitest'
import { stubBun } from './__tests__/stubBun.js'

// ─── Stub Bun global ──────────────────────────────────────────────────────
const { bunShellResult } = stubBun()

// ─── Stub process.argv + exit ─────────────────────────────────────────────
vi.spyOn(process, 'exit').mockImplementation((() => {}) as never)
process.argv = ['bun', 'resolveThreads.ts', '42']
// Set GITHUB_REPOSITORY to skip the Bun.$ repo-detection call
process.env.GITHUB_REPOSITORY = 'owner/repo-test'

// ─── Sample diff and prior findings ───────────────────────────────────────

// Diff touches src/auth.ts — line 10 is added, line 5 is context, line 99 is NOT in diff
const SAMPLE_DIFF = [
  'diff --git a/src/auth.ts b/src/auth.ts',
  '--- a/src/auth.ts',
  '+++ b/src/auth.ts',
  '@@ -5,3 +5,4 @@',
  ' line 5',
  '+line 10 new',
  ' line 11',
  ' line 12',
].join('\n')

const PRIOR_FINDINGS = JSON.stringify([
  // line 99 of src/auth.ts — NOT in diff → verified-fixed (file IS in diff)
  { file: 'src/auth.ts', line: 99, body: 'finding that was fixed' },
  // line 10 of src/auth.ts — IS in diff → still present (not fixed)
  { file: 'src/auth.ts', line: 10, body: 'finding still present in diff' },
  // src/other.ts — NOT touched in diff → not fixed (untouched file)
  { file: 'src/other.ts', line: 1, body: 'finding in untouched file' },
])

// ─── Node:fs mock — existsSync=true to exercise the full resolution loop ──
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return {
    ...actual,
    existsSync: vi.fn().mockReturnValue(true), // ← prior findings file exists
    readFileSync: vi.fn().mockImplementation((path: unknown, encoding?: unknown) => {
      if (typeof path === 'string' && path.includes('/tmp')) {
        if (path.includes('prior-findings')) return PRIOR_FINDINGS
        if (path.includes('pr-context'))
          return JSON.stringify({
            diff: SAMPLE_DIFF,
            headSha: 'cafebabe00000000000000000000000000000000',
          })
      }
      return actual.readFileSync(
        path as Parameters<typeof actual.readFileSync>[0],
        encoding as Parameters<typeof actual.readFileSync>[1]
      )
    }),
  }
})

// ─── Run the resolution script (exercises the full loop) ──────────────────
await import('./resolveThreads.js')

// ─── Resolution loop — behaviour assertions ───────────────────────────────

describe('resolveThreads resolution loop — with prior findings', () => {
  it('posts a follow-up summary comment via gh pr comment', () => {
    // Arrange — the script ran above with 3 prior findings
    // 1 fixed (line 99, touched file, not in posMap), 2 not fixed
    // Act — completed during import
    // Assert — Bun.$ was called for the summary comment (quiet = fire-and-forget)
    expect(bunShellResult.quiet).toHaveBeenCalled()
  })

  it('queries existing inline comments before determining remaining findings', () => {
    // The script calls Bun.$`gh api .../comments`.json() to get existing bot comments
    // This is used to skip already-posted remaining findings in the summary
    expect(bunShellResult.json).toHaveBeenCalled()
  })

  it('does not call the GraphQL minimizeComment mutation (nodeId absent from prior findings)', () => {
    // The prior findings have no nodeId — the if (prior.nodeId) guard skips the mutation
    // call. nodeId is populated by postInlineComments.ts from the gh api response; prior
    // findings from a stub don't include it, so minimizeComment is correctly not called.
    const allCalls = bunShellResult.quiet.mock.calls
    const graphqlCalls = allCalls.filter((args: unknown[]) =>
      String(args).includes('minimizeComment')
    )
    expect(graphqlCalls).toHaveLength(0)
  })
})
