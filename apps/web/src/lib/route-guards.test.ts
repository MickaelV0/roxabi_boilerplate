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
  redirect: (opts: { to: string; search?: Record<string, string> }) => {
    const error = new Error(`REDIRECT:${opts.to}`)
    ;(error as unknown as Record<string, unknown>).redirectOpts = opts
    return error
  },
}))

// Import after mocks are set up
import { requireAuth, requireGuest, safeRedirect } from './route-guards'

beforeEach(() => {
  mockGetSession.mockReset()
})

// ---------------------------------------------------------------------------
// safeRedirect
// ---------------------------------------------------------------------------

describe('safeRedirect', () => {
  it('should return a valid relative path unchanged', () => {
    // Arrange
    const path = '/dashboard'

    // Act
    const result = safeRedirect(path)

    // Assert
    expect(result).toBe('/dashboard')
  })

  it('should return another valid relative path unchanged', () => {
    // Arrange
    const path = '/settings'

    // Act
    const result = safeRedirect(path)

    // Assert
    expect(result).toBe('/settings')
  })

  it('should return a deeply nested valid path unchanged', () => {
    // Arrange
    const path = '/org/123/settings/billing'

    // Act
    const result = safeRedirect(path)

    // Assert
    expect(result).toBe('/org/123/settings/billing')
  })

  it('should return a path with query params unchanged', () => {
    // Arrange
    const path = '/dashboard?tab=overview&page=1'

    // Act
    const result = safeRedirect(path)

    // Assert
    expect(result).toBe('/dashboard?tab=overview&page=1')
  })

  it('should return /dashboard when value is undefined', () => {
    // Arrange & Act
    const result = safeRedirect(undefined)

    // Assert
    expect(result).toBe('/dashboard')
  })

  it('should return /dashboard when value is empty string', () => {
    // Arrange & Act
    const result = safeRedirect('')

    // Assert
    expect(result).toBe('/dashboard')
  })

  it('should block protocol-relative URLs (//evil.com)', () => {
    // Arrange
    const path = '//evil.com'

    // Act
    const result = safeRedirect(path)

    // Assert
    expect(result).toBe('/dashboard')
  })

  it('should block protocol-relative URLs with path (//evil.com/steal)', () => {
    // Arrange
    const path = '//evil.com/steal'

    // Act
    const result = safeRedirect(path)

    // Assert
    expect(result).toBe('/dashboard')
  })

  it('should block absolute URLs with https scheme', () => {
    // Arrange
    const path = 'https://evil.com'

    // Act
    const result = safeRedirect(path)

    // Assert
    expect(result).toBe('/dashboard')
  })

  it('should block absolute URLs with http scheme', () => {
    // Arrange
    const path = 'http://evil.com/phish'

    // Act
    const result = safeRedirect(path)

    // Assert
    expect(result).toBe('/dashboard')
  })

  it('should block javascript: protocol URIs', () => {
    // Arrange
    const path = 'javascript:alert(1)'

    // Act
    const result = safeRedirect(path)

    // Assert
    expect(result).toBe('/dashboard')
  })

  it('should block paths that do not start with /', () => {
    // Arrange
    const path = 'dashboard'

    // Act
    const result = safeRedirect(path)

    // Assert
    expect(result).toBe('/dashboard')
  })

  it('should block relative paths without leading slash', () => {
    // Arrange
    const path = 'settings/profile'

    // Act
    const result = safeRedirect(path)

    // Assert
    expect(result).toBe('/dashboard')
  })

  it('should block data: URIs', () => {
    // Arrange
    const path = 'data:text/html,<script>alert(1)</script>'

    // Act
    const result = safeRedirect(path)

    // Assert
    expect(result).toBe('/dashboard')
  })
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

  it('should include redirect search param with current path when context is provided', async () => {
    // Arrange
    mockGetSession.mockResolvedValueOnce({ data: null })
    const ctx = {
      location: {
        pathname: '/settings',
        searchStr: '?tab=billing',
        href: '/settings?tab=billing',
        publicHref: '/settings?tab=billing',
        external: false,
        search: {},
        state: { __TSR_index: 0 },
        hash: '',
        maskedLocation: undefined,
        unmaskOnReload: false,
      },
      preload: false,
      cause: 'enter' as const,
    }

    // Act
    let caughtError: Error | null = null
    try {
      await requireAuth(ctx)
    } catch (error) {
      caughtError = error as Error
    }

    // Assert
    expect(caughtError).not.toBeNull()
    const opts = (caughtError as unknown as Record<string, unknown>).redirectOpts as {
      to: string
      search?: { redirect: string }
    }
    expect(opts.to).toBe('/login')
    expect(opts.search).toEqual({ redirect: '/settings?tab=billing' })
  })

  it('should not include redirect search param when context is not provided', async () => {
    // Arrange
    mockGetSession.mockResolvedValueOnce({ data: null })

    // Act
    let caughtError: Error | null = null
    try {
      await requireAuth()
    } catch (error) {
      caughtError = error as Error
    }

    // Assert
    expect(caughtError).not.toBeNull()
    const opts = (caughtError as unknown as Record<string, unknown>).redirectOpts as {
      to: string
      search?: Record<string, string>
    }
    expect(opts.to).toBe('/login')
    expect(opts.search).toBeUndefined()
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
