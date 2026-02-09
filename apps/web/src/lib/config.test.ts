import { describe, expect, it, vi } from 'vitest'

describe('config', () => {
  it('should default GITHUB_REPO_URL to "#" when env is not set', async () => {
    vi.stubEnv('VITE_GITHUB_REPO_URL', '')

    const { GITHUB_REPO_URL } = await import('./config')

    expect(GITHUB_REPO_URL).toBe('#')
  })

  it('should use VITE_GITHUB_REPO_URL when env is set', async () => {
    vi.stubEnv('VITE_GITHUB_REPO_URL', 'https://github.com/example/repo')

    // Re-import to pick up the new env value
    vi.resetModules()
    const { GITHUB_REPO_URL } = await import('./config')

    expect(GITHUB_REPO_URL).toBe('https://github.com/example/repo')
  })
})
