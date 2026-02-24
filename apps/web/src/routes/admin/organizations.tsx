import type { AdminOrganization } from '@repo/types'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, Outlet, useMatch, useNavigate } from '@tanstack/react-router'
import { BuildingIcon, ListIcon, NetworkIcon, PlusIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { FilterConfig } from '@/components/admin/filter-bar'
import { FilterBar } from '@/components/admin/filter-bar'
import { LoadMoreButton } from '@/components/admin/load-more-button'
import { TreeView } from '@/components/admin/tree-view'
import { useCursorPagination } from '@/hooks/use-cursor-pagination'
import { formatDate } from '@/lib/format-date'
import { enforceRoutePermission } from '@/lib/route-permissions'

export const Route = createFileRoute('/admin/organizations')({
  staticData: { permission: 'role:superadmin' },
  beforeLoad: enforceRoutePermission,
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
            memberCount: org.memberCount,
            deletedAt: org.deletedAt,
          }))}
          onSelect={handleSelect}
        />
      </CardContent>
    </Card>
  )
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}

type CreateOrgDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const NATIVE_SELECT_CLASS =
  'h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none'

function useCreateOrgMutation(callbacks: {
  onSuccess: (data: { id: string }) => void
  onError: (err: unknown) => void
}) {
  return useMutation({
    mutationFn: async (payload: { name: string; slug: string; parentOrganizationId?: string }) => {
      const res = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        if (res.status === 409) throw new Error(body?.message ?? 'Slug already exists')
        if (res.status === 400) throw new Error(body?.message ?? 'Invalid organization data')
        throw new Error(body?.message ?? 'Failed to create organization')
      }
      return res.json()
    },
    onSuccess: callbacks.onSuccess,
    onError: callbacks.onError,
  })
}

type CreateOrgFormFieldsProps = {
  name: string
  slug: string
  parentOrgId: string
  parentOrgs: AdminOrganization[]
  onNameChange: (v: string) => void
  onSlugChange: (v: string) => void
  onParentChange: (v: string) => void
}

function CreateOrgFormFields(props: CreateOrgFormFieldsProps) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="create-org-name">Name</Label>
        <Input
          id="create-org-name"
          value={props.name}
          onChange={(e) => props.onNameChange(e.target.value)}
          placeholder="Organization name"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="create-org-slug">Slug</Label>
        <Input
          id="create-org-slug"
          value={props.slug}
          onChange={(e) => props.onSlugChange(e.target.value)}
          placeholder="organization-slug"
        />
        <p className="text-xs text-muted-foreground">
          Auto-generated from name. Edit to customize.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="create-org-parent">Parent Organization (optional)</Label>
        <select
          id="create-org-parent"
          value={props.parentOrgId}
          onChange={(e) => props.onParentChange(e.target.value)}
          className={NATIVE_SELECT_CLASS}
        >
          <option value="">None (top-level)</option>
          {props.parentOrgs.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name} ({org.slug})
            </option>
          ))}
        </select>
      </div>
    </>
  )
}

async function fetchAllOrgs(): Promise<{ data: AdminOrganization[] }> {
  const res = await fetch('/api/admin/organizations?view=tree')
  if (!res.ok) throw new Error('Failed to fetch organizations')
  return res.json()
}

type CreateOrgFormState = {
  name: string
  setName: (v: string) => void
  slug: string
  parentOrgId: string
  setParentOrgId: (v: string) => void
  error: string | null
  setError: (v: string | null) => void
  mutation: ReturnType<typeof useCreateOrgMutation>
  parentOrgs: AdminOrganization[]
  handleSlugChange: (v: string) => void
  handleOpenChange: (next: boolean) => void
}

function useCreateOrgForm(
  open: boolean,
  onOpenChange: (open: boolean) => void
): CreateOrgFormState {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [parentOrgId, setParentOrgId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: allOrgs } = useQuery({
    queryKey: ['admin', 'organizations', 'all-for-parent'],
    queryFn: fetchAllOrgs,
    enabled: open,
  })

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(name))
  }, [name, slugEdited])

  function reset() {
    setName('')
    setSlug('')
    setSlugEdited(false)
    setParentOrgId('')
    setError(null)
  }

  const mutation = useCreateOrgMutation({
    onSuccess: (data) => {
      toast.success('Organization created successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] })
      onOpenChange(false)
      reset()
      navigate({ to: '/admin/organizations/$orgId', params: { orgId: data.id } })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to create'),
  })

  return {
    name,
    setName,
    slug,
    parentOrgId,
    setParentOrgId,
    error,
    setError,
    mutation,
    parentOrgs: allOrgs?.data?.filter((org) => !org.deletedAt) ?? [],
    handleSlugChange: (v) => {
      setSlugEdited(true)
      setSlug(v)
    },
    handleOpenChange: (next) => {
      if (!next) reset()
      onOpenChange(next)
    },
  }
}

function CreateOrganizationDialog({ open, onOpenChange }: CreateOrgDialogProps) {
  const form = useCreateOrgForm(open, onOpenChange)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    form.setError(null)
    const payload: { name: string; slug: string; parentOrganizationId?: string } = {
      name: form.name,
      slug: form.slug,
    }
    if (form.parentOrgId) payload.parentOrganizationId = form.parentOrgId
    form.mutation.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={form.handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>Create a new organization with an optional parent.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {form.error && (
            <p className="text-sm text-destructive rounded-md border border-destructive/20 bg-destructive/5 p-3">
              {form.error}
            </p>
          )}
          <CreateOrgFormFields
            name={form.name}
            slug={form.slug}
            parentOrgId={form.parentOrgId}
            parentOrgs={form.parentOrgs}
            onNameChange={form.setName}
            onSlugChange={form.handleSlugChange}
            onParentChange={form.setParentOrgId}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => form.handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!form.name.trim()} loading={form.mutation.isPending}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AdminOrganizationsPage() {
  const childMatch = useMatch({ from: '/admin/organizations/$orgId', shouldThrow: false })
  if (childMatch) return <Outlet />

  return <AdminOrganizationsList />
}

function AdminOrganizationsList() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filters, setFilters] = useState<OrgFilters>(INITIAL_FILTERS)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

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
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => setShowCreateDialog(true)} className="gap-1.5">
            <PlusIcon className="size-3.5" />
            Create Organization
          </Button>
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
      </div>

      <CreateOrganizationDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />

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
