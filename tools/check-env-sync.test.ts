import { execFile } from 'node:child_process'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)

const ROOT = join(import.meta.dirname, '..')
const SCRIPT_PATH = join(ROOT, 'scripts', 'check-env-sync.ts')

async function runCheckEnvSync() {
  try {
    const { stdout, stderr } = await execFileAsync('bun', ['run', SCRIPT_PATH], {
      cwd: ROOT,
      env: { ...process.env, NODE_ENV: 'development' },
      timeout: 30000,
    })
    return { exitCode: 0, stdout, stderr }
  } catch (error: unknown) {
    const err = error as { code?: number; stdout?: string; stderr?: string }
    return {
      exitCode: err.code ?? 1,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
    }
  }
}

describe('check-env-sync', () => {
  it('should exit 0 when schemas are in sync with .env.example', async () => {
    // Act
    const result = await runCheckEnvSync()

    // Assert
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('All env schemas are in sync')
  })

  it('should output checking message on stdout', async () => {
    // Act
    const result = await runCheckEnvSync()

    // Assert
    expect(result.stdout).toContain('Checking env schema sync')
  })
})
