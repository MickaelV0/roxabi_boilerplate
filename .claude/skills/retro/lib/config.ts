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
}

const DEFAULTS: RetroConfig = {
  provider: 'claude-cli',
  model: 'anthropic/claude-sonnet-4-20250514',
  apiKeyEnv: 'OPENROUTER_API_KEY',
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

  return {
    provider,
    model: parsed.model || DEFAULTS.model,
    apiKeyEnv: parsed.api_key_env || DEFAULTS.apiKeyEnv,
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
