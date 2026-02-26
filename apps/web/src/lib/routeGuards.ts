import type { ParsedLocation } from '@tanstack/react-router'
import { redirect } from '@tanstack/react-router'

/** Subset of TanStack Router's beforeLoad context relevant to route guards.
 *  Accepting the full context now enables redirect-back-after-login later. */
export type BeforeLoadContext = {
  location: ParsedLocation
  preload: boolean
  cause: 'preload' | 'enter' | 'stay'
  context: { session: unknown }
}

/** Validate a redirect target to prevent open-redirect attacks.
 *  Returns the value if it's a safe relative path, or '/dashboard' otherwise. */
export function safeRedirect(value: string | undefined): string {
  if (!value) return '/dashboard'
  if (!value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  try {
    // Block URL-encoded path traversal (e.g., /%2F/evil.com, /%5C/evil.com)
    const decoded = decodeURIComponent(value)
    if (decoded.startsWith('//') || decoded.includes('\\')) return '/dashboard'
    const url = new URL(value, 'http://localhost')
    if (url.origin !== 'http://localhost') return '/dashboard'
  } catch {
    return '/dashboard'
  }
  return value
}

/** Redirect unauthenticated users to /login.
 *  Used in `beforeLoad` for routes that require a session.
 *  Reads session from root route context (fetched once in __root.tsx beforeLoad).
 *  Captures the current path as a `redirect` search param so the user
 *  lands back on the intended page after login. */
export async function requireAuth(ctx?: BeforeLoadContext) {
  if (!ctx?.context?.session) {
    const redirectTo = ctx ? ctx.location.pathname + ctx.location.searchStr : undefined
    throw redirect({
      to: '/login',
      search: redirectTo ? { redirect: redirectTo } : undefined,
    })
  }
}

/** Redirect authenticated users to /dashboard.
 *  Used in `beforeLoad` for guest-only routes (login, register, landing).
 *  Reads session from root route context (fetched once in __root.tsx beforeLoad). */
export async function requireGuest(_ctx?: BeforeLoadContext) {
  if (_ctx?.context?.session) throw redirect({ to: '/dashboard' })
}
