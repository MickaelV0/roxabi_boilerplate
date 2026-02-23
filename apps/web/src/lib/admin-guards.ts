import { redirect } from '@tanstack/react-router'
import type { BeforeLoadContext } from '@/lib/route-guards'

type EnrichedSession = {
  user: { id: string; name?: string; email: string; role?: string }
  session: Record<string, unknown>
  permissions: string[]
}

function isEnrichedSession(data: unknown): data is EnrichedSession {
  if (data == null || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  if (obj.user == null || typeof obj.user !== 'object') return false
  return true
}

/**
 * Fetch the enriched session (with RBAC permissions) from the NestJS backend.
 * Returns `null` when the user is not authenticated.
 *
 * NOTE: This function uses raw `fetch('/api/session')` instead of the Better Auth
 * client (`authClient.getSession()`). This is intentional because the Better Auth
 * client returns only the standard session (user + session data) without the RBAC
 * `permissions` array. The NestJS `/api/session` endpoint enriches the session with
 * permissions resolved via `PermissionService.getPermissions()`, which admin guards
 * need to check `members:write` and other org-level permissions.
 *
 * If Better Auth's client SDK is ever extended to support custom session fields
 * (e.g., via a plugin), this should be migrated to use the auth client instead.
 */
async function fetchEnrichedSession(): Promise<EnrichedSession | null> {
  try {
    const res = await fetch('/api/session', { credentials: 'include' })
    if (!res.ok) return null
    const data: unknown = await res.json()
    if (!isEnrichedSession(data)) return null
    return data
  } catch {
    return null
  }
}

/** Redirect non-admin users to /dashboard.
 *  Allows superadmins unconditionally, or users with `members:write` permission.
 *  Used in `beforeLoad` for admin routes. */
export async function requireAdmin(_ctx?: BeforeLoadContext) {
  if (typeof window === 'undefined') {
    // SECURITY NOTE: During SSR we cannot call /api/session (no browser cookies).
    // Returning early means the admin layout shell (sidebar chrome) is rendered
    // server-side and included in the initial HTML. This is acceptable because:
    //   1. No protected data is fetched or rendered during SSR -- all data-loading
    //      hooks run client-side only.
    //   2. On hydration this guard re-runs with cookies, enforcing the real
    //      redirect to /login or /dashboard before any interactive content appears.
    //   3. The sidebar navigation links are public routes that are not secret.
    // If the admin layout ever renders sensitive data during SSR, this must be
    // revisited (e.g. throw redirect to a loading/auth-check page).
    return
  }
  const session = await fetchEnrichedSession()
  if (!session) throw redirect({ to: '/login' })

  // Super admins always have admin access
  if (session.user.role === 'superadmin') return

  // Otherwise check for admin-level org permissions
  if (session.permissions.includes('members:write')) return

  // Not an admin -- redirect to dashboard
  throw redirect({ to: '/dashboard' })
}

/** Redirect non-superadmin users to /admin.
 *  Used in `beforeLoad` for system-level admin routes. */
export async function requireSuperAdmin(_ctx?: BeforeLoadContext) {
  if (typeof window === 'undefined') {
    // Same SSR trade-off as requireAdmin -- see comment above.
    return
  }
  const session = await fetchEnrichedSession()
  if (!session) throw redirect({ to: '/login' })
  if (session.user.role !== 'superadmin') throw redirect({ to: '/admin' })
}
