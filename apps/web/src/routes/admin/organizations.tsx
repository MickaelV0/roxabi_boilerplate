import { createFileRoute } from '@tanstack/react-router'
import { requireSuperAdmin } from '@/lib/admin-guards'

export const Route = createFileRoute('/admin/organizations')({
  beforeLoad: requireSuperAdmin,
  component: AdminOrganizationsPage,
  head: () => ({ meta: [{ title: 'Organizations | Admin | Roxabi' }] }),
})

function AdminOrganizationsPage() {
  // TODO: implement — Cross-tenant organization list with:
  // - FilterBar (status, search)
  // - List/Tree view toggle
  // - Flat list: cursor-paginated table (name, slug, members, parent, status, created)
  // - Tree view: expandable/collapsible hierarchy (disabled if > 1000 orgs)
  // - "Create Organization" button → dialog
  // - LoadMoreButton at bottom (flat view)
  // - Clickable rows → /admin/organizations/:id
  return <div>TODO: Admin Organizations List</div>
}
