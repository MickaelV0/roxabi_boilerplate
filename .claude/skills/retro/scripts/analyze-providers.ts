import type { RetroConfig } from '../lib/config'
import { resolveApiKey } from '../lib/config'
import type { AnalysisContext, Finding } from './analyze-transcript'
import { FINDINGS_SCHEMA, parseFindings } from './analyze-transcript'

// ---------------------------------------------------------------------------
// Provider invocations
// ---------------------------------------------------------------------------

async function invokeClaudeCli(prompt: string): Promise<Finding[]> {
  const schemaArg = JSON.stringify(FINDINGS_SCHEMA)
  const proc = Bun.spawn(['claude', '-p', '--output-format', 'json', '--json-schema', schemaArg], {
    stdin: Buffer.from(prompt),
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const timeoutId = setTimeout(() => proc.kill(), 120_000)

  try {
    const stdout = await new Response(proc.stdout).text()
    const exitCode = await proc.exited
    clearTimeout(timeoutId)

    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text()
      throw new Error(`Claude CLI exited with code ${exitCode}: ${stderr}`)
    }

    const outer = JSON.parse(stdout)
    const inner = typeof outer.result === 'string' ? outer.result : JSON.stringify(outer.result)
    return parseFindings(inner)
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

async function invokeOpenRouter(
  prompt: string,
  config: RetroConfig,
  ctx: AnalysisContext
): Promise<Finding[]> {
  const apiKey = resolveApiKey(config)

  const body: Record<string, unknown> = {
    model: config.model,
    messages: [{ role: 'user', content: prompt }],
  }

  if (ctx.useJsonSchema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: { name: 'findings_response', strict: true, schema: FINDINGS_SCHEMA },
    }
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[]
  }

  return parseFindings(data.choices[0].message.content)
}

export async function invokeProvider(
  prompt: string,
  config: RetroConfig,
  ctx: AnalysisContext
): Promise<Finding[]> {
  if (config.provider === 'openrouter') {
    return invokeOpenRouter(prompt, config, ctx)
  }
  return invokeClaudeCli(prompt)
}

// ---------------------------------------------------------------------------
// Retry logic
// ---------------------------------------------------------------------------

const RETRY_DELAYS = [0, 5_000, 30_000]

export async function invokeWithRetry(
  prompt: string,
  config: RetroConfig,
  ctx: AnalysisContext
): Promise<Finding[]> {
  let lastError = new Error('All retry attempts failed')

  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
    const delay = RETRY_DELAYS[attempt]
    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay))
    }

    try {
      return await invokeProvider(prompt, config, ctx)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < RETRY_DELAYS.length - 1) {
        const nextDelay = RETRY_DELAYS[attempt + 1] / 1000
        console.error(
          `  Attempt ${attempt + 1} failed: ${lastError.message.slice(0, 80)}. Retrying in ${nextDelay}s...`
        )
      }
    }
  }

  throw lastError
}
