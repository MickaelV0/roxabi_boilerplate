import { redirect } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'

/** Redirect unauthenticated users to /login.
 *  Used in `beforeLoad` for routes that require a session. */
export async function requireAuth() {
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
export async function requireGuest() {
  if (typeof window === 'undefined') {
    // @security Server-side loaders MUST NOT fetch sensitive data without auth.
    // SSR renders the shell only; auth is enforced client-side on hydration.
    return
  }
  const { data } = await authClient.getSession()
  if (data) throw redirect({ to: '/dashboard' })
}
