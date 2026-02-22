import { describe, expect, it, vi } from 'vitest'

const captured = vi.hoisted(() => ({
  beforeLoad: undefined as (() => void) | undefined,
  redirect: vi.fn((opts: unknown) => opts),
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { beforeLoad?: () => void }) => {
    captured.beforeLoad = config.beforeLoad
    return config
  },
  redirect: captured.redirect,
}))

// Import after mocks to trigger createFileRoute and capture beforeLoad
import './settings'

describe('OrgSettingsRedirect', () => {
  it('should redirect to /admin/settings in beforeLoad', () => {
    expect(captured.beforeLoad).toBeDefined()
    try {
      captured.beforeLoad?.()
    } catch {
      // beforeLoad throws the redirect result
    }
    expect(captured.redirect).toHaveBeenCalledWith({ to: '/admin/settings' })
  })
})
