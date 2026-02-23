import { createFileRoute } from '@tanstack/react-router'
import { requireSuperAdmin } from '@/lib/admin-guards'

export const Route = createFileRoute('/admin/users/$userId')({
  beforeLoad: requireSuperAdmin,
  component: AdminUserDetailPage,
  head: () => ({ meta: [{ title: 'User Detail | Admin | Roxabi' }] }),
})

function AdminUserDetailPage() {
  // TODO: implement — User detail with:
  // - Profile section (name, email, role, status, avatar, dates)
  // - Org memberships table (org name, role, joined date)
  // - Activity summary (last 10 audit entries, expandable diff)
  // - Action buttons: Edit, Ban/Unban, Delete/Restore
  return <div>TODO: Admin User Detail</div>
}
