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

/** Fetch the enriched session (with RBAC permissions) from the NestJS backend.
 *  Returns `null` when the user is not authenticated. */
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
    // SSR renders the shell only; auth is enforced client-side on hydration.
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
    return
  }
  const session = await fetchEnrichedSession()
  if (!session) throw redirect({ to: '/login' })
  if (session.user.role !== 'superadmin') throw redirect({ to: '/admin' })
}
