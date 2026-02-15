import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetSession = vi.fn()

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    getSession: (...args: unknown[]) => mockGetSession(...args),
  },
}))

vi.mock('@tanstack/react-router', () => ({
  redirect: (opts: { to: string }) => new Error(`REDIRECT:${opts.to}`),
}))

// Import after mocks are set up
import { requireAuth, requireGuest } from './route-guards'

beforeEach(() => {
  mockGetSession.mockReset()
})

// ---------------------------------------------------------------------------
// requireAuth
// ---------------------------------------------------------------------------

describe('requireAuth', () => {
  it('should return undefined on SSR (typeof window === "undefined")', async () => {
    // Arrange
    const originalWindow = globalThis.window
    delete (globalThis as Record<string, unknown>).window

    // Act
    const result = await requireAuth()

    // Assert
    expect(result).toBeUndefined()
    expect(mockGetSession).not.toHaveBeenCalled()

    // Cleanup
    globalThis.window = originalWindow
  })

  it('should throw redirect to /login when getSession returns no data', async () => {
    // Arrange
    mockGetSession.mockResolvedValueOnce({ data: null })

    // Act & Assert
    await expect(requireAuth()).rejects.toThrow('REDIRECT:/login')
  })

  it('should not throw when getSession returns data', async () => {
    // Arrange
    mockGetSession.mockResolvedValueOnce({ data: { user: { id: '1' } } })

    // Act & Assert
    await expect(requireAuth()).resolves.toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// requireGuest
// ---------------------------------------------------------------------------

describe('requireGuest', () => {
  it('should return undefined on SSR (typeof window === "undefined")', async () => {
    // Arrange
    const originalWindow = globalThis.window
    delete (globalThis as Record<string, unknown>).window

    // Act
    const result = await requireGuest()

    // Assert
    expect(result).toBeUndefined()
    expect(mockGetSession).not.toHaveBeenCalled()

    // Cleanup
    globalThis.window = originalWindow
  })

  it('should throw redirect to /dashboard when getSession returns data', async () => {
    // Arrange
    mockGetSession.mockResolvedValueOnce({ data: { user: { id: '1' } } })

    // Act & Assert
    await expect(requireGuest()).rejects.toThrow('REDIRECT:/dashboard')
  })

  it('should not throw when getSession returns no data', async () => {
    // Arrange
    mockGetSession.mockResolvedValueOnce({ data: null })

    // Act & Assert
    await expect(requireGuest()).resolves.toBeUndefined()
  })
})
