import { describe, expect, it, vi } from 'vitest'
import { stubBun } from './__tests__/stubBun.js'

// ─── Stub Bun global ──────────────────────────────────────────────────────
// postInlineComments.ts uses Bun.$ as a global template literal for shell commands.
// Vitest runs under Node.js where Bun is undefined — inject via shared helper.
stubBun()

// Stub argv (pr-number + head-sha) and mock exit to prevent real termination.
vi.spyOn(process, 'exit').mockImplementation((() => {}) as never)
process.argv = ['bun', 'postInlineComments.ts', '42', 'abc123def456abc123def456abc12345']

// readFileSync is called for /tmp paths at top level — return stub JSON.
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return {
    ...actual,
    readFileSync: vi.fn().mockImplementation((path: unknown, encoding?: unknown) => {
      if (typeof path === 'string' && path.includes('/tmp')) {
        if (path.includes('findings')) return '[]'
        if (path.includes('pr-context')) return JSON.stringify({ diff: '' })
      }
      return actual.readFileSync(
        path as Parameters<typeof actual.readFileSync>[0],
        encoding as Parameters<typeof actual.readFileSync>[1]
      )
    }),
  }
})

const { buildPositionMap } = await import('./postInlineComments.js')

// ─── Shared sample diff ───────────────────────────────────────────────────

const SAMPLE_DIFF = [
  'diff --git a/src/foo.ts b/src/foo.ts',
  'index abc..def 100644',
  '--- a/src/foo.ts',
  '+++ b/src/foo.ts',
  '@@ -10,4 +10,5 @@',
  ' context line 10',
  '+added line 11',
  ' context line 12',
  '-removed line',
  ' context line 13',
].join('\n')

// ─── buildPositionMap — single-file mapping ───────────────────────────────

describe('buildPositionMap — single-file mapping', () => {
  it('maps added line to correct position', () => {
    // Act
    const map = buildPositionMap(SAMPLE_DIFF)

    // Assert
    expect(map.has('src/foo.ts:11')).toBe(true)
    expect(map.get('src/foo.ts:11')?.side).toBe('RIGHT')
  })

  it('maps context lines to correct positions', () => {
    // Act
    const map = buildPositionMap(SAMPLE_DIFF)

    // Assert
    expect(map.has('src/foo.ts:10')).toBe(true)
    expect(map.has('src/foo.ts:12')).toBe(true)
    expect(map.has('src/foo.ts:13')).toBe(true)
  })

  it('does not map removed lines to new-file line numbers', () => {
    // Act
    const map = buildPositionMap(SAMPLE_DIFF)

    // Assert — line 11 is the added line (removed line skipped); line 14 absent
    expect(map.get('src/foo.ts:11')?.side).toBe('RIGHT')
    expect(map.has('src/foo.ts:14')).toBe(false)
  })

  it('returns empty map for out-of-diff line numbers', () => {
    // Act
    const map = buildPositionMap(SAMPLE_DIFF)

    // Assert
    expect(map.has('src/foo.ts:1')).toBe(false)
    expect(map.has('src/foo.ts:99')).toBe(false)
  })

  it('sets correct path and line on DiffPosition entries', () => {
    // Act
    const map = buildPositionMap(SAMPLE_DIFF)

    // Assert
    const pos = map.get('src/foo.ts:10')
    expect(pos?.path).toBe('src/foo.ts')
    expect(pos?.line).toBe(10)
  })
})

// ─── buildPositionMap — multi-file ───────────────────────────────────────

describe('buildPositionMap — multi-file', () => {
  it('handles multiple files in one diff', () => {
    // Arrange
    const multiDiff =
      SAMPLE_DIFF +
      '\n' +
      [
        'diff --git a/src/bar.ts b/src/bar.ts',
        '--- a/src/bar.ts',
        '+++ b/src/bar.ts',
        '@@ -1,2 +1,3 @@',
        ' line 1',
        '+line 2',
        ' line 3',
      ].join('\n')

    // Act
    const map = buildPositionMap(multiDiff)

    // Assert — entries from both files are present
    expect(map.has('src/bar.ts:2')).toBe(true)
    expect(map.has('src/foo.ts:10')).toBe(true)
  })

  it('handles multiple hunks within the same file', () => {
    // Arrange
    const multiHunkDiff = [
      'diff --git a/src/util.ts b/src/util.ts',
      '--- a/src/util.ts',
      '+++ b/src/util.ts',
      '@@ -1,2 +1,2 @@',
      ' line 1',
      '+line 2 modified',
      '@@ -10,2 +10,2 @@',
      ' line 10',
      '+line 11 modified',
    ].join('\n')

    // Act
    const map = buildPositionMap(multiHunkDiff)

    // Assert — lines from both hunks are indexed
    expect(map.has('src/util.ts:1')).toBe(true)
    expect(map.has('src/util.ts:2')).toBe(true)
    expect(map.has('src/util.ts:10')).toBe(true)
    expect(map.has('src/util.ts:11')).toBe(true)
  })
})

// ─── buildPositionMap — special lines and empty input ─────────────────────

describe('buildPositionMap — special lines and empty input', () => {
  it('returns empty map for empty diff', () => {
    // Act / Assert
    expect(buildPositionMap('').size).toBe(0)
  })

  it('skips backslash lines (no newline at end of file)', () => {
    // Arrange
    const diffWithNoNewline = [
      'diff --git a/src/x.ts b/src/x.ts',
      '--- a/src/x.ts',
      '+++ b/src/x.ts',
      '@@ -1,1 +1,1 @@',
      '+new content',
      '\\ No newline at end of file',
    ].join('\n')

    // Act
    const map = buildPositionMap(diffWithNoNewline)

    // Assert — backslash line skipped; only the added line is mapped
    expect(map.has('src/x.ts:1')).toBe(true)
    expect(map.size).toBe(1)
  })
})
