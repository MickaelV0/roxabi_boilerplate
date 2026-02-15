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

/** Redirect unauthenticated users to /login.
 *  Used in `beforeLoad` for routes that require a session. */
export async function requireAuth(_ctx?: BeforeLoadContext) {
  if (typeof window === 'undefined') {
    // @security Server-side loaders MUST NOT fetch sensitive data without auth.
    // SSR renders the shell only; auth is enforced client-side on hydration.
    return
  }
  const { data } = await authClient.getSession()
  if (!data) throw redirect({ to: '/login' })
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
