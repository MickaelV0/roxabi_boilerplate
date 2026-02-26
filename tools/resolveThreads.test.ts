import { describe, expect, it, vi } from 'vitest'

// ─── Stub Bun global ──────────────────────────────────────────────────────
// resolveThreads.ts and its imported postInlineComments.ts use Bun.$ as a
// global template literal for shell commands. Vitest runs under Node.js where
// Bun is undefined. We inject a fake Bun.$ into globalThis before importing.
const bunShellResult = {
  text: vi.fn().mockResolvedValue(''),
  json: vi.fn().mockResolvedValue([]),
  quiet: vi.fn().mockResolvedValue({}),
}
const bunShellTag = Object.assign(vi.fn().mockReturnValue(bunShellResult), bunShellResult)
;(globalThis as Record<string, unknown>).Bun = { $: bunShellTag }

// Stub argv + exit; postInlineComments also checks argv[2] and argv[3].
vi.spyOn(process, 'exit').mockImplementation((() => {}) as never)
process.argv = ['bun', 'resolveThreads.ts', '42', 'abc123def456']

// existsSync returns false so the script takes the "no prior findings" early
// exit path and does not attempt any real API calls.
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return {
    ...actual,
    existsSync: vi.fn().mockReturnValue(false),
    readFileSync: vi.fn().mockImplementation((path: unknown, encoding?: unknown) => {
      if (typeof path === 'string' && path.includes('/tmp')) {
        if (path.includes('findings')) return '[]'
        if (path.includes('pr-context')) return JSON.stringify({ diff: '', headSha: 'abc123' })
      }
      return actual.readFileSync(
        path as Parameters<typeof actual.readFileSync>[0],
        encoding as Parameters<typeof actual.readFileSync>[1]
      )
    }),
  }
})

const { isVerifiedFixed } = await import('./resolveThreads.js')

// ─── Shared sample diff ───────────────────────────────────────────────────

const DIFF_WITH_CHANGES = [
  'diff --git a/src/auth.ts b/src/auth.ts',
  '--- a/src/auth.ts',
  '+++ b/src/auth.ts',
  '@@ -5,3 +5,4 @@',
  ' line 5',
  '+line 6 new',
  ' line 7',
  ' line 8',
].join('\n')

// ─── isVerifiedFixed — core cases ────────────────────────────────────────

describe('isVerifiedFixed — verified-fixed detection', () => {
  it('returns true when finding line is not in diff', () => {
    // Arrange — line 99 is nowhere in DIFF_WITH_CHANGES
    const finding = { file: 'src/auth.ts', line: 99, body: 'test finding' }

    // Act / Assert
    expect(isVerifiedFixed(finding, DIFF_WITH_CHANGES)).toBe(true)
  })

  it('returns false when finding line is still in diff', () => {
    // Arrange — line 6 is an added line in the diff
    const finding = { file: 'src/auth.ts', line: 6, body: 'test finding' }

    // Act / Assert
    expect(isVerifiedFixed(finding, DIFF_WITH_CHANGES)).toBe(false)
  })

  it('returns true when file is not in diff at all', () => {
    // Arrange — src/other.ts does not appear in DIFF_WITH_CHANGES
    const finding = { file: 'src/other.ts', line: 1, body: 'test finding' }

    // Act / Assert
    expect(isVerifiedFixed(finding, DIFF_WITH_CHANGES)).toBe(true)
  })

  it('returns false for finding on context line present in diff', () => {
    // Arrange — line 5 is a context line present in the diff hunk
    const finding = { file: 'src/auth.ts', line: 5, body: 'context line finding' }

    // Act / Assert — position map includes context lines
    expect(isVerifiedFixed(finding, DIFF_WITH_CHANGES)).toBe(false)
  })
})

// ─── isVerifiedFixed — edge cases ────────────────────────────────────────

describe('isVerifiedFixed — edge cases', () => {
  it('handles empty diff (all findings treated as verified fixed)', () => {
    // Arrange
    const finding = { file: 'src/foo.ts', line: 10, body: 'test' }

    // Act / Assert
    expect(isVerifiedFixed(finding, '')).toBe(true)
  })

  it('returns true when finding line falls outside all diff hunks', () => {
    // Arrange — diff covers lines 5-8; line 50 is not in any hunk
    const finding = { file: 'src/auth.ts', line: 50, body: 'outside hunk' }

    // Act / Assert
    expect(isVerifiedFixed(finding, DIFF_WITH_CHANGES)).toBe(true)
  })

  it('handles multi-file diff and correctly scopes by file', () => {
    // Arrange
    const multiFileDiff = [
      'diff --git a/src/auth.ts b/src/auth.ts',
      '--- a/src/auth.ts',
      '+++ b/src/auth.ts',
      '@@ -1,1 +1,1 @@',
      '+auth line 1',
      'diff --git a/src/user.ts b/src/user.ts',
      '--- a/src/user.ts',
      '+++ b/src/user.ts',
      '@@ -1,1 +1,1 @@',
      '+user line 1',
    ].join('\n')

    // Act
    const authResult = isVerifiedFixed(
      { file: 'src/auth.ts', line: 1, body: 'auth finding' },
      multiFileDiff
    )
    const userResult = isVerifiedFixed(
      { file: 'src/user.ts', line: 99, body: 'user finding outside diff' },
      multiFileDiff
    )

    // Assert
    expect(authResult).toBe(false) // line 1 of src/auth.ts is in diff
    expect(userResult).toBe(true) // line 99 of src/user.ts is not in diff
  })
})
