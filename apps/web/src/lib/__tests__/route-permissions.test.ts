import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

const mockUseRouter = vi.fn()
const mockUseQuery = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  redirect: (opts: { to: string }) => new Error(`REDIRECT:${opts.to}`),
  useRouter: (...args: unknown[]) => mockUseRouter(...args),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

// Import after mocks are set up
import { enforceRoutePermission, useCanAccess } from '../route-permissions'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Helper: create a mock Response returning JSON for the enriched session endpoint. */
function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  })
}

/** Helper: build a beforeLoad context with a matching route and optional permission. */
function createBeforeLoadCtx(permission?: string) {
  const routeId = '/admin/test'
  return {
    routeId,
    matches: [
      {
        routeId,
        staticData: permission ? { permission } : {},
      },
    ],
  }
}

/** Helper: create an enriched session object. */
function createSession(
  overrides: Partial<{
    role: string
    permissions: string[]
  }> = {}
) {
  return {
    user: {
      id: 'user-1',
      email: 'test@example.com',
      role: overrides.role ?? 'member',
    },
    session: {},
    permissions: overrides.permissions ?? [],
  }
}

/** Helper: configure mockUseRouter to return routesByPath with a given route entry. */
function setupRouter(
  routes: Record<string, { options?: { staticData?: { permission?: string } } } | undefined>
) {
  mockUseRouter.mockReturnValue({ routesByPath: routes })
}

/** Helper: configure mockUseQuery to return enriched session data. */
function setupUseQuery(data: ReturnType<typeof createSession> | null | undefined) {
  mockUseQuery.mockReturnValue({ data })
}

// ---------------------------------------------------------------------------
// enforceRoutePermission
// ---------------------------------------------------------------------------

describe('enforceRoutePermission', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('should return early when no permission is defined in staticData', async () => {
    // Arrange
    const ctx = createBeforeLoadCtx()

    // Act
    const result = await enforceRoutePermission(ctx)

    // Assert
    expect(result).toBeUndefined()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should return early during SSR (typeof window === "undefined")', async () => {
    // Arrange
    const ctx = createBeforeLoadCtx('role:superadmin')
    const originalWindow = globalThis.window
    delete (globalThis as Record<string, unknown>).window

    // Act
    const result = await enforceRoutePermission(ctx)

    // Assert
    expect(result).toBeUndefined()
    expect(mockFetch).not.toHaveBeenCalled()

    // Cleanup
    globalThis.window = originalWindow
  })

  it('should throw redirect to /login when no session is available', async () => {
    // Arrange
    const ctx = createBeforeLoadCtx('role:superadmin')
    mockFetch.mockReturnValueOnce(jsonResponse(null, 401))

    // Act & Assert
    await expect(enforceRoutePermission(ctx)).rejects.toThrow('REDIRECT:/login')
  })

  it('should allow superadmin for role:superadmin permission', async () => {
    // Arrange
    const ctx = createBeforeLoadCtx('role:superadmin')
    mockFetch.mockReturnValueOnce(jsonResponse(createSession({ role: 'superadmin' })))

    // Act & Assert
    await expect(enforceRoutePermission(ctx)).resolves.toBeUndefined()
  })

  it('should throw redirect to /admin when user does not have the required role', async () => {
    // Arrange
    const ctx = createBeforeLoadCtx('role:superadmin')
    mockFetch.mockReturnValueOnce(jsonResponse(createSession({ role: 'member' })))

    // Act & Assert
    await expect(enforceRoutePermission(ctx)).rejects.toThrow('REDIRECT:/admin')
  })

  it('should allow user with correct permission string (e.g. members:write)', async () => {
    // Arrange
    const ctx = createBeforeLoadCtx('members:write')
    mockFetch.mockReturnValueOnce(
      jsonResponse(createSession({ role: 'member', permissions: ['members:write'] }))
    )

    // Act & Assert
    await expect(enforceRoutePermission(ctx)).resolves.toBeUndefined()
  })

  it('should allow superadmin even for non-role permissions (bypass)', async () => {
    // Arrange
    const ctx = createBeforeLoadCtx('members:write')
    mockFetch.mockReturnValueOnce(
      jsonResponse(createSession({ role: 'superadmin', permissions: [] }))
    )

    // Act & Assert
    await expect(enforceRoutePermission(ctx)).resolves.toBeUndefined()
  })

  it('should throw redirect to /dashboard when user lacks org permission', async () => {
    // Arrange
    const ctx = createBeforeLoadCtx('members:write')
    mockFetch.mockReturnValueOnce(
      jsonResponse(createSession({ role: 'member', permissions: ['members:read'] }))
    )

    // Act & Assert
    await expect(enforceRoutePermission(ctx)).rejects.toThrow('REDIRECT:/dashboard')
  })
})

