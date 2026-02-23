import type { AdminUser } from '@repo/types'
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
import { createFileRoute, Link } from '@tanstack/react-router'
import { ShieldIcon, UsersIcon } from 'lucide-react'
import { useState } from 'react'
import type { FilterConfig } from '@/components/admin/filter-bar'
import { FilterBar } from '@/components/admin/filter-bar'
import { LoadMoreButton } from '@/components/admin/load-more-button'
import { useCursorPagination } from '@/hooks/use-cursor-pagination'
import { requireSuperAdmin } from '@/lib/admin-guards'

export const Route = createFileRoute('/admin/users')({
  beforeLoad: requireSuperAdmin,
  component: AdminUsersPage,
  head: () => ({ meta: [{ title: 'Users | Admin | Roxabi' }] }),
})

type UserFilters = {
  role: string
  status: string
  organizationId: string
  search: string
}

const INITIAL_FILTERS: UserFilters = {
  role: '',
  status: '',
  organizationId: '',
  search: '',
}

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: 'role',
    label: 'Role',
    type: 'select',
    options: [
      { value: 'user', label: 'User' },
      { value: 'admin', label: 'Admin' },
      { value: 'superadmin', label: 'Super Admin' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'banned', label: 'Banned' },
      { value: 'archived', label: 'Archived' },
    ],
  },
  {
    key: 'search',
    label: 'Search',
    type: 'search',
    placeholder: 'Search by name or email...',
  },
]

function statusVariant(user: AdminUser): 'default' | 'destructive' | 'secondary' {
  if (user.banned) return 'destructive'
  if (user.deletedAt) return 'secondary'
  return 'default'
}

function statusLabel(user: AdminUser): string {
  if (user.banned) return 'Banned'
  if (user.deletedAt) return 'Archived'
  return 'Active'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function UsersTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
        <div key={i} className="flex items-center gap-4 px-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-6 w-20 rounded-full" />
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
      <UsersIcon className="size-10 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">No users found</p>
    </div>
  )
}

function AdminUsersPage() {
  const [filters, setFilters] = useState<UserFilters>(INITIAL_FILTERS)

  const {
    data: users,
    loadMore,
    hasMore,
    isLoading,
    isLoadingMore,
  } = useCursorPagination<AdminUser>({
    queryKey: ['admin', 'users', filters],
    fetchFn: async (cursor) => {
      const params = new URLSearchParams()
      if (cursor) params.set('cursor', cursor)
      if (filters.role) params.set('role', filters.role)
      if (filters.status) params.set('status', filters.status)
      if (filters.organizationId) params.set('organizationId', filters.organizationId)
      if (filters.search) params.set('search', filters.search)
      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    },
  })

  function handleFilterChange(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function handleFilterReset() {
    setFilters(INITIAL_FILTERS)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ShieldIcon className="size-6 text-foreground" />
        <h1 className="text-2xl font-bold">Users</h1>
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
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <UsersTableSkeleton />
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && users.length === 0 && <EmptyState />}

      {/* Users table */}
      {!isLoading && users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link
                        to="/admin/users/$userId"
                        params={{ userId: user.id }}
                        className="font-medium text-foreground hover:underline"
                      >
                        {user.name || 'Unnamed'}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.role ?? 'user'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(user)}>{statusLabel(user)}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Load more */}
      <LoadMoreButton onClick={loadMore} hasMore={hasMore} isLoading={isLoadingMore} />
    </div>
  )
}
