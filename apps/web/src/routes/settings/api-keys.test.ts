import { describe, expect, it, vi } from 'vitest'
import { mockParaglideMessages } from '@/test/__mocks__/mockMessages'

// Mock heavy dependencies so the module can be loaded for pure function testing
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: unknown }) => ({
    component: config.component,
  }),
}))

vi.mock('@repo/ui', async () => await import('@/test/__mocks__/repoUi'))
vi.mock('@/lib/apiKeys', () => ({}))
vi.mock('@/lib/authClient', () => ({
  authClient: { useActiveOrganization: vi.fn(() => ({ data: null })) },
  useSession: vi.fn(() => ({ data: null })),
}))
vi.mock('@/lib/permissions', () => ({ hasPermission: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
mockParaglideMessages()

// Import after mocks are set up
const { deriveStatus } = await import('./api-keys/-helpers')

// ---------------------------------------------------------------------------
// Factory helper
// ---------------------------------------------------------------------------

function makeApiKey(
  overrides: Partial<import('@/lib/apiKeys').ApiKey> = {}
): import('@/lib/apiKeys').ApiKey {
  return {
    id: 'key-1',
    name: 'Test Key',
    keyPrefix: 'rxb_',
    lastFour: 'abcd',
    scopes: ['read:data'],
    rateLimitTier: 'standard',
    expiresAt: null,
    lastUsedAt: null,
    revokedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('deriveStatus — basic states', () => {
  it('should return "active" when key is neither revoked nor expired', () => {
    const key = makeApiKey()
    expect(deriveStatus(key)).toBe('active')
  })

  it('should return "expired" when expiresAt is in the past', () => {
    const key = makeApiKey({ expiresAt: '2020-01-01T00:00:00.000Z' })
    expect(deriveStatus(key)).toBe('expired')
  })

  it('should return "revoked" when revokedAt is set', () => {
    const key = makeApiKey({ revokedAt: '2025-06-01T00:00:00.000Z' })
    expect(deriveStatus(key)).toBe('revoked')
  })
})

describe('deriveStatus — edge cases', () => {
  it('should return "revoked" when key is both revoked and expired', () => {
    const key = makeApiKey({
      revokedAt: '2025-06-01T00:00:00.000Z',
      expiresAt: '2020-01-01T00:00:00.000Z',
    })
    expect(deriveStatus(key)).toBe('revoked')
  })

  it('should return "active" when expiresAt is in the future', () => {
    const key = makeApiKey({ expiresAt: '2099-12-31T23:59:59.000Z' })
    expect(deriveStatus(key)).toBe('active')
  })
})
