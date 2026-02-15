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

/** Prefix for client-side environment variables exposed by Vite. */
// biome-ignore lint/correctness/noUnusedVariables: documentation constant for future use
const CLIENT_ENV_PREFIX = 'VITE_'

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

/** Check that the vite.config.ts inline schema matches clientEnvSchema. */
async function checkViteConfigDrift(clientSchemaKeys: string[]): Promise<{ errors: string[] }> {
  const errors: string[] = []
  const viteConfigPath = join(ROOT, 'apps/web/vite.config.ts')
  const viteConfigContent = await readFile(viteConfigPath, 'utf-8')

  const viteSchemaMatch = viteConfigContent.match(/const schema = z\.object\(\{([^}]+)\}\)/)
  if (!viteSchemaMatch) {
    console.warn('WARN: Could not find inline schema in vite.config.ts — skipping drift check')
    return { errors }
  }

  const viteKeys = new Set([...viteSchemaMatch[1].matchAll(/(\w+)\s*:/g)].map((m) => m[1]))
  const clientKeys = new Set(clientSchemaKeys)

  for (const key of clientKeys) {
    if (!viteKeys.has(key)) {
      errors.push(`${key} is in clientEnvSchema but missing from vite.config.ts inline schema`)
    }
  }
  for (const key of viteKeys) {
    if (!clientKeys.has(key)) {
      errors.push(`${key} is in vite.config.ts inline schema but missing from clientEnvSchema`)
    }
  }

  return { errors }
}

async function main() {
  console.log('Checking env schema sync with .env.example...\n')

  const { envSchema: apiEnvSchema } = await import('../apps/api/src/config/env.validation')
  const { envSchema: webServerEnvSchema } = await import('../apps/web/src/lib/env.server.schema')
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

  // Check vite.config.ts inline schema drift
  const viteDrift = await checkViteConfigDrift(schemaKeys(webClientEnvSchema))
  for (const error of viteDrift.errors) {
    console.error(`ERROR: ${error}`)
    hasErrors = true
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
