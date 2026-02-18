import { join, resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─── Mock the 'bun' module ──────────────────────────────────────────────────
// The source file imports { Glob } from 'bun', which is unavailable in Vitest
// (Node.js). We provide a mock Glob class whose scan() returns configurable
// file lists so collectFiles can be tested in isolation.
//
// The source iterates over SCAN_PATTERNS = ['docs/**/*.mdx', 'docs/**/*.md', '*.md']
// creating a new Glob per pattern. Our mock captures the pattern and returns
// files from a per-pattern map so tests can control which pattern produces
// which files.
//
// We store the map on globalThis so the vi.mock factory (which is hoisted
// before const declarations) can access it without hitting a temporal dead zone.
;(globalThis as Record<string, unknown>).__mockScanResultsByPattern = {} as Record<string, string[]>

function getMockMap(): Record<string, string[]> {
  return (globalThis as Record<string, unknown>).__mockScanResultsByPattern as Record<
    string,
    string[]
  >
}

vi.mock('bun', () => {
  return {
    Glob: class MockGlob {
      pattern: string
      constructor(pattern: string) {
        this.pattern = pattern
      }
      scan(_opts: unknown) {
        const map = ((globalThis as Record<string, unknown>).__mockScanResultsByPattern ??
          {}) as Record<string, string[]>
        const results = [...(map[this.pattern] ?? [])]
        return {
          [Symbol.asyncIterator]() {
            let index = 0
            return {
              async next() {
                if (index < results.length) {
                  return { value: results[index++], done: false }
                }
                return { value: undefined, done: true }
              },
            }
          },
        }
      }
    },
  }
})

import {
  collectFiles,
  extractLinks,
  filterCodeBlocks,
  isInternalLink,
  resolveLink,
} from './docs-link-audit'

// ─── Constants ──────────────────────────────────────────────────────────────

const ROOT = resolve(import.meta.dirname, '..')

// ─── extractLinks ───────────────────────────────────────────────────────────

describe('extractLinks', () => {
  it('should extract a single standard markdown link', () => {
    // Arrange
    const content = 'See [the docs](docs/getting-started.mdx) for details.'

    // Act
    const result = extractLinks(content)

    // Assert
    expect(result).toEqual([{ target: 'docs/getting-started.mdx', line: 1 }])
  })

  it('should extract multiple links on the same line', () => {
    // Arrange
    const content = 'Check [foo](foo.md) and [bar](bar.md) today.'

    // Act
    const result = extractLinks(content)

    // Assert
    expect(result).toEqual([
      { target: 'foo.md', line: 1 },
      { target: 'bar.md', line: 1 },
    ])
  })

  it('should extract the URL and strip the title from a link with title', () => {
    // Arrange
    const content = '[Guide](docs/guide.mdx "The Guide")'

    // Act
    const result = extractLinks(content)

    // Assert
    expect(result).toEqual([{ target: 'docs/guide.mdx', line: 1 }])
  })

  it('should handle escaped brackets in link text', () => {
    // Arrange
    const content = '[array\\[0\\]](docs/arrays.mdx)'

    // Act
    const result = extractLinks(content)

    // Assert
    expect(result).toEqual([{ target: 'docs/arrays.mdx', line: 1 }])
  })

  it('should track correct 1-based line numbers across multiple lines', () => {
    // Arrange
    const content = [
      'Line one.',
      'Line two with [a link](target-a.md).',
      'Line three.',
      'Line four with [another](target-b.md).',
    ].join('\n')

    // Act
    const result = extractLinks(content)

    // Assert
    expect(result).toEqual([
      { target: 'target-a.md', line: 2 },
      { target: 'target-b.md', line: 4 },
    ])
  })

  it('should return an empty array for content with no links', () => {
    // Arrange
    const content = 'Just some plain text without any links.'

    // Act
    const result = extractLinks(content)

    // Assert
    expect(result).toEqual([])
  })
})

// ─── filterCodeBlocks ───────────────────────────────────────────────────────

describe('filterCodeBlocks', () => {
  it('should keep links that are outside code blocks', () => {
    // Arrange
    const content = [
      'See [link](target.md).',
      '```',
      'code here',
      '```',
      'More [stuff](other.md).',
    ].join('\n')
    const links = [
      { target: 'target.md', line: 1 },
      { target: 'other.md', line: 5 },
    ]

    // Act
    const result = filterCodeBlocks(content, links)

    // Assert
    expect(result).toEqual([
      { target: 'target.md', line: 1 },
      { target: 'other.md', line: 5 },
    ])
  })

  it('should remove links that are inside fenced code blocks', () => {
    // Arrange
    const content = [
      'Text before.',
      '```markdown',
      '[inside code](should-be-removed.md)',
      '```',
      'Text after.',
    ].join('\n')
    const links = [{ target: 'should-be-removed.md', line: 3 }]

    // Act
    const result = filterCodeBlocks(content, links)

    // Assert
    expect(result).toEqual([])
  })

  it('should handle tilde-fenced code blocks', () => {
    // Arrange
    const content = ['~~~', '[inside tilde fence](removed.md)', '~~~', '[outside](kept.md)'].join(
      '\n'
    )
    const links = [
      { target: 'removed.md', line: 2 },
      { target: 'kept.md', line: 4 },
    ]

    // Act
    const result = filterCodeBlocks(content, links)

    // Assert
    expect(result).toEqual([{ target: 'kept.md', line: 4 }])
  })

  it('should remove links on the fence line itself', () => {
    // Arrange
    const content = ['``` [link on fence](fence.md)', 'code', '```'].join('\n')
    const links = [{ target: 'fence.md', line: 1 }]

    // Act
    const result = filterCodeBlocks(content, links)

    // Assert
    expect(result).toEqual([])
  })

  it('should handle multiple code blocks in the same content', () => {
    // Arrange
    const content = [
      '[before](a.md)',
      '```',
      '[inside-1](b.md)',
      '```',
      '[between](c.md)',
      '```',
      '[inside-2](d.md)',
      '```',
      '[after](e.md)',
    ].join('\n')
    const links = [
      { target: 'a.md', line: 1 },
      { target: 'b.md', line: 3 },
      { target: 'c.md', line: 5 },
      { target: 'd.md', line: 7 },
      { target: 'e.md', line: 9 },
    ]

    // Act
    const result = filterCodeBlocks(content, links)

    // Assert
    expect(result).toEqual([
      { target: 'a.md', line: 1 },
      { target: 'c.md', line: 5 },
      { target: 'e.md', line: 9 },
    ])
  })
})

// ─── isInternalLink ─────────────────────────────────────────────────────────

describe('isInternalLink', () => {
  it('should return false for https URLs', () => {
    // Arrange
    const target = 'https://example.com/docs'

    // Act & Assert
    expect(isInternalLink(target)).toBe(false)
  })

  it('should return false for http URLs', () => {
    // Arrange
    const target = 'http://example.com'

    // Act & Assert
    expect(isInternalLink(target)).toBe(false)
  })

  it('should return false for mailto links', () => {
    // Arrange
    const target = 'mailto:user@example.com'

    // Act & Assert
    expect(isInternalLink(target)).toBe(false)
  })

  it('should return false for anchor-only links', () => {
    // Arrange
    const target = '#section-heading'

    // Act & Assert
    expect(isInternalLink(target)).toBe(false)
  })

  it('should return false for tel: scheme', () => {
    // Arrange
    const target = 'tel:+1234567890'

    // Act & Assert
    expect(isInternalLink(target)).toBe(false)
  })

  it('should return false for ftp links', () => {
    // Arrange
    const target = 'ftp://files.example.com/doc.pdf'

    // Act & Assert
    expect(isInternalLink(target)).toBe(false)
  })

  it('should return false for image files (svg)', () => {
    // Arrange & Act & Assert
    expect(isInternalLink('assets/logo.svg')).toBe(false)
  })

  it('should return false for image files (png)', () => {
    // Arrange & Act & Assert
    expect(isInternalLink('screenshots/demo.png')).toBe(false)
  })

  it('should return false for image files (jpg)', () => {
    // Arrange & Act & Assert
    expect(isInternalLink('photos/hero.jpg')).toBe(false)
  })

  it('should return false for image files with anchors', () => {
    // Arrange & Act & Assert
    expect(isInternalLink('assets/badge.svg#dark')).toBe(false)
  })

  it('should return false for image files with query strings', () => {
    // Arrange & Act & Assert
    expect(isInternalLink('assets/badge.png?v=2')).toBe(false)
  })

  it('should return true for relative internal paths', () => {
    // Arrange & Act & Assert
    expect(isInternalLink('docs/getting-started')).toBe(true)
  })

  it('should return true for root-relative internal paths', () => {
    // Arrange & Act & Assert
    expect(isInternalLink('/docs/architecture/overview')).toBe(true)
  })

  it('should return true for paths with .mdx extension', () => {
    // Arrange & Act & Assert
    expect(isInternalLink('docs/guide.mdx')).toBe(true)
  })

  it('should return true for paths with .md extension', () => {
    // Arrange & Act & Assert
    expect(isInternalLink('CHANGELOG.md')).toBe(true)
  })

  it('should return true for parent-relative paths', () => {
    // Arrange & Act & Assert
    expect(isInternalLink('../contributing.mdx')).toBe(true)
  })
})

// ─── resolveLink ────────────────────────────────────────────────────────────
// These tests use real filesystem paths in the repo. The resolveLink function
// uses existsSync, which works against the actual filesystem.

describe('resolveLink', () => {
  it('should resolve an exact .mdx file path', () => {
    // Arrange -- docs/standards/testing.mdx is a known file in the repo
    const target = 'testing.mdx'
    const sourceFile = 'docs/standards/backend-patterns.mdx'

    // Act
    const result = resolveLink(target, sourceFile)

    // Assert
    expect(result).toBe(join(ROOT, 'docs/standards/testing.mdx'))
  })

  it('should resolve an extensionless link to a .mdx file', () => {
    // Arrange -- docs/standards/testing.mdx exists, try without extension
    const target = 'testing'
    const sourceFile = 'docs/standards/backend-patterns.mdx'

    // Act
    const result = resolveLink(target, sourceFile)

    // Assert
    expect(result).toBe(join(ROOT, 'docs/standards/testing.mdx'))
  })

  it('should resolve a link with .md extension', () => {
    // Arrange -- CLAUDE.md is at repo root
    const target = 'CLAUDE.md'
    const sourceFile = 'README.md'

    // Act
    const result = resolveLink(target, sourceFile)

    // Assert
    expect(result).toBe(join(ROOT, 'CLAUDE.md'))
  })

  it('should resolve a directory path when the directory exists on disk', () => {
    // Arrange -- docs/standards is a real directory; existsSync returns true
    // for directories, so the exact path candidate matches first.
    const target = 'standards'
    const sourceFile = 'docs/configuration.mdx'

    // Act
    const result = resolveLink(target, sourceFile)

    // Assert -- resolves to the directory itself (first candidate match)
    expect(result).toBe(resolve(ROOT, 'docs/standards'))
  })

  it('should return null for a link that does not exist', () => {
    // Arrange
    const target = 'nonexistent-page-that-does-not-exist'
    const sourceFile = 'docs/configuration.mdx'

    // Act
    const result = resolveLink(target, sourceFile)

    // Assert
    expect(result).toBeNull()
  })

  it('should strip anchor fragments before resolving', () => {
    // Arrange -- docs/standards/testing.mdx exists
    const target = 'testing#coverage-guidelines'
    const sourceFile = 'docs/standards/backend-patterns.mdx'

    // Act
    const result = resolveLink(target, sourceFile)

    // Assert
    expect(result).toBe(join(ROOT, 'docs/standards/testing.mdx'))
  })

  it('should return anchor-only sentinel when target is only a fragment', () => {
    // Arrange
    const target = '#some-heading'
    const sourceFile = 'docs/configuration.mdx'

    // Act
    const result = resolveLink(target, sourceFile)

    // Assert
    expect(result).toBe('(anchor-only)')
  })

  it('should resolve root-relative paths from repo root', () => {
    // Arrange -- /docs/standards/testing.mdx resolves from root regardless of source
    const target = '/docs/standards/testing.mdx'
    const sourceFile = 'some/deeply/nested/file.mdx'

    // Act
    const result = resolveLink(target, sourceFile)

    // Assert
    expect(result).toBe(join(ROOT, 'docs/standards/testing.mdx'))
  })

  it('should resolve parent-relative paths from source file directory', () => {
    // Arrange -- ../configuration.mdx from docs/standards/ finds docs/configuration.mdx
    const target = '../configuration.mdx'
    const sourceFile = 'docs/standards/testing.mdx'

    // Act
    const result = resolveLink(target, sourceFile)

    // Assert
    expect(result).toBe(join(ROOT, 'docs/configuration.mdx'))
  })

  it('should return null for a non-existent file with extension', () => {
    // Arrange -- with extension, only exact match is tried (no .mdx/.md fallback)
    const target = 'nonexistent.mdx'
    const sourceFile = 'docs/configuration.mdx'

    // Act
    const result = resolveLink(target, sourceFile)

    // Assert
    expect(result).toBeNull()
  })
})

// ─── collectFiles ───────────────────────────────────────────────────────────
// Uses the mocked Glob from 'bun'. We control mockScanResultsByPattern to
// test the sorting and SKIP_DIRS filtering logic inside collectFiles.
// SCAN_PATTERNS = ['docs/**/*.mdx', 'docs/**/*.md', '*.md']

describe('collectFiles', () => {
  beforeEach(() => {
    // Reset all pattern results before each test
    const map = getMockMap()
    for (const key of Object.keys(map)) {
      delete map[key]
    }
  })

  it('should return a sorted array of files', async () => {
    // Arrange -- unsorted results from the mdx glob pattern
    const map = getMockMap()
    map['docs/**/*.mdx'] = ['docs/z-file.mdx', 'docs/a-file.mdx', 'docs/m-file.mdx']

    // Act
    const files = await collectFiles()

    // Assert
    expect(files).toEqual(['docs/a-file.mdx', 'docs/m-file.mdx', 'docs/z-file.mdx'])
  })

  it('should collect files from multiple scan patterns', async () => {
    // Arrange
    const map = getMockMap()
    map['docs/**/*.mdx'] = ['docs/guide.mdx']
    map['docs/**/*.md'] = ['docs/notes.md']
    map['*.md'] = ['README.md']

    // Act
    const files = await collectFiles()

    // Assert
    expect(files).toEqual(['README.md', 'docs/guide.mdx', 'docs/notes.md'])
  })

  it('should exclude files from analyses/ directory', async () => {
    // Arrange
    const map = getMockMap()
    map['docs/**/*.mdx'] = ['docs/guide.mdx']
    map['*.md'] = ['analyses/some-analysis.mdx']

    // Act
    const files = await collectFiles()

    // Assert
    expect(files).toEqual(['docs/guide.mdx'])
  })

  it('should exclude files from specs/ directory', async () => {
    // Arrange
    const map = getMockMap()
    map['docs/**/*.mdx'] = ['docs/guide.mdx']
    map['*.md'] = ['specs/feature-spec.mdx']

    // Act
    const files = await collectFiles()

    // Assert
    expect(files).toEqual(['docs/guide.mdx'])
  })

  it('should exclude files from node_modules/ directory', async () => {
    // Arrange
    const map = getMockMap()
    map['docs/**/*.mdx'] = ['docs/guide.mdx']
    map['docs/**/*.md'] = ['node_modules/pkg/README.md']

    // Act
    const files = await collectFiles()

    // Assert
    expect(files).toEqual(['docs/guide.mdx'])
  })

  it('should exclude files from nested excluded directories', async () => {
    // Arrange -- e.g. docs/node_modules/ or some/specs/
    const map = getMockMap()
    map['docs/**/*.mdx'] = ['docs/guide.mdx']
    map['docs/**/*.md'] = ['docs/node_modules/pkg/README.md', 'some/specs/thing.md']

    // Act
    const files = await collectFiles()

    // Assert
    expect(files).toEqual(['docs/guide.mdx'])
  })

  it('should return an empty array when no files match', async () => {
    // Arrange -- no patterns produce results

    // Act
    const files = await collectFiles()

    // Assert
    expect(files).toEqual([])
  })
})
