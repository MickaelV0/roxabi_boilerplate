#!/usr/bin/env bun
/**
 * Phase 3: Trend report generation from findings data.
 *
 * Generates markdown reports with blocker trends, improvements,
 * regressions, suggestions, and process evolution metrics.
 * Zero AI cost — database queries only.
 *
 * Usage:
 *   bun run .claude/skills/retro/scripts/recap.ts
 *   bun run .claude/skills/retro/scripts/recap.ts --period weekly
 *   bun run .claude/skills/retro/scripts/recap.ts --period monthly
 */

import type { Database } from 'bun:sqlite'
import { getDatabase } from '../lib/db'

interface TypeCount {
  type: string
  count: number
}

interface BlockerEntry {
  tags: string | null
  content: string
  count: number
}

interface PraiseEntry {
  content: string
  tags: string | null
  session_timestamp: string | null
}

interface SuggestionEntry {
  content: string
  tags: string | null
  count: number
}

interface WindowTag {
  tags: string | null
}

/**
 * Query findings grouped by type within the period.
 */
function querySummary(db: Database, days: number): TypeCount[] {
  const stmt = db.prepare(`
    SELECT type, COUNT(*) as count FROM findings
    WHERE session_timestamp >= datetime('now', '-' || ? || ' days')
    GROUP BY type
  `)
  return stmt.all(String(days)) as TypeCount[]
}

/**
 * Query top blockers by tag frequency.
 */
function queryTopBlockers(db: Database, days: number): BlockerEntry[] {
  const stmt = db.prepare(`
    SELECT tags, content, COUNT(*) as count FROM findings
    WHERE type = 'blocker' AND session_timestamp >= datetime('now', '-' || ? || ' days')
    GROUP BY tags
    ORDER BY count DESC
    LIMIT 10
  `)
  return stmt.all(String(days)) as BlockerEntry[]
}

/**
 * Query recent praise (last 7 days).
 */
function queryRecentPraise(db: Database): PraiseEntry[] {
  const stmt = db.prepare(`
    SELECT content, tags, session_timestamp FROM findings
    WHERE type = 'praise' AND session_timestamp >= datetime('now', '-7 days')
    ORDER BY session_timestamp DESC
    LIMIT 10
  `)
  return stmt.all() as PraiseEntry[]
}

/**
 * Query top suggestions by frequency.
 */
function queryTopSuggestions(db: Database, days: number): SuggestionEntry[] {
  const stmt = db.prepare(`
    SELECT content, tags, COUNT(*) as count FROM findings
    WHERE type = 'suggestion' AND session_timestamp >= datetime('now', '-' || ? || ' days')
    GROUP BY content
    ORDER BY count DESC
    LIMIT 10
  `)
  return stmt.all(String(days)) as SuggestionEntry[]
}

/**
 * Detect regressions: blockers that appeared, disappeared, then reappeared.
 * Splits the period into 3 equal windows and checks tag presence.
 */
function detectRegressions(db: Database, days: number): string[] {
  const windowSize = Math.floor(days / 3)

  // Window 1: oldest third (days ago to 2/3 days ago)
  const w1Start = String(days)
  const w1End = String(days - windowSize)

  // Window 2: middle third
  const w2Start = String(days - windowSize)
  const w2End = String(days - windowSize * 2)

  // Window 3: most recent third
  const w3Start = String(days - windowSize * 2)

  const queryWindow = (startDaysAgo: string, endDaysAgo: string): Set<string> => {
    const stmt = db.prepare(`
      SELECT DISTINCT tags FROM findings
      WHERE type = 'blocker'
        AND session_timestamp >= datetime('now', '-' || ? || ' days')
        AND session_timestamp < datetime('now', '-' || ? || ' days')
    `)
    const rows = stmt.all(startDaysAgo, endDaysAgo) as WindowTag[]
    const tagSet = new Set<string>()
    for (const row of rows) {
      if (row.tags) {
        try {
          const parsed = JSON.parse(row.tags) as string[]
          for (const tag of parsed) {
            tagSet.add(tag)
          }
        } catch {
          tagSet.add(row.tags)
        }
      }
    }
    return tagSet
  }

  // Query the most recent window slightly differently (up to now)
  const queryRecentWindow = (startDaysAgo: string): Set<string> => {
    const stmt = db.prepare(`
      SELECT DISTINCT tags FROM findings
      WHERE type = 'blocker'
        AND session_timestamp >= datetime('now', '-' || ? || ' days')
    `)
    const rows = stmt.all(startDaysAgo) as WindowTag[]
    const tagSet = new Set<string>()
    for (const row of rows) {
      if (row.tags) {
        try {
          const parsed = JSON.parse(row.tags) as string[]
          for (const tag of parsed) {
            tagSet.add(tag)
          }
        } catch {
          tagSet.add(row.tags)
        }
      }
    }
    return tagSet
  }

  const window1Tags = queryWindow(w1Start, w1End)
  const window2Tags = queryWindow(w2Start, w2End)
  const window3Tags = queryRecentWindow(w3Start)

  // A regression = tag present in window 1, absent in window 2, present in window 3
  const regressions: string[] = []
  for (const tag of window1Tags) {
    if (!window2Tags.has(tag) && window3Tags.has(tag)) {
      regressions.push(tag)
    }
  }

  return regressions
}

/**
 * Compare finding distribution between first and second half of the period.
 */