// ---------------------------------------------------------------------------
// useCanAccess
// ---------------------------------------------------------------------------

describe('useCanAccess', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    mockUseRouter.mockReset()
    mockUseQuery.mockReset()
  })

  it('should return true for a route with no permission requirement', () => {
    // Arrange
    setupRouter({
      '/admin/dashboard': { options: { staticData: {} } },
    })
    setupUseQuery(createSession())

    // Act
    const { result } = renderHook(() => useCanAccess('/admin/dashboard'))

    // Assert
    expect(result.current).toBe(true)
  })

  it('should return false when the route is not found in the router', () => {
    // Arrange
    setupRouter({})
    setupUseQuery(createSession())

    // Act
    const { result } = renderHook(() => useCanAccess('/nonexistent'))

    // Assert
    expect(result.current).toBe(false)
  })

  it('should return false when no session is available', () => {
    // Arrange
    setupRouter({
      '/admin/users': {
        options: { staticData: { permission: 'role:superadmin' } },
      },
    })
    setupUseQuery(null)

    // Act
    const { result } = renderHook(() => useCanAccess('/admin/users'))

    // Assert
    expect(result.current).toBe(false)
  })

  it('should return true for superadmin accessing role:superadmin route', () => {
    // Arrange
    setupRouter({
      '/admin/users': {
        options: { staticData: { permission: 'role:superadmin' } },
      },
    })
    setupUseQuery(createSession({ role: 'superadmin' }))

    // Act
    const { result } = renderHook(() => useCanAccess('/admin/users'))

    // Assert
    expect(result.current).toBe(true)
  })

  it('should return false for non-superadmin accessing role:superadmin route', () => {
    // Arrange
    setupRouter({
      '/admin/users': {
        options: { staticData: { permission: 'role:superadmin' } },
      },
    })
    setupUseQuery(createSession({ role: 'member' }))

    // Act
    const { result } = renderHook(() => useCanAccess('/admin/users'))

    // Assert
    expect(result.current).toBe(false)
  })

  it('should return true when user has the required permission', () => {
    // Arrange
    setupRouter({
      '/admin/members': {
        options: { staticData: { permission: 'members:write' } },
      },
    })
    setupUseQuery(createSession({ role: 'member', permissions: ['members:write'] }))

    // Act
    const { result } = renderHook(() => useCanAccess('/admin/members'))

    // Assert
    expect(result.current).toBe(true)
  })

  it('should return true for superadmin accessing any permission route (bypass)', () => {
    // Arrange
    setupRouter({
      '/admin/members': {
        options: { staticData: { permission: 'members:write' } },
      },
    })
    setupUseQuery(createSession({ role: 'superadmin', permissions: [] }))

    // Act
    const { result } = renderHook(() => useCanAccess('/admin/members'))

    // Assert
    expect(result.current).toBe(true)
  })

  it('should return false when user lacks the required permission', () => {
    // Arrange
    setupRouter({
      '/admin/members': {
        options: { staticData: { permission: 'members:write' } },
      },
    })
    setupUseQuery(createSession({ role: 'member', permissions: ['members:read'] }))

    // Act
    const { result } = renderHook(() => useCanAccess('/admin/members'))

    // Assert
    expect(result.current).toBe(false)
  })
})
