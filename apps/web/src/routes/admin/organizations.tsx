import type { AdminOrganization } from '@repo/types'
import {
  Badge,
  Button,
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
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { BuildingIcon, ListIcon, NetworkIcon } from 'lucide-react'
import { useState } from 'react'
import type { FilterConfig } from '@/components/admin/filter-bar'
import { FilterBar } from '@/components/admin/filter-bar'
import { LoadMoreButton } from '@/components/admin/load-more-button'
import { TreeView } from '@/components/admin/tree-view'
import { useCursorPagination } from '@/hooks/use-cursor-pagination'
import { requireSuperAdmin } from '@/lib/admin-guards'

export const Route = createFileRoute('/admin/organizations')({
  beforeLoad: requireSuperAdmin,
  component: AdminOrganizationsPage,
  head: () => ({ meta: [{ title: 'Organizations | Admin | Roxabi' }] }),
})

type OrgFilters = {
  status: string
  search: string
}

const INITIAL_FILTERS: OrgFilters = {
  status: '',
  search: '',
}

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'archived', label: 'Archived' },
    ],
  },
  {
    key: 'search',
    label: 'Search',
    type: 'search',
    placeholder: 'Search by name or slug...',
  },
]

type ViewMode = 'list' | 'tree'

type TreeApiResponse = {
  data: AdminOrganization[]
  treeViewAvailable: boolean
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function statusVariant(org: AdminOrganization): 'default' | 'secondary' {
  if (org.deletedAt) return 'secondary'
  return 'default'
}

function statusLabel(org: AdminOrganization): string {
  if (org.deletedAt) return 'Archived'
  return 'Active'
}

function OrgTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
        <div key={i} className="flex items-center gap-4 px-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-12 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <BuildingIcon className="size-10 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">No organizations found</p>
    </div>
  )
}

function FlatListView({ filters }: { filters: OrgFilters }) {
  const {
    data: organizations,
    loadMore,
    hasMore,
    isLoading,
    isLoadingMore,
  } = useCursorPagination<AdminOrganization>({
    queryKey: ['admin', 'organizations', 'list', filters],
    fetchFn: async (cursor) => {
      const params = new URLSearchParams()
      if (cursor) params.set('cursor', cursor)
      if (filters.status) params.set('status', filters.status)
      if (filters.search) params.set('search', filters.search)
      const res = await fetch(`/api/admin/organizations?${params}`)
      if (!res.ok) throw new Error('Failed to fetch organizations')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <OrgTableSkeleton />
        </CardContent>
      </Card>
    )
  }

  if (organizations.length === 0) {
    return <EmptyState />
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link
                      to="/admin/organizations/$orgId"
                      params={{ orgId: org.id }}
                      className="font-medium text-foreground hover:underline"
                    >
                      {org.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{org.slug ?? '-'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {org.parentOrganizationId ? (
                      <Link
                        to="/admin/organizations/$orgId"
                        params={{ orgId: org.parentOrganizationId }}
                        className="hover:underline"
                      >
                        View parent
                      </Link>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{org.memberCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(org)}>{statusLabel(org)}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(org.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <LoadMoreButton onClick={loadMore} hasMore={hasMore} isLoading={isLoadingMore} />
    </>
  )
}

function TreeModeView() {
  const navigate = useNavigate()

  const {
    data: treeData,
    isLoading,
    error,
  } = useQuery<TreeApiResponse>({
    queryKey: ['admin', 'organizations', 'tree'],
    queryFn: async () => {
      const res = await fetch('/api/admin/organizations?view=tree')
      if (!res.ok) throw new Error('Failed to fetch organizations')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Tree</CardTitle>
        </CardHeader>
        <CardContent>
          <OrgTableSkeleton />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'Failed to load organizations'}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (treeData && !treeData.treeViewAvailable) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Too many organizations for tree view, use flat list instead.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!treeData || treeData.data.length === 0) {
    return <EmptyState />
  }

  function handleSelect(id: string) {
    navigate({ to: '/admin/organizations/$orgId', params: { orgId: id } })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Tree</CardTitle>
      </CardHeader>
      <CardContent>
        <TreeView
          nodes={treeData.data.map((org) => ({
            id: org.id,
            name: org.name,
            slug: org.slug,
            parentOrganizationId: org.parentOrganizationId,
          }))}
          onSelect={handleSelect}
        />
      </CardContent>
    </Card>
  )
}

function AdminOrganizationsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filters, setFilters] = useState<OrgFilters>(INITIAL_FILTERS)

  function handleFilterChange(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function handleFilterReset() {
    setFilters(INITIAL_FILTERS)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BuildingIcon className="size-6 text-foreground" />
          <h1 className="text-2xl font-bold">Organizations</h1>
        </div>
        <div className="flex gap-1 rounded-md border p-0.5">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="gap-1.5"
            aria-pressed={viewMode === 'list'}
          >
            <ListIcon className="size-3.5" />
            List
          </Button>
          <Button
            variant={viewMode === 'tree' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('tree')}
            className="gap-1.5"
            aria-pressed={viewMode === 'tree'}
          >
            <NetworkIcon className="size-3.5" />
            Tree
          </Button>
        </div>
      </div>

      {/* Filters (only in list mode) */}
      {viewMode === 'list' && (
        <FilterBar
          filters={FILTER_CONFIGS}
          values={filters}
          onChange={handleFilterChange}
          onReset={handleFilterReset}
        />
      )}

      {/* Content */}
      {viewMode === 'list' ? <FlatListView filters={filters} /> : <TreeModeView />}
    </div>
  )
}
