import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'
import { ChevronDownIcon, ChevronRightIcon, ScrollTextIcon } from 'lucide-react'
import { useState } from 'react'
import { DiffViewer } from '@/components/admin/diff-viewer'
import type { FilterConfig } from '@/components/admin/filter-bar'
import { FilterBar } from '@/components/admin/filter-bar'
import { LoadMoreButton } from '@/components/admin/load-more-button'
import { useCursorPagination } from '@/hooks/use-cursor-pagination'
import { requireSuperAdmin } from '@/lib/admin-guards'

export const Route = createFileRoute('/admin/audit-logs')({
  beforeLoad: requireSuperAdmin,
  component: AdminAuditLogsPage,
  head: () => ({ meta: [{ title: 'Audit Logs | Admin | Roxabi' }] }),
})

type AuditEntry = {
  id: string
  timestamp: string
  actorId: string
  actorName: string
  actorType: string
  action: string
  resource: string
  resourceId: string
  organizationId: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
}

type AuditLogFilters = {
  from: string
  to: string
  actorId: string
  action: string
  resource: string
  organizationId: string
  search: string
}

const INITIAL_FILTERS: AuditLogFilters = {
  from: '',
  to: '',
  actorId: '',
  action: '',
  resource: '',
  organizationId: '',
  search: '',
}

const FILTER_CONFIGS: FilterConfig[] = [
  { key: 'from', label: 'From', type: 'date' },
  { key: 'to', label: 'To', type: 'date' },
  { key: 'action', label: 'Action', type: 'search', placeholder: 'e.g. user.updated' },
  { key: 'resource', label: 'Resource', type: 'search', placeholder: 'e.g. user' },
  { key: 'search', label: 'Search', type: 'search', placeholder: 'Search...' },
]

const FILTER_PARAM_KEYS = [
  'from',
  'to',
  'actorId',
  'action',
  'resource',
  'organizationId',
  'search',
] as const

function buildAuditLogParams(
  cursor: string | undefined,
  filters: AuditLogFilters
): URLSearchParams {
  const params = new URLSearchParams()
  if (cursor) params.set('cursor', cursor)
  for (const key of FILTER_PARAM_KEYS) {
    const value = filters[key]
    if (value) params.set(key, value)
  }
  return params
}

function actionVariant(action: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (action.includes('delete') || action.includes('remove') || action.includes('ban')) {
    return 'destructive'
  }
  if (action.includes('create') || action.includes('add') || action.includes('invite')) {
    return 'default'
  }
  if (action.includes('update') || action.includes('change') || action.includes('edit')) {
    return 'secondary'
  }
  return 'outline'
}

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function AuditLogsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
        <div key={i} className="flex items-center gap-4 px-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <ScrollTextIcon className="size-10 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">No audit log entries found</p>
    </div>
  )
}

function AdminAuditLogsPage() {
  const [filters, setFilters] = useState<AuditLogFilters>(INITIAL_FILTERS)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const {
    data: entries,
    loadMore,
    hasMore,
    isLoading,
    isLoadingMore,
  } = useCursorPagination<AuditEntry>({
    queryKey: ['admin', 'audit-logs', filters],
    fetchFn: async (cursor) => {
      const params = buildAuditLogParams(cursor, filters)
      const res = await fetch(`/api/admin/audit-logs?${params}`)
      if (!res.ok) throw new Error('Failed to fetch audit logs')
      return res.json()
    },
  })

  function handleFilterChange(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function handleFilterReset() {
    setFilters(INITIAL_FILTERS)
    setExpandedIds(new Set())
  }

  function toggleRow(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ScrollTextIcon className="size-6 text-foreground" />
        <h1 className="text-2xl font-bold">Audit Logs</h1>
      </div>

      {/* Filters */}
      <FilterBar
        filters={FILTER_CONFIGS}
        values={filters}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
      />

      {/* Loading state */}
      {isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <AuditLogsSkeleton />
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && entries.length === 0 && <EmptyState />}

      {/* Audit logs table */}
      {!isLoading && entries.length > 0 && (
        <AuditLogsTable entries={entries} expandedIds={expandedIds} onToggleRow={toggleRow} />
      )}

      {/* Load more */}
      <LoadMoreButton onClick={loadMore} hasMore={hasMore} isLoading={isLoadingMore} />
    </div>
  )
}

type AuditLogsTableProps = {
  entries: AuditEntry[]
  expandedIds: Set<string>
  onToggleRow: (id: string) => void
}

function AuditLogsTable({ entries, expandedIds, onToggleRow }: AuditLogsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Resource ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <AuditLogRow
                key={entry.id}
                entry={entry}
                isExpanded={expandedIds.has(entry.id)}
                onToggle={() => onToggleRow(entry.id)}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

type AuditLogRowProps = {
  entry: AuditEntry
  isExpanded: boolean
  onToggle: () => void
}

function AuditLogRow({ entry, isExpanded, onToggle }: AuditLogRowProps) {
  const hasDiff = entry.before !== null || entry.after !== null

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={hasDiff ? onToggle : undefined}
        aria-expanded={hasDiff ? isExpanded : undefined}
      >
        <TableCell className="w-8 px-2">
          {hasDiff &&
            (isExpanded ? (
              <ChevronDownIcon className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            ))}
        </TableCell>
        <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
          {formatTimestamp(entry.timestamp)}
        </TableCell>
        <TableCell className="font-medium">{entry.actorName}</TableCell>
        <TableCell>
          <Badge variant={actionVariant(entry.action)} className="font-mono text-xs">
            {entry.action}
          </Badge>
        </TableCell>
        <TableCell className="text-muted-foreground">{entry.resource}</TableCell>
        <TableCell className="text-muted-foreground font-mono text-xs">
          {entry.resourceId}
        </TableCell>
      </TableRow>

      {isExpanded && hasDiff && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/30 p-4">
            <DiffViewer before={entry.before} after={entry.after} />
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
