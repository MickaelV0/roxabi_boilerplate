import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock Bun.spawn before importing the module
const mockSpawn = vi.fn()
vi.stubGlobal('Bun', {
  spawn: mockSpawn,
})

const { ghGraphQL, run } = await import('../github')

function mockProcess(stdout: string, stderr = '', exitCode = 0) {
  const stdoutStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(stdout))
      controller.close()
    },
  })
  const stderrStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(stderr))
      controller.close()
    },
  })
  return {
    stdout: stdoutStream,
    stderr: stderrStream,
    exited: Promise.resolve(exitCode),
  }
}

describe('shared/github', () => {
  beforeEach(() => {
    mockSpawn.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('run', () => {
    it('returns trimmed stdout', async () => {
      mockSpawn.mockReturnValue(mockProcess('  hello world  \n'))
      const result = await run(['echo', 'hello'])
      expect(result).toBe('hello world')
    })

    it('passes command to Bun.spawn', async () => {
      mockSpawn.mockReturnValue(mockProcess('ok'))
      await run(['git', 'status'])
      expect(mockSpawn).toHaveBeenCalledWith(
        ['git', 'status'],
        expect.objectContaining({ stdout: 'pipe', stderr: 'pipe' })
      )
    })
  })

  describe('ghGraphQL', () => {
    it('builds correct gh api graphql args', async () => {
      mockSpawn.mockReturnValue(mockProcess('{"data":{}}'))
      await ghGraphQL('query { viewer { login } }', { owner: 'test' })
      const args = mockSpawn.mock.calls[0][0]
      expect(args).toContain('gh')
      expect(args).toContain('api')
      expect(args).toContain('graphql')
      expect(args).toContain('-f')
    })

    it('uses -F for number variables', async () => {
      mockSpawn.mockReturnValue(mockProcess('{"data":{}}'))
      await ghGraphQL('query { issue(number: $number) { id } }', { number: 42 })
      const args = mockSpawn.mock.calls[0][0]
      expect(args).toContain('-F')
      expect(args).toContain('number=42')
    })

    it('throws on non-zero exit code', async () => {
      mockSpawn.mockReturnValue(mockProcess('', 'auth error', 1))
      await expect(ghGraphQL('query {}', {})).rejects.toThrow('gh api graphql failed')
    })

    it('parses JSON response', async () => {
      mockSpawn.mockReturnValue(mockProcess('{"data":{"viewer":{"login":"test"}}}'))
      const result = (await ghGraphQL('query { viewer { login } }', {})) as {
        data: { viewer: { login: string } }
      }
      expect(result.data.viewer.login).toBe('test')
    })
  })
})
