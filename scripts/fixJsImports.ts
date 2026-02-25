#!/usr/bin/env bun
/**
 * One-time fix script for stale .js/.jsx extension imports after file renames.
 *
 * The rename script (renameFiles.ts) updated bare imports but missed imports
 * that use ESM .js extensions (e.g., `from './apiKey.service.js'`).
 *
 * This script reads the rename map from `git diff --name-status HEAD --diff-filter=R`,
 * computes old/new stems, and performs the replacement across all source files.
 *
 * Run with: bun run scripts/fixJsImports.ts
 * Dry run:  bun run scripts/fixJsImports.ts --dry-run
 */

import { readFile, writeFile } from 'node:fs/promises'
import { basename, join, relative } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const DRY_RUN = process.argv.includes('--dry-run')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
// Step 1 — Parse rename map from git
// ---------------------------------------------------------------------------

type RenameEntry = {
  oldStem: string
  newStem: string
}

async function parseRenameMap(): Promise<RenameEntry[]> {
  const proc = Bun.spawn(['git', 'diff', '--name-status', 'HEAD', '--diff-filter=R'], {
    cwd: ROOT,
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const stdout = await new Response(proc.stdout).text()
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text()
    console.error(`git diff failed: ${stderr.trim()}`)
    process.exit(1)
  }

  const entries: RenameEntry[] = []

  for (const line of stdout.trim().split('\n')) {
    if (!line) continue

    // Format: R100\told/path\tnew/path  (tab-separated)
    const parts = line.split('\t')
    if (parts.length < 3) continue

    const oldPath = parts[1]
    const newPath = parts[2]
    const oldFilename = basename(oldPath)
    const newFilename = basename(newPath)
    const oldStem = getStem(oldFilename)
    const newStem = getStem(newFilename)

    // Only include entries where stems actually differ
    if (oldStem !== newStem) {
      entries.push({ oldStem, newStem })
    }
  }

  // Sort by longest stem first to avoid substring collisions
  entries.sort((a, b) => b.oldStem.length - a.oldStem.length)

  return entries
}

// ---------------------------------------------------------------------------
// Step 2 — Collect all source files
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

// ---------------------------------------------------------------------------
// Step 3 — Fix imports
// ---------------------------------------------------------------------------

async function fixImports(
  entries: RenameEntry[]
): Promise<{ updated: number; replacements: number }> {
  const sourceFiles = await collectAllSourceFiles()
  let totalUpdated = 0
  let totalReplacements = 0

  for (const filePath of sourceFiles) {
    let content = await readFile(filePath, 'utf-8')
    let changed = false

    for (const entry of entries) {
      // Only fix .js and .jsx extension variants
      const patterns: [string, string][] = [
        [`/${entry.oldStem}.js'`, `/${entry.newStem}.js'`],
        [`/${entry.oldStem}.js"`, `/${entry.newStem}.js"`],
        [`/${entry.oldStem}.jsx'`, `/${entry.newStem}.jsx'`],
        [`/${entry.oldStem}.jsx"`, `/${entry.newStem}.jsx"`],
      ]

      for (const [pattern, replacement] of patterns) {
        if (content.includes(pattern)) {
          const count = content.split(pattern).length - 1
          content = content.replaceAll(pattern, replacement)
          changed = true
          totalReplacements += count
        }
      }
    }

    if (changed) {
      if (DRY_RUN) {
        console.log(`  [dry-run] would update: ${relative(ROOT, filePath)}`)
      } else {
        await writeFile(filePath, content, 'utf-8')
        console.log(`  updated: ${relative(ROOT, filePath)}`)
      }
      totalUpdated++
    }
  }

  return { updated: totalUpdated, replacements: totalReplacements }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(DRY_RUN ? 'Fix .js Extension Imports (DRY RUN)\n' : 'Fix .js Extension Imports\n')

  // Step 1 — Parse rename map
  console.log('Step 1: Reading rename map from git...')
  const entries = await parseRenameMap()
  console.log(`  Found ${entries.length} rename entries\n`)

  if (entries.length === 0) {
    console.log('No renames found. Nothing to fix.')
    process.exit(0)
  }

  // Step 2 — Fix imports
  console.log('Step 2: Fixing .js/.jsx extension imports...')
  const { updated, replacements } = await fixImports(entries)

  // Summary
  console.log()
  console.log('--- Summary ---')
  console.log(`  Rename entries:      ${entries.length}`)
  console.log(`  Files updated:       ${updated}`)
  console.log(`  Total replacements:  ${replacements}`)

  console.log('\nDone!')
  process.exit(0)
}

main().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
