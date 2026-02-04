#!/usr/bin/env bun
/**
 * Translation Validation Script
 *
 * Validates that all locale files have consistent keys across languages.
 * Run with: bun run scripts/validate-translations.ts
 *
 * Exit codes:
 * - 0: All translations are valid
 * - 1: Missing or extra keys found
 */

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const LOCALES_DIR = join(import.meta.dirname, '../apps/web/src/locales')

type TranslationObject = Record<string, unknown>
type LocaleData = Record<string, Record<string, TranslationObject>>

/**
 * Recursively get all keys from a translation object
 * Returns dot-notation paths (e.g., "buttons.submit")
 */
function getKeys(obj: TranslationObject, prefix = ''): string[] {
  const keys: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getKeys(value as TranslationObject, fullKey))
    } else {
      keys.push(fullKey)
    }
  }

  return keys.sort()
}

/**
 * Compare two arrays and find differences
 */
function findDifferences(
  referenceKeys: string[],
  targetKeys: string[]
): { missing: string[]; extra: string[] } {
  const referenceSet = new Set(referenceKeys)
  const targetSet = new Set(targetKeys)

  const missing = referenceKeys.filter((key) => !targetSet.has(key))
  const extra = targetKeys.filter((key) => !referenceSet.has(key))

  return { missing, extra }
}

/**
 * Load all translation files from the locales directory
 */
async function loadAllTranslations(locales: string[]): Promise<LocaleData> {
  const localeData: LocaleData = {}

  for (const locale of locales) {
    const localePath = join(LOCALES_DIR, locale)
    const files = await readdir(localePath)
    localeData[locale] = {}

    for (const file of files) {
      if (!file.endsWith('.json')) continue
      const namespace = file.replace('.json', '')
      const filePath = join(localePath, file)
      const content = await readFile(filePath, 'utf-8')
      localeData[locale][namespace] = JSON.parse(content) as TranslationObject
    }
  }

  return localeData
}

/**
 * Check namespace differences between reference and target
 */
function checkNamespaces(
  namespaces: string[],
  targetNamespaces: string[]
): { missing: string[]; extra: string[] } {
  const missing = namespaces.filter((ns) => !targetNamespaces.includes(ns))
  const extra = targetNamespaces.filter((ns) => !namespaces.includes(ns))
  return { missing, extra }
}

/**
 * Compare a single namespace between reference and target
 */
function compareNamespace(
  namespace: string,
  refNs: TranslationObject,
  targetNs: TranslationObject | undefined,
  referenceLocale: string
): { hasError: boolean } {
  if (!targetNs) {
    return { hasError: false } // Already reported as missing namespace
  }

  const refKeys = getKeys(refNs)
  const targetKeys = getKeys(targetNs)
  const { missing, extra } = findDifferences(refKeys, targetKeys)
  let hasError = false

  if (missing.length > 0) {
    console.error(`  ❌ ${namespace}: Missing keys:`)
    for (const key of missing) {
      console.error(`      - ${key}`)
    }
    hasError = true
  }

  if (extra.length > 0) {
    console.warn(`  ⚠️  ${namespace}: Extra keys (not in ${referenceLocale}):`)
    for (const key of extra) {
      console.warn(`      - ${key}`)
    }
  }

  if (missing.length === 0 && extra.length === 0) {
    console.log(`  ✅ ${namespace}: All keys match`)
  }

  return { hasError }
}

/**
 * Compare a locale against the reference locale
 */
function compareLocale(
  locale: string,
  referenceLocale: string,
  referenceData: Record<string, TranslationObject>,
  targetData: Record<string, TranslationObject> | undefined,
  namespaces: string[]
): boolean {
  console.log(`\n--- Comparing ${locale} with ${referenceLocale} ---`)

  if (!targetData) {
    console.error(`  ❌ Could not load locale: ${locale}`)
    return true
  }

  let hasErrors = false
  const targetNamespaces = Object.keys(targetData)
  const { missing: missingNs, extra: extraNs } = checkNamespaces(namespaces, targetNamespaces)

  if (missingNs.length > 0) {
    console.error(`  ❌ Missing namespaces: ${missingNs.join(', ')}`)
    hasErrors = true
  }

  if (extraNs.length > 0) {
    console.warn(`  ⚠️  Extra namespaces: ${extraNs.join(', ')}`)
  }

  for (const namespace of namespaces) {
    const refNs = referenceData[namespace]
    if (!refNs) continue

    const { hasError } = compareNamespace(namespace, refNs, targetData[namespace], referenceLocale)
    if (hasError) hasErrors = true
  }

  return hasErrors
}

async function main() {
  console.log('🔍 Validating translations...\n')

  const locales = await readdir(LOCALES_DIR)
  const localeData = await loadAllTranslations(locales)

  const referenceLocale = locales.includes('en') ? 'en' : locales[0]
  if (!referenceLocale) {
    console.error('❌ No locales found')
    process.exit(1)
  }

  const referenceData = localeData[referenceLocale]
  if (!referenceData) {
    console.error(`❌ Could not load reference locale: ${referenceLocale}`)
    process.exit(1)
  }

  const namespaces = Object.keys(referenceData)

  console.log(`📖 Reference locale: ${referenceLocale}`)
  console.log(`📁 Namespaces: ${namespaces.join(', ')}`)
  console.log(`🌍 Locales: ${locales.join(', ')}\n`)

  let hasErrors = false
  for (const locale of locales) {
    if (locale === referenceLocale) continue
    const localeHasErrors = compareLocale(
      locale,
      referenceLocale,
      referenceData,
      localeData[locale],
      namespaces
    )
    if (localeHasErrors) hasErrors = true
  }

  console.log('\n')

  if (hasErrors) {
    console.error('❌ Validation failed. Please fix the missing keys above.')
    process.exit(1)
  }

  console.log('✅ All translations are valid!')
  process.exit(0)
}

main().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})
