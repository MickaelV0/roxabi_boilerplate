import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

const mockUseRouter = vi.fn()
const mockUseQuery = vi.fn()
const mockGetRequestHeader = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  redirect: (opts: { to: string }) => new Error(`REDIRECT:${opts.to}`),
  useRouter: (...args: unknown[]) => mockUseRouter(...args),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => ({
    handler: (fn: (...args: unknown[]) => unknown) => fn,
  }),
}))

vi.mock('@tanstack/react-start/server', () => ({
  getRequestHeader: (...args: unknown[]) => mockGetRequestHeader(...args),
}))

vi.mock('./env.server.js', () => ({
  env: { API_URL: 'http://localhost:4000' },
}))

// Import after mocks are set up
import { enforceRoutePermission, useCanAccess } from './routePermissions'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

/** Helper: build a beforeLoad context with session in context + optional permission. */
function createBeforeLoadCtx(
  permission?: string,
  session: ReturnType<typeof createSession> | null = null
) {
  const routeId = '/admin/test'
  return {
    routeId,
    matches: [
      {
        routeId,
        staticData: permission ? { permission } : {},
      },
    ],
    context: { session },
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
  it('should return early when no permission is defined in staticData', async () => {
    // Arrange
    const ctx = createBeforeLoadCtx()

    // Act
    const result = await enforceRoutePermission(ctx)

    // Assert
    expect(result).toBeUndefined()
  })

  it('should throw redirect to /login when session is null in context', async () => {
    // Arrange
    const ctx = createBeforeLoadCtx('role:superadmin', null)

    // Act & Assert
    await expect(enforceRoutePermission(ctx)).rejects.toThrow('REDIRECT:/login')
  })

  it('should allow superadmin for role:superadmin permission', async () => {
    // Arrange
    const ctx = createBeforeLoadCtx('role:superadmin', createSession({ role: 'superadmin' }))

    // Act & Assert
    await expect(enforceRoutePermission(ctx)).resolves.toBeUndefined()
  })

  it('should throw redirect to /admin when user does not have the required role', async () => {
    // Arrange
    const ctx = createBeforeLoadCtx('role:superadmin', createSession({ role: 'member' }))

    // Act & Assert
    await expect(enforceRoutePermission(ctx)).rejects.toThrow('REDIRECT:/admin')
  })

  it('should allow user with correct permission string (e.g. members:write)', async () => {
    // Arrange
    const ctx = createBeforeLoadCtx(
      'members:write',
      createSession({ role: 'member', permissions: ['members:write'] })
    )

    // Act & Assert
    await expect(enforceRoutePermission(ctx)).resolves.toBeUndefined()
  })

  it('should allow superadmin even for non-role permissions (bypass)', async () => {
    // Arrange
    const ctx = createBeforeLoadCtx(
      'members:write',
      createSession({ role: 'superadmin', permissions: [] })
    )

    // Act & Assert
    await expect(enforceRoutePermission(ctx)).resolves.toBeUndefined()
  })

  it('should throw redirect to /dashboard when user lacks org permission', async () => {
    // Arrange
    const ctx = createBeforeLoadCtx(
      'members:write',
      createSession({ role: 'member', permissions: ['members:read'] })
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
