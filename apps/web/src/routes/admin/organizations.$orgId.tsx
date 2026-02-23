import { createFileRoute } from '@tanstack/react-router'
import { requireSuperAdmin } from '@/lib/admin-guards'

export const Route = createFileRoute('/admin/organizations/$orgId')({
  beforeLoad: requireSuperAdmin,
  component: AdminOrgDetailPage,
  head: () => ({ meta: [{ title: 'Organization Detail | Admin | Roxabi' }] }),
})

function AdminOrgDetailPage() {
  // TODO: implement — Organization detail with:
  // - Info section (name, slug, parent link, status, created, member count)
  // - Edit form (inline edit name, slug, parent dropdown)
  // - Members section (read-only table: name, email, role, joined)
  // - Child organizations section (list with links to detail)
  // - Action buttons: Delete (with impact preview), Restore
  return <div>TODO: Admin Organization Detail</div>
}
