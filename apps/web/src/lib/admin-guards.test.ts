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
import { requireAdmin, requireSuperAdmin } from './admin-guards'

beforeEach(() => {
  mockGetSession.mockReset()
})

// ---------------------------------------------------------------------------
// requireAdmin
// ---------------------------------------------------------------------------

describe('requireAdmin', () => {
  it('should return undefined on SSR (typeof window === "undefined")', async () => {
    // Arrange
    const originalWindow = globalThis.window
    delete (globalThis as Record<string, unknown>).window

    // Act
    const result = await requireAdmin()

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
    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/login')
  })

  it('should not throw when user has superadmin role', async () => {
    // Arrange
    mockGetSession.mockResolvedValueOnce({
      data: { user: { role: 'superadmin' }, permissions: [] },
    })

    // Act & Assert
    await expect(requireAdmin()).resolves.toBeUndefined()
  })

  it('should not throw when user has members:write permission', async () => {
    // Arrange
    mockGetSession.mockResolvedValueOnce({
      data: { user: { role: 'member' }, permissions: ['members:write'] },
    })

    // Act & Assert
    await expect(requireAdmin()).resolves.toBeUndefined()
  })

  it('should throw redirect to /dashboard when user is neither superadmin nor has members:write', async () => {
    // Arrange
    mockGetSession.mockResolvedValueOnce({
      data: { user: { role: 'member' }, permissions: ['members:read'] },
    })

    // Act & Assert
    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/dashboard')
  })
})

// ---------------------------------------------------------------------------
// requireSuperAdmin
// ---------------------------------------------------------------------------

describe('requireSuperAdmin', () => {
  it('should return undefined on SSR (typeof window === "undefined")', async () => {
    // Arrange
    const originalWindow = globalThis.window
    delete (globalThis as Record<string, unknown>).window

    // Act
    const result = await requireSuperAdmin()

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
    await expect(requireSuperAdmin()).rejects.toThrow('REDIRECT:/login')
  })

  it('should not throw when user has superadmin role', async () => {
    // Arrange
    mockGetSession.mockResolvedValueOnce({
      data: { user: { role: 'superadmin' } },
    })

    // Act & Assert
    await expect(requireSuperAdmin()).resolves.toBeUndefined()
  })

  it('should throw redirect to /admin when user is not superadmin', async () => {
    // Arrange
    mockGetSession.mockResolvedValueOnce({
      data: { user: { role: 'member' } },
    })

    // Act & Assert
    await expect(requireSuperAdmin()).rejects.toThrow('REDIRECT:/admin')
  })
})
