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
import { hybridSearch } from '../lib/hybrid-search'

// TODO: implement
// 1. Parse arguments: query string, optional --type filter
// 2. Get database connection
// 3. Initialize embedder
// 4. Generate embedding for query
// 5. Run hybridSearch()
// 6. Format and display results

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage: search.ts <query> [--type blocker|praise|suggestion|nitpick]')
    process.exit(1)
  }

  const query = args[0]
  const typeIdx = args.indexOf('--type')
  const typeFilter = typeIdx !== -1 ? args[typeIdx + 1] : undefined

  console.log(`Searching for: "${query}"${typeFilter ? ` (type: ${typeFilter})` : ''}...`)

  const db = getDatabase()
  try {
    await initEmbedder()
    const queryEmbedding = await embed(query)

    const results = hybridSearch(
      db,
      queryEmbedding,
      query,
      typeFilter as 'praise' | 'blocker' | 'suggestion' | 'nitpick' | undefined
    )

    if (results.length === 0) {
      console.log('No findings match your query.')
      return
    }

    // TODO: implement result formatting
    // [type] (severity) content
    //   Tags: tag1, tag2
    //   Session: id | date
    //   Context: snippet...
    for (const result of results) {
      console.log(`[${result.finding.type}] (${result.finding.severity}) ${result.finding.content}`)
    }
  } finally {
    db.close()
  }
}

main().catch((err) => {
  console.error('Search failed:', err.message)
  process.exit(1)
})
