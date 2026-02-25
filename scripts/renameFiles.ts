#!/usr/bin/env bun
/**
 * File Rename Script — kebab-case to camelCase/PascalCase
 *
 * Renames all kebab-case `.ts`/`.tsx` files to the appropriate naming convention
 * and updates all import references across the codebase.
 *
 * Naming rules:
 * - PascalCase for `.tsx` files under any `components/` directory
 * - camelCase for everything else
 * - Multi-dot files: only the base (first segment before first dot) is renamed
 *
 * Run with: bun run scripts/rename-files.ts
 * Dry run:  bun run scripts/rename-files.ts --dry-run
 *
 * Exit codes:
 * - 0: All renames and import updates completed successfully
 * - 1: Stale references found after rename
 */

import { readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join, relative } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const DRY_RUN = process.argv.includes('--dry-run')

// ---------------------------------------------------------------------------
// Conversion helpers
// ---------------------------------------------------------------------------

function kebabToCamelCase(s: string): string {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

function kebabToPascalCase(s: string): string {
  const camel = kebabToCamelCase(s)
  return camel.charAt(0).toUpperCase() + camel.slice(1)
}

/**
 * Returns true if the file path matches `** /components/**` (any depth).
 * Works on forward-slash-normalized paths.
 */
function isInComponentsDir(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/')
  return normalized.includes('/components/')
}

/**
 * Extract the base name (first segment before the first dot) from a filename.
 * e.g. `admin-users.service.ts` -> `admin-users`
 */
function getBaseName(filename: string): string {
  const firstDot = filename.indexOf('.')
  return firstDot === -1 ? filename : filename.slice(0, firstDot)
}

/**
 * Get the stem (filename without the final .ts/.tsx extension) for import matching.
 * e.g. `admin-users.service.ts` -> `admin-users.service`
 */
function getStem(filename: string): string {
  if (filename.endsWith('.tsx')) return filename.slice(0, -4)
  if (filename.endsWith('.ts')) return filename.slice(0, -3)
  return filename
}

// ---------------------------------------------------------------------------
// Phase 1 — Discovery
// ---------------------------------------------------------------------------

type RenameEntry = {
  oldPath: string
  newPath: string
  oldStem: string
  newStem: string
  oldBaseName: string
}

const SCAN_DIRS = [
  'apps/web/src',
  'apps/api/src',
  'apps/api/scripts',
  'packages/ui/src',
  'packages/email',
  'scripts',
]

const SKIP_PATTERNS = ['node_modules', 'dist', '.turbo', '/routes/', '.source', 'routeTree.gen.ts']

function shouldSkip(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/')
  return SKIP_PATTERNS.some((pattern) => normalized.includes(pattern))
}

async function discoverFiles(): Promise<RenameEntry[]> {
  const entries: RenameEntry[] = []
  const glob = new Bun.Glob('**/*.{ts,tsx}')

  for (const scanDir of SCAN_DIRS) {
    const absDir = join(ROOT, scanDir)

    for await (const match of glob.scan({ cwd: absDir, absolute: false })) {
      const absPath = join(absDir, match)
      const relFromRoot = relative(ROOT, absPath)

      if (shouldSkip(relFromRoot)) continue

      const filename = basename(absPath)
      const baseName = getBaseName(filename)

      // Only process files whose base name contains a hyphen
      if (!baseName.includes('-')) continue

      // Determine the new base name based on convention
      const usePascal = filename.endsWith('.tsx') && isInComponentsDir(absPath)
      const newBaseName = usePascal ? kebabToPascalCase(baseName) : kebabToCamelCase(baseName)

      // Build the new filename by replacing the base portion
      const newFilename = newBaseName + filename.slice(baseName.length)
      const newPath = join(dirname(absPath), newFilename)

      const oldStem = getStem(filename)
      const newStem = getStem(newFilename)

      entries.push({
        oldPath: absPath,
        newPath,
        oldStem,
        newStem,
        oldBaseName: baseName,
      })
    }
  }

  // Sort by longest base name first to avoid substring collisions in Phase 3
  entries.sort((a, b) => b.oldBaseName.length - a.oldBaseName.length)

  return entries
}

// ---------------------------------------------------------------------------
// Phase 2 — Rename (git mv)
// ---------------------------------------------------------------------------

async function renameFiles(entries: RenameEntry[]): Promise<void> {
  for (const entry of entries) {
    const relOld = relative(ROOT, entry.oldPath)
    const relNew = relative(ROOT, entry.newPath)

    if (DRY_RUN) {
      console.log(`  [dry-run] git mv ${relOld} -> ${relNew}`)
      continue
    }

    const proc = Bun.spawn(['git', 'mv', entry.oldPath, entry.newPath], {
      cwd: ROOT,
      stdout: 'pipe',
      stderr: 'pipe',
    })

    const exitCode = await proc.exited

    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text()
      console.error(`  ERROR: git mv failed for ${relOld}: ${stderr.trim()}`)
      process.exit(1)
    }

    console.log(`  renamed ${relOld} -> ${relNew}`)
  }
}

// ---------------------------------------------------------------------------
// Phase 3 — Import replacement
// ---------------------------------------------------------------------------

