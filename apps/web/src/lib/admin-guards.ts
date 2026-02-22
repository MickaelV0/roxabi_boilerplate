import { redirect } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import type { BeforeLoadContext } from '@/lib/route-guards'

type SessionData = {
  user: { role?: string }
  permissions?: string[]
}

function isSessionWithRole(data: unknown): data is SessionData {
  if (data == null || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  if (obj.user == null || typeof obj.user !== 'object') return false
  return true
}

/** Redirect non-admin users to /dashboard.
 *  Allows superadmins unconditionally, or users with `members:write` permission.
 *  Used in `beforeLoad` for admin routes. */
export async function requireAdmin(_ctx?: BeforeLoadContext) {
  if (typeof window === 'undefined') {
    // SSR renders the shell only; auth is enforced client-side on hydration.
    return
  }
  const { data } = await authClient.getSession()
  if (!data) throw redirect({ to: '/login' })

  if (!isSessionWithRole(data)) throw redirect({ to: '/dashboard' })

  // Super admins always have admin access
  if (data.user.role === 'superadmin') return

  // Otherwise check for admin-level org permissions
  if (data.permissions?.includes('members:write')) return

  // Not an admin -- redirect to dashboard
  throw redirect({ to: '/dashboard' })
}

/** Redirect non-superadmin users to /admin.
 *  Used in `beforeLoad` for system-level admin routes. */
export async function requireSuperAdmin(_ctx?: BeforeLoadContext) {
  if (typeof window === 'undefined') {
    return
  }
  const { data } = await authClient.getSession()
  if (!data) throw redirect({ to: '/login' })
  if (!isSessionWithRole(data)) throw redirect({ to: '/admin' })
  if (data.user.role !== 'superadmin') throw redirect({ to: '/admin' })
}
