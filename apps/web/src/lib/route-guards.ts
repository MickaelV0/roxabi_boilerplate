import type { ParsedLocation } from '@tanstack/react-router'
import { redirect } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'

/** Subset of TanStack Router's beforeLoad context relevant to route guards.
 *  Accepting the full context now enables redirect-back-after-login later. */
export type BeforeLoadContext = {
  location: ParsedLocation
  preload: boolean
  cause: 'preload' | 'enter' | 'stay'
}

/** Validate a redirect target to prevent open-redirect attacks.
 *  Returns the value if it's a safe relative path, or '/dashboard' otherwise. */
export function safeRedirect(value: string | undefined): string {
  if (!value) return '/dashboard'
  if (!value.startsWith('/') || value.startsWith('//')) return '/dashboard'
  try {
    const url = new URL(value, 'http://localhost')
    if (url.hostname !== 'localhost') return '/dashboard'
  } catch {
    return '/dashboard'
  }
  return value
}

/** Redirect unauthenticated users to /login.
 *  Used in `beforeLoad` for routes that require a session.
 *  Captures the current path as a `redirect` search param so the user
 *  lands back on the intended page after login. */
export async function requireAuth(ctx?: BeforeLoadContext) {
  if (typeof window === 'undefined') {
    // @security Server-side loaders MUST NOT fetch sensitive data without auth.
    // SSR renders the shell only; auth is enforced client-side on hydration.
    return
  }
  const { data } = await authClient.getSession()
  if (!data) {
    const redirectTo = ctx ? ctx.location.pathname + ctx.location.searchStr : undefined
    throw redirect({
      to: '/login',
      search: redirectTo ? { redirect: redirectTo } : undefined,
    })
  }
}

/** Redirect authenticated users to /dashboard.
 *  Used in `beforeLoad` for guest-only routes (login, register, landing). */
export async function requireGuest(_ctx?: BeforeLoadContext) {
  if (typeof window === 'undefined') {
    // @security Server-side loaders MUST NOT fetch sensitive data without auth.
    // SSR renders the shell only; auth is enforced client-side on hydration.
    return
  }
  const { data } = await authClient.getSession()
  if (data) throw redirect({ to: '/dashboard' })
}