async function collectAllSourceFiles(): Promise<string[]> {
  const files: string[] = []
  const glob = new Bun.Glob('**/*.{ts,tsx}')

  for (const topDir of ['apps', 'packages', 'scripts']) {
    const absDir = join(ROOT, topDir)

    for await (const match of glob.scan({ cwd: absDir, absolute: false })) {
      const absPath = join(absDir, match)
      const normalized = absPath.replace(/\\/g, '/')

      if (normalized.includes('node_modules')) continue
      if (normalized.includes('dist')) continue
      if (normalized.includes('.turbo')) continue

      files.push(absPath)
    }
  }

  return files
}

async function updateImports(entries: RenameEntry[]): Promise<number> {
  const sourceFiles = await collectAllSourceFiles()
  let totalUpdated = 0

  for (const filePath of sourceFiles) {
    let content = await readFile(filePath, 'utf-8')
    let changed = false

    for (const entry of entries) {
      // Pattern: /<oldStem> followed by a quote character (' or ")
      // The / prefix prevents matching bare package imports
      // The quote right-anchor prevents substring collisions
      const patterns: [string, string][] = [
        [`/${entry.oldStem}'`, `/${entry.newStem}'`],
        [`/${entry.oldStem}"`, `/${entry.newStem}"`],
        // ESM .js extension variants (NestJS/Node ESM resolution)
        [`/${entry.oldStem}.js'`, `/${entry.newStem}.js'`],
        [`/${entry.oldStem}.js"`, `/${entry.newStem}.js"`],
        // JSX extension variants
        [`/${entry.oldStem}.jsx'`, `/${entry.newStem}.jsx'`],
        [`/${entry.oldStem}.jsx"`, `/${entry.newStem}.jsx"`],
      ]

      for (const [pattern, replacement] of patterns) {
        if (content.includes(pattern)) {
          content = content.replaceAll(pattern, replacement)
          changed = true
        }
      }
    }

    if (changed) {
      if (DRY_RUN) {
        console.log(`  [dry-run] would update imports in ${relative(ROOT, filePath)}`)
      } else {
        await writeFile(filePath, content, 'utf-8')
        console.log(`  updated imports in ${relative(ROOT, filePath)}`)
      }
      totalUpdated++
    }
  }

  return totalUpdated
}

// ---------------------------------------------------------------------------
// Phase 4 — Verification
// ---------------------------------------------------------------------------

async function verify(entries: RenameEntry[]): Promise<number> {
  const sourceFiles = await collectAllSourceFiles()
  let staleCount = 0

  // Suffixes that indicate a real import reference when following /<oldStem>
  const QUOTE_SUFFIXES = ["'", '"']
  const EXT_SUFFIXES = [".js'", '.js"', ".jsx'", '.jsx"']

  for (const entry of entries) {
    const searchPattern = `/${entry.oldStem}`

    for (const filePath of sourceFiles) {
      const content = await readFile(filePath, 'utf-8')

      if (content.includes(searchPattern)) {
        // Check every occurrence in the file
        let idx = content.indexOf(searchPattern)
        while (idx !== -1) {
          const after = content.slice(idx + searchPattern.length, idx + searchPattern.length + 5)
          const isStale =
            QUOTE_SUFFIXES.some((s) => after.startsWith(s)) ||
            EXT_SUFFIXES.some((s) => after.startsWith(s))

          if (isStale) {
            console.warn(`  STALE: ${relative(ROOT, filePath)} still references "${entry.oldStem}"`)
            staleCount++
            break // One report per file per entry is enough
          }

          idx = content.indexOf(searchPattern, idx + 1)
        }
      }
    }
  }

  return staleCount
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(DRY_RUN ? 'File Rename Script (DRY RUN)\n' : 'File Rename Script\n')

  // Phase 1 — Discovery
  console.log('Phase 1: Discovering kebab-case files...')
  const entries = await discoverFiles()
  console.log(`  Found ${entries.length} files to rename\n`)

  if (entries.length === 0) {
    console.log('Nothing to rename. Done.')
    process.exit(0)
  }

  for (const entry of entries) {
    const relOld = relative(ROOT, entry.oldPath)
    const relNew = relative(ROOT, entry.newPath)
    console.log(`  ${relOld} -> ${relNew}`)
  }
  console.log()

  // Phase 2 — Rename
  console.log('Phase 2: Renaming files...')
  await renameFiles(entries)
  console.log()

  // Phase 3 — Import replacement
  console.log('Phase 3: Updating import references...')
  const updatedFiles = await updateImports(entries)
  console.log(`  Updated ${updatedFiles} files\n`)

  // Phase 4 — Verification
  console.log('Phase 4: Verifying no stale references remain...')
  const staleCount = await verify(entries)

  console.log()
  console.log('--- Summary ---')
  console.log(`  Files renamed:     ${entries.length}`)
  console.log(`  Imports updated:   ${updatedFiles} files`)
  console.log(`  Stale references:  ${staleCount}`)

  if (staleCount > 0) {
    console.error('\nVerification failed: stale references found. Fix them manually.')
    process.exit(1)
  }

  console.log('\nDone!')
  process.exit(0)
}

main().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
