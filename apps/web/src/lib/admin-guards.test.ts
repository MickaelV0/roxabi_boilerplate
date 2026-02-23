import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

vi.mock('@tanstack/react-router', () => ({
  redirect: (opts: { to: string }) => new Error(`REDIRECT:${opts.to}`),
}))

// Import after mocks are set up
import { requireAdmin, requireSuperAdmin } from './admin-guards'

/** Helper: create a mock Response returning JSON for the enriched session endpoint. */
function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  })
}

beforeEach(() => {
  mockFetch.mockReset()
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
    expect(mockFetch).not.toHaveBeenCalled()

    // Cleanup
    globalThis.window = originalWindow
  })

  it('should throw redirect to /login when session endpoint returns 401', async () => {
    // Arrange
    mockFetch.mockReturnValueOnce(jsonResponse(null, 401))

    // Act & Assert
    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/login')
  })

  it('should throw redirect to /login when fetch throws a network error', async () => {
    // Arrange
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    // Act & Assert
    await expect(requireAdmin()).rejects.toThrow('REDIRECT:/login')
  })

  it('should not throw when user has superadmin role', async () => {
    // Arrange
    mockFetch.mockReturnValueOnce(
      jsonResponse({
        user: { id: '1', email: 'a@b.com', role: 'superadmin' },
        session: {},
        permissions: [],
      })
    )

    // Act & Assert
    await expect(requireAdmin()).resolves.toBeUndefined()
    expect(mockFetch).toHaveBeenCalledWith('/api/session', { credentials: 'include' })
  })

  it('should not throw when user has members:write permission', async () => {
    // Arrange
    mockFetch.mockReturnValueOnce(
      jsonResponse({
        user: { id: '1', email: 'a@b.com', role: 'member' },
        session: {},
        permissions: ['members:write'],
      })
    )

    // Act & Assert
    await expect(requireAdmin()).resolves.toBeUndefined()
  })

  it('should throw redirect to /dashboard when user is neither superadmin nor has members:write', async () => {
    // Arrange
    mockFetch.mockReturnValueOnce(
      jsonResponse({
        user: { id: '1', email: 'a@b.com', role: 'member' },
        session: {},
        permissions: ['members:read'],
      })
    )

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
    expect(mockFetch).not.toHaveBeenCalled()

    // Cleanup
    globalThis.window = originalWindow
  })

  it('should throw redirect to /login when session endpoint returns 401', async () => {
    // Arrange
    mockFetch.mockReturnValueOnce(jsonResponse(null, 401))

    // Act & Assert
    await expect(requireSuperAdmin()).rejects.toThrow('REDIRECT:/login')
  })

  it('should not throw when user has superadmin role', async () => {
    // Arrange
    mockFetch.mockReturnValueOnce(
      jsonResponse({
        user: { id: '1', email: 'a@b.com', role: 'superadmin' },
        session: {},
        permissions: [],
      })
    )

    // Act & Assert
    await expect(requireSuperAdmin()).resolves.toBeUndefined()
  })

  it('should throw redirect to /admin when user is not superadmin', async () => {
    // Arrange
    mockFetch.mockReturnValueOnce(
      jsonResponse({
        user: { id: '1', email: 'a@b.com', role: 'member' },
        session: {},
        permissions: ['members:write'],
      })
    )

    // Act & Assert
    await expect(requireSuperAdmin()).rejects.toThrow('REDIRECT:/admin')
  })
})
