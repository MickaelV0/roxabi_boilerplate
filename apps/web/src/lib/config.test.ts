import { describe, expect, it, vi } from 'vitest'

async function importConfig(envValue?: string) {
  vi.doMock('./env.shared.js', () => ({
    clientEnv: {
      VITE_ENABLE_DEMO: 'true',
      VITE_GITHUB_REPO_URL: envValue || undefined,
    },
  }))
  vi.resetModules()
  return import('./config')
}

describe('config', () => {
  it('should default GITHUB_REPO_URL to "#" when env is not set', async () => {
    // Arrange & Act
    const { GITHUB_REPO_URL } = await importConfig()

    // Assert
    expect(GITHUB_REPO_URL).toBe('#')
  })

  it('should use VITE_GITHUB_REPO_URL when env is set', async () => {
    // Arrange & Act
    const { GITHUB_REPO_URL } = await importConfig('https://github.com/example/repo')

    // Assert
    expect(GITHUB_REPO_URL).toBe('https://github.com/example/repo')
  })
})
