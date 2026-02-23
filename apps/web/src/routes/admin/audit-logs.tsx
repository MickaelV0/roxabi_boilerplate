import { createFileRoute } from '@tanstack/react-router'
import { requireSuperAdmin } from '@/lib/admin-guards'

export const Route = createFileRoute('/admin/audit-logs')({
  beforeLoad: requireSuperAdmin,
  component: AdminAuditLogsPage,
  head: () => ({ meta: [{ title: 'Audit Logs | Admin | Roxabi' }] }),
})

function AdminAuditLogsPage() {
  // TODO: implement — Audit log viewer with:
  // - FilterBar (date range, actor, action, resource, org, search)
  // - Cursor-paginated table (timestamp, actor, action, resource, org)
  // - Expandable rows → DiffViewer (before/after with redaction)
  // - LoadMoreButton at bottom
  return <div>TODO: Admin Audit Logs</div>
}
