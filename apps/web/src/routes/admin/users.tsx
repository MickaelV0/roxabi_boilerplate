import { createFileRoute } from '@tanstack/react-router'
import { requireSuperAdmin } from '@/lib/admin-guards'

export const Route = createFileRoute('/admin/users')({
  beforeLoad: requireSuperAdmin,
  component: AdminUsersPage,
  head: () => ({ meta: [{ title: 'Users | Admin | Roxabi' }] }),
})

function AdminUsersPage() {
  // TODO: implement — Cross-tenant user list with:
  // - FilterBar (role, status, org, search)
  // - Cursor-paginated table (name, email, role, orgs, status, last active)
  // - LoadMoreButton at bottom
  // - Clickable rows → /admin/users/:id
  return <div>TODO: Admin Users List</div>
}
