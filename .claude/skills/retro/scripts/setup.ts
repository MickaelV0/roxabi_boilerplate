#!/usr/bin/env bun
/**
 * Phase 0: Setup script for the retro session intelligence database.
 *
 * Creates the data directory, initializes the SQLite database with sqlite-vec,
 * applies the schema, and pre-downloads the embedding model.
 *
 * Usage:
 *   bun run .claude/skills/retro/scripts/setup.ts
 */

import { initializeDatabase } from '../lib/db'
import { embed, initEmbedder } from '../lib/embedder'

async function main(): Promise<void> {
  const db = initializeDatabase()
  try {
    console.log('Phase 0: Setting up retro database...')

    await initEmbedder()

    const testEmbedding = await embed('test')
    if (!(testEmbedding instanceof Float32Array) || testEmbedding.length !== 384) {
      throw new Error(
        `Embedding validation failed: expected Float32Array of length 384, got ${testEmbedding.constructor.name} of length ${testEmbedding.length}`
      )
    }

    console.log('Setup complete. Run `/retro --parse` to import session transcripts.')
  } finally {
    db.close()
  }
}

main().catch((err) => {
  console.error('Setup failed:', err.message)
  process.exit(1)
})
