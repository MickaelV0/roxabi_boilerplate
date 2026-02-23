import type { AdminUserDetail, AuditLogEntry } from '@repo/types'
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowLeftIcon,
  BuildingIcon,
  CalendarIcon,
  MailIcon,
  ShieldIcon,
  UserIcon,
} from 'lucide-react'
import { UserActions } from '@/components/admin/user-actions'
import { requireSuperAdmin } from '@/lib/admin-guards'

export const Route = createFileRoute('/admin/users/$userId')({
  beforeLoad: requireSuperAdmin,
  component: AdminUserDetailPage,
  head: () => ({ meta: [{ title: 'User Detail | Admin | Roxabi' }] }),
})

function formatDate(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatTimestamp(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusVariant(user: AdminUserDetail): 'default' | 'destructive' | 'secondary' {
  if (user.banned) return 'destructive'
  if (user.deletedAt) return 'secondary'
  return 'default'
}

function statusLabel(user: AdminUserDetail): string {
  if (user.banned) return 'Banned'
  if (user.deletedAt) return 'Archived'
  return 'Active'
}

const BACK_LINK_CLASS =
  'inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors'

function BackLink() {
  return (
    <Link to="/admin/users" className={BACK_LINK_CLASS}>
      <ArrowLeftIcon className="size-4" />
      Back to Users
    </Link>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-48" />
    </div>
  )
}

function ProfileCard({ data }: { data: AdminUserDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="size-4" />
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ProfileField icon={MailIcon} label="Email" value={data.email} />
          <div className="flex items-center gap-2">
            <ShieldIcon className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <Badge variant="outline" className="capitalize">
                {data.role ?? 'user'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-4" />
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant={statusVariant(data)}>{statusLabel(data)}</Badge>
            </div>
          </div>
          <ProfileField icon={CalendarIcon} label="Created" value={formatDate(data.createdAt)} />
          <ProfileField icon={CalendarIcon} label="Updated" value={formatDate(data.updatedAt)} />
          {data.banned && data.banReason && (
            <div className="sm:col-span-2 lg:col-span-3">
              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground">Ban reason</p>
              <p className="text-sm text-destructive">{data.banReason}</p>
              {data.banExpires && (
                <p className="text-xs text-muted-foreground mt-1">
                  Expires: {formatDate(data.banExpires)}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

function MembershipsCard({ organizations }: { organizations: AdminUserDetail['organizations'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BuildingIcon className="size-4" />
          Organization Memberships
        </CardTitle>
      </CardHeader>
      <CardContent>
        {organizations.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No organization memberships
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Slug</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {org.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{org.slug ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function ActivityCard({ entries }: { entries: AuditLogEntry[] }) {
  if (entries.length === 0) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.slice(0, 10).map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {formatTimestamp(entry.timestamp)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {entry.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {entry.resource}
                  {entry.resourceId ? ` (${entry.resourceId.slice(0, 8)}...)` : ''}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function AdminUserDetailPage() {
  const { userId } = Route.useParams()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<AdminUserDetail>({
    queryKey: ['admin', 'users', userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}`)
      if (!res.ok) throw new Error('User not found')
      return res.json()
    },
  })

  function handleActionComplete() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <BackLink />
        <DetailSkeleton />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'User not found'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BackLink />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{data.name || 'Unnamed User'}</h1>
          <p className="text-sm text-muted-foreground">{data.email}</p>
        </div>
        <UserActions
          userId={data.id}
          userName={data.name || data.email}
          isBanned={Boolean(data.banned)}
          isArchived={Boolean(data.deletedAt)}
          onActionComplete={handleActionComplete}
        />
      </div>
      <ProfileCard data={data} />
      <MembershipsCard organizations={data.organizations} />
      {data.activitySummary && <ActivityCard entries={data.activitySummary} />}
    </div>
  )
}
