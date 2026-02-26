/**
 * Utilities for parsing unified diff output.
 * Used by postInlineComments.ts and resolveThreads.ts.
 */

export interface DiffPosition {
  path: string
  line: number
  side: 'RIGHT' | 'LEFT'
}

/**
 * Parse unified diff hunk headers to build a map of "file:line" → DiffPosition.
 * Only lines present in the diff (added/context lines on RIGHT side) are included.
 */
export function buildPositionMap(diff: string): Map<string, DiffPosition> {
  const map = new Map<string, DiffPosition>()
  let currentFile = ''
  let newLine = 0

  for (const raw of diff.split('\n')) {
    const fileMatch = raw.match(/^\+\+\+ b\/(.+)$/)
    if (fileMatch) {
      currentFile = fileMatch[1]
      continue
    }
    const hunkMatch = raw.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
    if (hunkMatch) {
      newLine = parseInt(hunkMatch[1], 10) - 1
      continue
    }
    if (!currentFile) continue
    if (raw.startsWith('\\')) continue // "\ No newline at end of file"
    if (raw.startsWith('-')) continue // removed line — not a valid comment target
    if (raw.startsWith('+') || raw.startsWith(' ')) {
      newLine++
      map.set(`${currentFile}:${newLine}`, { path: currentFile, line: newLine, side: 'RIGHT' })
    }
  }

  return map
}

/**
 * Returns the set of file paths touched (modified) in the diff.
 * A file is "touched" if it appears in a `+++ b/...` header line.
 */
export function getTouchedFiles(diff: string): Set<string> {
  const files = new Set<string>()
  for (const line of diff.split('\n')) {
    const m = line.match(/^\+\+\+ b\/(.+)$/)
    if (m) files.add(m[1])
  }
  return files
}
