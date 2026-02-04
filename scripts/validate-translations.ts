#!/usr/bin/env bun
/**
 * Translation Validation Script (Paraglide JS)
 *
 * Validates that all locale message files have consistent keys.
 * Reads the inlang project settings to discover locales and message paths.
 * Run with: bun run scripts/validate-translations.ts
 *
 * Exit codes:
 * - 0: All translations are valid
 * - 1: Missing or extra keys found
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const WEB_DIR = join(import.meta.dirname, '../apps/web')
const SETTINGS_PATH = join(WEB_DIR, 'project.inlang/settings.json')
const SCHEMA_KEY = '$schema'

type InlangSettings = {
  baseLocale: string
  locales: string[]
  'plugin.inlang.messageFormat': {
    pathPattern: string
  }
}

async function loadSettings(): Promise<InlangSettings> {
  const content = await readFile(SETTINGS_PATH, 'utf-8')
  return JSON.parse(content) as InlangSettings
}

async function loadMessages(messagePath: string): Promise<Record<string, string>> {
  const content = await readFile(messagePath, 'utf-8')
  const parsed = JSON.parse(content) as Record<string, string>
  // Remove $schema key from comparison
  const { [SCHEMA_KEY]: _, ...messages } = parsed
  return messages
}

function findDifferences(
  referenceKeys: string[],
  targetKeys: string[]
): { missing: string[]; extra: string[] } {
  const targetSet = new Set(targetKeys)
  const referenceSet = new Set(referenceKeys)

  return {
    missing: referenceKeys.filter((key) => !targetSet.has(key)),
    extra: targetKeys.filter((key) => !referenceSet.has(key)),
  }
}

async function main() {
  console.log('Validating translations...\n')

  const settings = await loadSettings()
  const { baseLocale, locales } = settings
  const pathPattern = settings['plugin.inlang.messageFormat'].pathPattern

  console.log(`Reference locale: ${baseLocale}`)
  console.log(`Locales: ${locales.join(', ')}\n`)

  const refPath = join(WEB_DIR, pathPattern.replace('{locale}', baseLocale))
  const refMessages = await loadMessages(refPath)
  const refKeys = Object.keys(refMessages).sort()

  console.log(`  ${baseLocale}: ${refKeys.length} keys (reference)\n`)

  let hasErrors = false

  for (const locale of locales) {
    if (locale === baseLocale) continue

    const localePath = join(WEB_DIR, pathPattern.replace('{locale}', locale))
    const localeMessages = await loadMessages(localePath)
    const localeKeys = Object.keys(localeMessages).sort()

    const { missing, extra } = findDifferences(refKeys, localeKeys)

    if (missing.length > 0) {
      console.error(`  ${locale}: Missing ${missing.length} keys:`)
      for (const key of missing) {
        console.error(`    - ${key}`)
      }
      hasErrors = true
    }

    if (extra.length > 0) {
      console.warn(`  ${locale}: Extra ${extra.length} keys (not in ${baseLocale}):`)
      for (const key of extra) {
        console.warn(`    - ${key}`)
      }
    }

    if (missing.length === 0 && extra.length === 0) {
      console.log(`  ${locale}: ${localeKeys.length} keys - all match`)
    }
  }

  console.log()

  if (hasErrors) {
    console.error('Validation failed. Fix the missing keys above.')
    process.exit(1)
  }

  console.log('All translations are valid!')
  process.exit(0)
}

main().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
