import { describe, expect, it, vi } from 'vitest'

// ─── Stub Bun global ──────────────────────────────────────────────────────
// postInlineComments.ts uses Bun.$ as a global template literal for shell
// commands. Vitest runs under Node.js where Bun is undefined. We inject a
// fake Bun.$ into globalThis before importing the module so the top-level
// script code does not throw.
const bunShellResult = {
  text: vi.fn().mockResolvedValue(''),
  json: vi.fn().mockResolvedValue([]),
  quiet: vi.fn().mockResolvedValue({}),
}
const bunShellTag = Object.assign(vi.fn().mockReturnValue(bunShellResult), bunShellResult)
;(globalThis as Record<string, unknown>).Bun = { $: bunShellTag }

// ─── Stub process.argv + process.exit ────────────────────────────────────
// The script checks process.argv[2] and argv[3] at top level and calls
// process.exit(1) when either is missing.
vi.spyOn(process, 'exit').mockImplementation((() => {}) as never)
process.argv = ['bun', 'postInlineComments.ts', '42', 'abc123def456abc123def456abc12345']

// ─── Mock node:fs ─────────────────────────────────────────────────────────
// readFileSync is called for /tmp paths at top level. Return stub JSON so the
// script does not throw when files are missing in the test environment.
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

// ─── Sample diff ──────────────────────────────────────────────────────────

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

// ─── buildPositionMap ─────────────────────────────────────────────────────

describe('buildPositionMap', () => {
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

    // Assert — removed line has no new-file entry; line 11 is the added line,
    // line 13 is the last context line; line 14 does not exist in new file.
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

  it('handles multiple files', () => {
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

    // Assert — both files are indexed
    expect(map.has('src/bar.ts:2')).toBe(true)
    expect(map.has('src/foo.ts:10')).toBe(true)
  })

  it('returns empty map for empty diff', () => {
    // Act
    const map = buildPositionMap('')

    // Assert
    expect(map.size).toBe(0)
  })

  it('skips lines starting with backslash (no newline at end of file)', () => {
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

    // Assert — backslash line is skipped; only the added line is mapped
    expect(map.has('src/x.ts:1')).toBe(true)
    expect(map.size).toBe(1)
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
