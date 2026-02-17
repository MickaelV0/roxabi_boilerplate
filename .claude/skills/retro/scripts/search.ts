#!/usr/bin/env bun

/**
 * Hybrid semantic search across findings.
 *
 * Combines vector search (0.7 weight) with BM25 (0.3 weight) using RRF fusion.
 * Returns top 20 results with content, type, severity, tags, session info.
 *
 * Usage:
 *   bun run .claude/skills/retro/scripts/search.ts "authentication"
 *   bun run .claude/skills/retro/scripts/search.ts "auth" --type blocker
 */

import { getDatabase } from '../lib/db'
import { embed, initEmbedder } from '../lib/embedder'
import type { SearchResult } from '../lib/hybrid-search'
import { hybridSearch } from '../lib/hybrid-search'

type FindingType = 'praise' | 'blocker' | 'suggestion' | 'nitpick'

const VALID_TYPES = new Set<string>(['praise', 'blocker', 'suggestion', 'nitpick'])

function parseArgs(args: string[]): { query: string; typeFilter: FindingType | undefined } {
  if (args.length === 0) {
    console.error('Usage: search.ts <query> [--type blocker|praise|suggestion|nitpick]')
    process.exit(1)
  }

  const query = args[0]
  const typeIdx = args.indexOf('--type')
  const typeFilter = typeIdx !== -1 ? args[typeIdx + 1] : undefined

  if (typeFilter && !VALID_TYPES.has(typeFilter)) {
    console.error(
      `Invalid type: ${typeFilter}. Must be one of: praise, blocker, suggestion, nitpick`
    )
    process.exit(1)
  }

  return { query, typeFilter: typeFilter as FindingType | undefined }
}

function formatResult(result: SearchResult): void {
  const tags = result.finding.tags ? JSON.parse(result.finding.tags).join(', ') : 'none'
  console.log(`\n[${result.finding.type}] (${result.finding.severity}) ${result.finding.content}`)
  console.log(`  Tags: ${tags}`)
  console.log(
    `  Session: ${result.finding.session_id} | ${result.finding.session_timestamp || 'unknown date'}`
  )
  if (result.finding.context) {
    const ctx =
      result.finding.context.length > 120
        ? `${result.finding.context.substring(0, 120)}...`
        : result.finding.context
    console.log(`  Context: ${ctx}`)
  }
}

async function main(): Promise<void> {
  const { query, typeFilter } = parseArgs(process.argv.slice(2))

  console.log(`Searching for: "${query}"${typeFilter ? ` (type: ${typeFilter})` : ''}...`)

  const db = getDatabase()
  try {
    await initEmbedder()
    const queryEmbedding = await embed(query)

    const results = hybridSearch(db, queryEmbedding, query, typeFilter)

    if (results.length === 0) {
      console.log('No findings match your query.')
      return
    }

    for (const result of results) {
      formatResult(result)
    }
    console.log(`\n${results.length} result(s) found.`)
  } finally {
    db.close()
  }
}

main().catch((err) => {
  console.error('Search failed:', err.message)
  process.exit(1)
})