function queryProcessEvolution(db: Database, days: number): string {
  const halfDays = Math.floor(days / 2)

  const firstHalfStmt = db.prepare(`
    SELECT type, COUNT(*) as count FROM findings
    WHERE session_timestamp >= datetime('now', '-' || ? || ' days')
      AND session_timestamp < datetime('now', '-' || ? || ' days')
    GROUP BY type
  `)
  const firstHalf = firstHalfStmt.all(String(days), String(halfDays)) as TypeCount[]

  const secondHalfStmt = db.prepare(`
    SELECT type, COUNT(*) as count FROM findings
    WHERE session_timestamp >= datetime('now', '-' || ? || ' days')
    GROUP BY type
  `)
  const secondHalf = secondHalfStmt.all(String(halfDays)) as TypeCount[]

  const firstMap = new Map<string, number>()
  for (const row of firstHalf) {
    firstMap.set(row.type, row.count)
  }

  const secondMap = new Map<string, number>()
  for (const row of secondHalf) {
    secondMap.set(row.type, row.count)
  }

  const allTypes = new Set([...firstMap.keys(), ...secondMap.keys()])
  const lines: string[] = []

  for (const type of allTypes) {
    const first = firstMap.get(type) || 0
    const second = secondMap.get(type) || 0
    const diff = second - first
    const arrow = diff > 0 ? `+${diff} increase` : diff < 0 ? `${diff} decrease` : 'no change'
    lines.push(`- **${type}**: ${first} (first half) → ${second} (second half) — ${arrow}`)
  }

  if (lines.length === 0) {
    return 'No findings in this period to compare.'
  }

  return lines.join('\n')
}

/**
 * Parse a JSON tags string safely, returning the raw string on failure.
 */
function parseTags(tags: string | null, fallback: string): string {
  if (!tags) return fallback
  try {
    return (JSON.parse(tags) as string[]).join(', ')
  } catch {
    return tags
  }
}

/**
 * Format the summary table section.
 */
function formatSummarySection(summary: TypeCount[]): string {
  const summaryMap = new Map<string, number>()
  let total = 0
  for (const row of summary) {
    summaryMap.set(row.type, row.count)
    total += row.count
  }
  const getCount = (type: string): number => summaryMap.get(type) || 0

  let md = '## Summary\n'
  md += '| Type | Count |\n'
  md += '|------|-------|\n'
  md += `| Praise | ${getCount('praise')} |\n`
  md += `| Blocker | ${getCount('blocker')} |\n`
  md += `| Suggestion | ${getCount('suggestion')} |\n`
  md += `| Nitpick | ${getCount('nitpick')} |\n`
  md += `| **Total** | **${total}** |\n\n`
  return md
}

/**
 * Format the top blockers section.
 */
function formatBlockersSection(blockers: BlockerEntry[]): string {
  let md = '## Top Blockers\n'
  if (blockers.length === 0) return `${md}No blockers in this period.\n\n`

  for (let i = 0; i < blockers.length; i++) {
    const b = blockers[i]
    const tagLabel = parseTags(b.tags, 'untagged')
    const sample = b.content.length > 100 ? `${b.content.substring(0, 100)}...` : b.content
    md += `${i + 1}. **${tagLabel}** (${b.count}x) — ${sample}\n`
  }
  return `${md}\n`
}

/**
 * Format the recent improvements (praise) section.
 */
function formatPraiseSection(praise: PraiseEntry[]): string {
  let md = '## Recent Improvements (last 7 days)\n'
  if (praise.length === 0) return `${md}No praise recorded in the last 7 days.\n\n`

  for (const p of praise) {
    const tagSuffix = p.tags ? ` (${parseTags(p.tags, '')})` : ''
    md += `- ${p.content}${tagSuffix}\n`
  }
  return `${md}\n`
}

/**
 * Format the regressions section.
 */
function formatRegressionsSection(regressions: string[]): string {
  let md = '## Regressions\n'
  if (regressions.length === 0) return `${md}No regressions detected.\n\n`

  for (const tag of regressions) {
    md += `- **${tag}** reappeared after being absent\n`
  }
  return `${md}\n`
}

/**
 * Format the top suggestions section.
 */
function formatSuggestionsSection(suggestions: SuggestionEntry[]): string {
  let md = '## Top Suggestions\n'
  if (suggestions.length === 0) return `${md}No suggestions in this period.\n\n`

  for (let i = 0; i < suggestions.length; i++) {
    const s = suggestions[i]
    md += `${i + 1}. ${s.content} (${s.count}x)\n`
  }
  return `${md}\n`
}

/**
 * Format the full recap as markdown.
 */
function formatRecap(
  period: string,
  days: number,
  summary: TypeCount[],
  blockers: BlockerEntry[],
  praise: PraiseEntry[],
  regressions: string[],
  suggestions: SuggestionEntry[],
  evolution: string
): string {
  let md = `# Retro Recap — ${period} (${days} days)\n\n`
  md += formatSummarySection(summary)
  md += formatBlockersSection(blockers)
  md += formatPraiseSection(praise)
  md += formatRegressionsSection(regressions)
  md += formatSuggestionsSection(suggestions)
  md += '## Process Evolution\n'
  md += `${evolution}\n`
  return md
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  const periodIdx = args.indexOf('--period')
  const period = periodIdx !== -1 ? args[periodIdx + 1] : 'monthly'

  const days = period === 'weekly' ? 7 : 30

  console.log(`Generating ${period} recap (last ${days} days)...`)

  const db = getDatabase()
  try {
    const summary = querySummary(db, days)
    const blockers = queryTopBlockers(db, days)
    const praise = queryRecentPraise(db)
    const suggestions = queryTopSuggestions(db, days)
    const regressions = detectRegressions(db, days)
    const evolution = queryProcessEvolution(db, days)

    const report = formatRecap(
      period,
      days,
      summary,
      blockers,
      praise,
      regressions,
      suggestions,
      evolution
    )
    console.log(report)
  } finally {
    db.close()
  }
}

main().catch((err) => {
  console.error('Recap failed:', err.message)
  process.exit(1)
})
