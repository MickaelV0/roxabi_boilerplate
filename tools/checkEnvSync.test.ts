import { execFile } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'
import {
  addEnvVarsFromArrays,
  collectTurboEnvVars,
  findLineCommentStart,
  matchesWildcard,
  stripJsoncComments,
} from '../scripts/checkEnvSync'

const execFileAsync = promisify(execFile)

const ROOT = join(import.meta.dirname, '..')
const SCRIPT_PATH = join(ROOT, 'scripts', 'checkEnvSync.ts')

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

// ─── findLineCommentStart ────────────────────────────────────────────────────

describe('findLineCommentStart', () => {
  it('should return -1 when there is no comment', () => {
    expect(findLineCommentStart('  "key": "value",')).toBe(-1)
  })

  it('should return correct index for line comment at start', () => {
    expect(findLineCommentStart('// this is a comment')).toBe(0)
  })

  it('should return correct index for comment after JSON value', () => {
    expect(findLineCommentStart('  "key": "value", // inline comment')).toBe(18)
  })

  it('should return -1 when // is inside a JSON string', () => {
    expect(findLineCommentStart('  "url": "https://example.com"')).toBe(-1)
  })

  it('should return the real comment index when // is inside string and also after', () => {
    expect(findLineCommentStart('  "url": "https://example.com", // comment')).toBe(32)
  })

  it('should handle escaped quotes correctly', () => {
    expect(findLineCommentStart('  "say \\"hello\\"": "val" // comment')).toBe(25)
  })

  it('should return -1 for empty string', () => {
    expect(findLineCommentStart('')).toBe(-1)
  })
})

// ─── stripJsoncComments ──────────────────────────────────────────────────────

describe('stripJsoncComments', () => {
  it('should strip comments from multi-line JSONC and produce valid JSON', () => {
    // Arrange
    const jsonc = [
      '{',
      '  // top-level comment',
      '  "key": "value", // inline comment',
      '  "nested": {',
      '    "arr": [1, 2] // trailing',
      '  }',
      '}',
    ].join('\n')

    // Act
    const stripped = stripJsoncComments(jsonc)

    // Assert
    const parsed = JSON.parse(stripped)
    expect(parsed.key).toBe('value')
    expect(parsed.nested.arr).toEqual([1, 2])
  })

  it('should strip comments from the project turbo.jsonc and produce valid JSON', () => {
    // Arrange
    const turboJsoncPath = join(import.meta.dirname, '..', 'turbo.jsonc')
    const content = readFileSync(turboJsoncPath, 'utf-8')

    // Act
    const stripped = stripJsoncComments(content)

    // Assert
    const parsed = JSON.parse(stripped)
    expect(parsed).toHaveProperty('tasks')
  })
})

// ─── matchesWildcard ─────────────────────────────────────────────────────────

describe('matchesWildcard', () => {
  it('should match VITE_APP_URL against VITE_* pattern', () => {
    expect(matchesWildcard('VITE_APP_URL', new Set(['VITE_*']))).toBe(true)
  })

  it('should return false when there are no wildcard patterns', () => {
    expect(matchesWildcard('VITE_APP_URL', new Set(['API_URL']))).toBe(false)
  })

  it('should return false for empty pattern set', () => {
    expect(matchesWildcard('VITE_APP_URL', new Set())).toBe(false)
  })

  it('should match everything with * pattern', () => {
    expect(matchesWildcard('ANYTHING', new Set(['*']))).toBe(true)
  })

  it('should match exact prefix with nothing after wildcard', () => {
    expect(matchesWildcard('VITE_', new Set(['VITE_*']))).toBe(true)
  })
})

// ─── collectTurboEnvVars ─────────────────────────────────────────────────────

describe('collectTurboEnvVars', () => {
  it('should extract from globalEnv, globalPassThroughEnv, task-level env, and passThroughEnv', () => {
    // Arrange
    const config = {
      globalEnv: ['GLOBAL_A'],
      globalPassThroughEnv: ['GLOBAL_B'],
      tasks: {
        build: {
          env: ['BUILD_A'],
          passThroughEnv: ['BUILD_B'],
        },
      },
    }

    // Act
    const result = collectTurboEnvVars(config)

    // Assert
    expect(result).toEqual(new Set(['GLOBAL_A', 'GLOBAL_B', 'BUILD_A', 'BUILD_B']))
  })

  it('should handle missing and null task entries', () => {
    // Arrange
    const config = {
      tasks: {
        build: null,
        dev: { cache: false },
      },
    }

    // Act
    const result = collectTurboEnvVars(config as Record<string, unknown>)

    // Assert
    expect(result).toEqual(new Set())
  })

  it('should filter out non-string array values', () => {
    // Arrange
    const config = {
      globalEnv: ['VALID', 42, null, true, 'ALSO_VALID'],
    }

    // Act
    const result = collectTurboEnvVars(config as Record<string, unknown>)

    // Assert
    expect(result).toEqual(new Set(['VALID', 'ALSO_VALID']))
  })

  it('should return empty set for empty config', () => {
    expect(collectTurboEnvVars({})).toEqual(new Set())
  })
})

// ─── addEnvVarsFromArrays ────────────────────────────────────────────────────

describe('addEnvVarsFromArrays', () => {
  it('should add string values from specified keys', () => {
    // Arrange
    const target = new Set<string>()
    const obj = { env: ['A', 'B'], passThroughEnv: ['C'] }

    // Act
    addEnvVarsFromArrays(obj, ['env', 'passThroughEnv'], target)

    // Assert
    expect(target).toEqual(new Set(['A', 'B', 'C']))
  })

  it('should ignore non-array values', () => {
    // Arrange
    const target = new Set<string>()
    const obj = { env: 'not-an-array', passThroughEnv: 42 }

    // Act
    addEnvVarsFromArrays(obj as Record<string, unknown>, ['env', 'passThroughEnv'], target)

    // Assert
    expect(target).toEqual(new Set())
  })

  it('should ignore non-string array elements', () => {
    // Arrange
    const target = new Set<string>()
    const obj = { env: ['VALID', 123, null, undefined, 'ALSO_VALID'] }

    // Act
    addEnvVarsFromArrays(obj as Record<string, unknown>, ['env'], target)

    // Assert
    expect(target).toEqual(new Set(['VALID', 'ALSO_VALID']))
  })
})
