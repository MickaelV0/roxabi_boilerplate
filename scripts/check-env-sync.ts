#!/usr/bin/env bun
/**
 * Env Sync Check Script
 *
 * Compares Zod env schemas (API, web server, web client) against .env.example
 * to ensure all declared env vars are documented and vice versa.
 *
 * Run with: bun run scripts/check-env-sync.ts
 *
 * Exit codes:
 * - 0: All schemas are in sync with .env.example
 * - 1: Missing or undocumented env vars found
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const ENV_EXAMPLE_PATH = join(ROOT, '.env.example')

/**
 * Keys that are tooling-only, platform-injected, or not expected in .env.example.
 * These are excluded from both "missing from .env.example" errors and
 * "not in any schema" warnings.
 */
const TOOLING_ALLOWLIST = new Set([
  'WEB_PORT',
  'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS',
  'GITHUB_TOKEN',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'VERCEL_ENV',
])

/** Parse .env.example: extract keys from both uncommented and commented lines. */
async function parseEnvExample(): Promise<Set<string>> {
  const content = await readFile(ENV_EXAMPLE_PATH, 'utf-8')
  const keys = new Set<string>()

  for (const raw of content.split('\n')) {
    let line = raw.trim()
    if (line === '' || line.startsWith('# =')) continue

    // Strip leading comment marker (e.g. "# GOOGLE_CLIENT_ID=" → "GOOGLE_CLIENT_ID=")
    if (line.startsWith('# ')) {
      line = line.slice(2)
    }

    const match = line.match(/^([A-Z][A-Z0-9_]*)=/)
    if (match) {
      keys.add(match[1])
    }
  }

  return keys
}

/** Collect keys from a Zod schema's shape object. */
function schemaKeys(schema: { shape: Record<string, unknown> }): string[] {
  return Object.keys(schema.shape)
}

async function main() {
  console.log('Checking env schema sync with .env.example...\n')

  // Set dummy env vars to prevent side-effect crashes on import.
  // env.server.ts parses process.env at module level; env.client.ts uses import.meta.env.
  process.env.API_URL = process.env.API_URL || 'http://localhost:4000'

  // Dynamic imports so dummy vars are set before module-level side effects run
  const { envSchema: apiEnvSchema } = await import('../apps/api/src/config/env.validation')
  const { envSchema: webServerEnvSchema } = await import('../apps/web/src/lib/env.server')
  const { clientEnvSchema: webClientEnvSchema } = await import('../apps/web/src/lib/env.client')

  const envExampleKeys = await parseEnvExample()

  const allSchemaKeys = new Set([
    ...schemaKeys(apiEnvSchema),
    ...schemaKeys(webServerEnvSchema),
    ...schemaKeys(webClientEnvSchema),
  ])

  let hasErrors = false

  // ERROR: schema key not documented in .env.example (and not allowlisted)
  for (const key of allSchemaKeys) {
    if (TOOLING_ALLOWLIST.has(key)) continue
    if (!envExampleKeys.has(key)) {
      console.error(`ERROR: ${key} is in a schema but missing from .env.example`)
      hasErrors = true
    }
  }

  // WARN: .env.example key not in any schema (and not allowlisted)
  for (const key of envExampleKeys) {
    if (TOOLING_ALLOWLIST.has(key)) continue
    if (!allSchemaKeys.has(key)) {
      console.warn(`WARN:  ${key} is in .env.example but not in any schema`)
    }
  }

  console.log()

  if (hasErrors) {
    console.error('Env sync check failed. Add missing keys to .env.example or the allowlist.')
    process.exit(1)
  }

  console.log('All env schemas are in sync with .env.example!')
  process.exit(0)
}

main().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
