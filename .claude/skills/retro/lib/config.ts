/**
 * Configuration loader for the retro skill.
 *
 * Reads .claude/skills/retro/retro.config.yaml (user-specific, gitignored).
 * Falls back to sensible defaults when the config file is absent.
 */

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

export interface RetroConfig {
  provider: 'claude-cli' | 'openrouter'
  model: string
  apiKeyEnv: string
  concurrency: number
  qualityCapChars: number
}

/** Model metadata fetched from OpenRouter at runtime. */
export interface ModelMetadata {
  contextLength: number
  supportsResponseFormat: boolean
  supportsStructuredOutputs: boolean
}

const DEFAULTS: RetroConfig = {
  provider: 'claude-cli',
  model: 'anthropic/claude-sonnet-4-20250514',
  apiKeyEnv: 'OPENROUTER_API_KEY',
  concurrency: 3,
  qualityCapChars: 100_000,
}

const SKILL_ROOT = path.join(import.meta.dir, '..')
const CONFIG_PATH = path.join(SKILL_ROOT, 'retro.config.yaml')

function parseSimpleYaml(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf(':')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed
      .slice(idx + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '')
    result[key] = value
  }
  return result
}

/**
 * Load retro skill configuration from retro.config.yaml.
 * Returns defaults when the file does not exist.
 */
export function loadConfig(): RetroConfig {
  if (!existsSync(CONFIG_PATH)) {
    return { ...DEFAULTS }
  }

  const raw = readFileSync(CONFIG_PATH, 'utf-8')
  const parsed = parseSimpleYaml(raw)

  const provider =
    parsed.provider === 'openrouter' || parsed.provider === 'claude-cli'
      ? parsed.provider
      : DEFAULTS.provider

  const rawConcurrency = parsed.concurrency
    ? Number.parseInt(parsed.concurrency, 10)
    : DEFAULTS.concurrency
  const concurrency =
    Number.isNaN(rawConcurrency) || rawConcurrency < 1
      ? DEFAULTS.concurrency
      : Math.min(rawConcurrency, 10)

  const rawQualityCap = parsed.quality_cap_chars
    ? Number.parseInt(parsed.quality_cap_chars, 10)
    : DEFAULTS.qualityCapChars
  const qualityCapChars =
    Number.isNaN(rawQualityCap) || rawQualityCap < 10_000 ? DEFAULTS.qualityCapChars : rawQualityCap

  return {
    provider,
    model: parsed.model || DEFAULTS.model,
    apiKeyEnv: parsed.api_key_env || DEFAULTS.apiKeyEnv,
    concurrency,
    qualityCapChars,
  }
}

/**
 * Resolve the API key from the environment variable specified in config.
 * Throws if the provider is openrouter and the variable is not set.
 */
export function resolveApiKey(config: RetroConfig): string {
  const value = process.env[config.apiKeyEnv]
  if (!value) {
    throw new Error(
      `Environment variable ${config.apiKeyEnv} is not set. Required for provider "${config.provider}".`
    )
  }
  return value
}

/**
 * Fetch model metadata from OpenRouter API.
 * Returns null if the model is not found or the request fails.
 */
export async function fetchModelMetadata(
  model: string,
  apiKey: string
): Promise<ModelMetadata | null> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) return null

    const data = (await response.json()) as {
      data: {
        id: string
        context_length: number
        supported_parameters?: string[]
      }[]
    }

    const entry = data.data.find((m) => m.id === model)
    if (!entry) return null

    const params = entry.supported_parameters ?? []
    return {
      contextLength: entry.context_length,
      supportsResponseFormat: params.includes('response_format'),
      supportsStructuredOutputs: params.includes('structured_outputs'),
    }
  } catch {
    return null
  }
}

/**
 * Compute the effective chunk size in characters based on model metadata.
 *
 * Uses 75% of the model's context for input (leaving room for response),
 * with a conservative 3 chars/token estimate. The result is capped by
 * the user's quality_cap_chars setting.
 */
export function computeChunkSize(metadata: ModelMetadata | null, qualityCapChars: number): number {
  if (!metadata) return qualityCapChars
  const reservedTokens = 3000
  const hardCeiling = (metadata.contextLength - reservedTokens) * 3
  return Math.min(hardCeiling, qualityCapChars)
}
