import { describe, expect, it, vi } from 'vitest'
import type { EnrichedSession } from './routePermissions'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@tanstack/react-router', () => ({
  redirect: (opts: { to: string; search?: Record<string, string> }) => {
    const error = new Error(`REDIRECT:${opts.to}`)
    ;(error as unknown as Record<string, unknown>).redirectOpts = opts
    return error
  },
}))

// Import after mocks are set up
import { requireAuth, requireGuest, safeRedirect } from './routeGuards'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validSession: EnrichedSession = {
  user: { id: '1', email: 'test@example.com' },
  session: {},
  permissions: [],
}

function createCtx(session: EnrichedSession | null, pathname = '/dashboard', searchStr = '') {
  return {
    location: {
      pathname,
      searchStr,
      href: pathname + searchStr,
      publicHref: pathname + searchStr,
      external: false,
      search: {},
      state: { __TSR_index: 0 },
      hash: '',
      maskedLocation: undefined,
      unmaskOnReload: false,
    },
    preload: false,
    cause: 'enter' as const,
    context: { session },
  }
}

// ---------------------------------------------------------------------------
// safeRedirect
// ---------------------------------------------------------------------------

describe('safeRedirect', () => {
  it('should return a valid relative path unchanged', () => {
    expect(safeRedirect('/dashboard')).toBe('/dashboard')
  })

  it('should return another valid relative path unchanged', () => {
    expect(safeRedirect('/settings')).toBe('/settings')
  })

  it('should return a deeply nested valid path unchanged', () => {
    expect(safeRedirect('/org/123/settings/billing')).toBe('/org/123/settings/billing')
  })

  it('should return a path with query params unchanged', () => {
    expect(safeRedirect('/dashboard?tab=overview&page=1')).toBe('/dashboard?tab=overview&page=1')
  })

  it('should return /dashboard when value is undefined', () => {
    expect(safeRedirect(undefined)).toBe('/dashboard')
  })

  it('should return /dashboard when value is empty string', () => {
    expect(safeRedirect('')).toBe('/dashboard')
  })

  it('should block protocol-relative URLs (//evil.com)', () => {
    expect(safeRedirect('//evil.com')).toBe('/dashboard')
  })

  it('should block protocol-relative URLs with path (//evil.com/steal)', () => {
    expect(safeRedirect('//evil.com/steal')).toBe('/dashboard')
  })

  it('should block absolute URLs with https scheme', () => {
    expect(safeRedirect('https://evil.com')).toBe('/dashboard')
  })

  it('should block absolute URLs with http scheme', () => {
    expect(safeRedirect('http://evil.com/phish')).toBe('/dashboard')
  })

  it('should block javascript: protocol URIs', () => {
    expect(safeRedirect('javascript:alert(1)')).toBe('/dashboard')
  })

  it('should block paths that do not start with /', () => {
    expect(safeRedirect('dashboard')).toBe('/dashboard')
  })

  it('should block relative paths without leading slash', () => {
    expect(safeRedirect('settings/profile')).toBe('/dashboard')
  })

  it('should block data: URIs', () => {
    expect(safeRedirect('data:text/html,<script>alert(1)</script>')).toBe('/dashboard')
  })

  it('should block URL-encoded double-slash (/%2F/evil.com)', () => {
    expect(safeRedirect('/%2F/evil.com')).toBe('/dashboard')
  })

  it('should block URL-encoded backslash (/%5C/evil.com)', () => {
    expect(safeRedirect('/%5C/evil.com')).toBe('/dashboard')
  })

  it('should return /dashboard when decodeURIComponent throws (malformed percent-encoding)', () => {
    expect(safeRedirect('/%E')).toBe('/dashboard')
  })
})

// ---------------------------------------------------------------------------
// requireAuth
// ---------------------------------------------------------------------------

describe('requireAuth', () => {
  it('should throw redirect to /login when session is null', async () => {
    const ctx = createCtx(null)
    await expect(requireAuth(ctx)).rejects.toThrow('REDIRECT:/login')
  })

  it('should throw redirect to /login when context is not provided', async () => {
    await expect(requireAuth()).rejects.toThrow('REDIRECT:/login')
  })

  it('should not throw when session exists in context', async () => {
    const ctx = createCtx(validSession)
    await expect(requireAuth(ctx)).resolves.toBeUndefined()
  })

  it('should include redirect search param with current path', async () => {
    const ctx = createCtx(null, '/settings', '?tab=billing')

    let caughtError: Error | null = null
    try {
      await requireAuth(ctx)
    } catch (error) {
      caughtError = error as Error
    }

    expect(caughtError).not.toBeNull()
    const opts = (caughtError as unknown as Record<string, unknown>).redirectOpts as {
      to: string
      search?: { redirect: string }
    }
    expect(opts.to).toBe('/login')
    expect(opts.search).toEqual({ redirect: '/settings?tab=billing' })
  })

  it('should not include redirect search param when context is not provided', async () => {
    let caughtError: Error | null = null
    try {
      await requireAuth()
    } catch (error) {
      caughtError = error as Error
    }

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
  it('should not throw when session is null', async () => {
    const ctx = createCtx(null)
    await expect(requireGuest(ctx)).resolves.toBeUndefined()
  })

  it('should not throw when context is not provided', async () => {
    await expect(requireGuest()).resolves.toBeUndefined()
  })

  it('should throw redirect to /dashboard when session exists', async () => {
    const ctx = createCtx(validSession)
    await expect(requireGuest(ctx)).rejects.toThrow('REDIRECT:/dashboard')
  })
})
