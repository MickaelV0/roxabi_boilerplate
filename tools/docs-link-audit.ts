/**
 * Docs Link Audit — Fumadocs-aware internal link checker
 *
 * Scans docs/**\/*.mdx, docs/**\/*.md, and root *.md files for markdown links,
 * then resolves them using Fumadocs conventions (extensionless links that map
 * to .mdx/.md files or index files in directories).
 *
 * Exit codes:
 *   0 — all internal links resolve
 *   2 — broken links found (matches lychee convention)
 *
 * Usage:
 *   bun run tools/docs-link-audit.ts
 */

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { Glob } from 'bun'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Repository root — all paths are resolved relative to this. */
const ROOT = resolve(import.meta.dirname, '..')

/** Glob patterns for files to scan. */
const SCAN_PATTERNS = ['docs/**/*.mdx', 'docs/**/*.md', '*.md']

/** Directories to skip entirely (internal-only docs). */
const SKIP_DIRS = ['analyses', 'specs', 'node_modules', '.turbo']

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BrokenLink {
  file: string
  line: number
  target: string
  reason: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Collect all files matching the scan patterns, excluding SKIP_DIRS.
 */
export async function collectFiles(): Promise<string[]> {
  const files: string[] = []

  for (const pattern of SCAN_PATTERNS) {
    const glob = new Glob(pattern)
    for await (const match of glob.scan({ cwd: ROOT, absolute: false })) {
      // Skip files inside excluded directories
      const shouldSkip = SKIP_DIRS.some(
        (dir) => match.startsWith(`${dir}/`) || match.includes(`/${dir}/`)
      )
      if (!shouldSkip) {
        files.push(match)
      }
    }
  }

  return files.sort()
}

/**
 * Extract markdown links from file content, returning the link target and
 * its 1-based line number.
 *
 * Matches standard markdown link syntax: [text](target)
 */
export function extractLinks(content: string): Array<{ target: string; line: number }> {
  const links: Array<{ target: string; line: number }> = []
  const lines = content.split('\n')

  // Regex for inline markdown links: [text](url)
  const linkRegex = /\[(?:[^\]\\]|\\.)*\]\(([^)]+)\)/g

  for (let i = 0; i < lines.length; i++) {
    const lineContent = lines[i]

    linkRegex.lastIndex = 0
    for (
      let match = linkRegex.exec(lineContent);
      match !== null;
      match = linkRegex.exec(lineContent)
    ) {
      // The captured group is the raw URL (may include title after a space)
      const rawTarget = match[1].split(/\s+/)[0].trim()
      if (rawTarget) {
        links.push({ target: rawTarget, line: i + 1 })
      }
    }
  }

  return links
}

/**
 * Filter out code-fenced regions from link results.
 * Returns only links that are NOT inside fenced code blocks.
 */
export function filterCodeBlocks(
  content: string,
  links: Array<{ target: string; line: number }>
): Array<{ target: string; line: number }> {
  const lines = content.split('\n')
  const inCodeBlock = new Set<number>()

  let insideFence = false
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart()
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      insideFence = !insideFence
      inCodeBlock.add(i + 1) // Mark fence line itself
      continue
    }
    if (insideFence) {
      inCodeBlock.add(i + 1)
    }
  }

  return links.filter((link) => !inCodeBlock.has(link.line))
}

/**
 * Determine whether a link target is an internal link that we should check.
 * Returns false for external URLs, anchors, mailto, and other special schemes.
 */
export function isInternalLink(target: string): boolean {
  // External URLs
  if (/^https?:\/\//i.test(target)) return false
  // Mailto links
  if (/^mailto:/i.test(target)) return false
  // Anchor-only links
  if (target.startsWith('#')) return false
  // Data URIs, tel:, ftp:, etc.
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return false
  // Image/asset files (badges, logos, screenshots — not doc links)
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico)$/i.test(target.split('#')[0].split('?')[0])) return false

  return true
}

/**
 * Resolve an internal link target to a file on disk.
 *
 * Fumadocs conventions for extensionless links:
 *   1. Try exact path
 *   2. Try path.mdx, path.md
 *   3. Try path/index.mdx, path/index.md
 *
 * For links with extensions, try exact match only.
 *
 * Returns the resolved path if found, or null if broken.
 */
export function resolveLink(target: string, sourceFile: string): string | null {
  // Strip anchor fragment and query string for resolution
  const cleanTarget = target.split('#')[0].split('?')[0]

  // Empty target after stripping (was just an anchor)
  if (!cleanTarget) return '(anchor-only)'

  // Determine base directory for resolution
  let basePath: string

  if (cleanTarget.startsWith('/')) {
    // Root-relative: resolve from repo root
    basePath = join(ROOT, cleanTarget.slice(1))
  } else {
    // Relative: resolve from the directory of the source file
    basePath = join(ROOT, dirname(sourceFile), cleanTarget)
  }

  // Normalize the path (resolve .. and .)
  basePath = resolve(basePath)

  // If the path already has an extension, only check exact match
  const hasExtension = /\.\w+$/.test(cleanTarget)

  // Candidates to check, in order of priority
  const candidates = hasExtension
    ? [basePath]
    : [
        basePath, // exact path (could be a directory)
        `${basePath}.mdx`, // extensionless -> .mdx
        `${basePath}.md`, // extensionless -> .md
        join(basePath, 'index.mdx'), // directory -> index.mdx
        join(basePath, 'index.md'), // directory -> index.md
      ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('Docs Link Audit')
  console.log('================\n')

  const files = await collectFiles()
  console.log(`Scanning ${files.length} files...\n`)

  const brokenLinks: BrokenLink[] = []
  let totalLinks = 0
  let checkedLinks = 0

  for (const file of files) {
    const fullPath = join(ROOT, file)
    const content = await readFile(fullPath, 'utf-8')

    // Extract links and filter out those inside code blocks
    const rawLinks = extractLinks(content)
    const links = filterCodeBlocks(content, rawLinks)

    totalLinks += links.length

    for (const { target, line } of links) {
      if (!isInternalLink(target)) continue

      checkedLinks++
      const resolved = resolveLink(target, file)

      if (resolved === null) {
        brokenLinks.push({
          file,
          line,
          target,
          reason: 'File not found',
        })
      }
    }
  }

  // Report results
  console.log(`Total links found:      ${totalLinks}`)
  console.log(`Internal links checked: ${checkedLinks}`)
  console.log(`Broken links:           ${brokenLinks.length}\n`)

  if (brokenLinks.length > 0) {
    console.log('BROKEN LINKS')
    console.log('------------\n')

    for (const { file, line, target, reason } of brokenLinks) {
      console.log(`  ${file}:${line}`)
      console.log(`    -> ${target}`)
      console.log(`    ${reason}\n`)
    }

    // Exit code 2 matches lychee convention for broken links
    process.exit(2)
  }

  console.log('All internal links are valid.')
  process.exit(0)
}

// Guard: skip auto-execution when loaded as a module in tests
if (!process.env.VITEST) {
  main().catch((error) => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })
}
