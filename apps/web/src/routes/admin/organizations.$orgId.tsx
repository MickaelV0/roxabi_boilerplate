import type { AdminOrgDetail } from '@repo/types'
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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeftIcon, BuildingIcon, CalendarIcon, NetworkIcon, UsersIcon } from 'lucide-react'
import { OrgActions } from '@/components/admin/org-actions'
import { requireSuperAdmin } from '@/lib/admin-guards'

export const Route = createFileRoute('/admin/organizations/$orgId')({
  beforeLoad: requireSuperAdmin,
  component: AdminOrgDetailPage,
  head: () => ({ meta: [{ title: 'Organization Detail | Admin | Roxabi' }] }),
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const BACK_LINK_CLASS =
  'inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors'

function BackLink() {
  return (
    <Link to="/admin/organizations" className={BACK_LINK_CLASS}>
      <ArrowLeftIcon className="size-4" />
      Back to Organizations
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

function ProfileField({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {children ?? <p className="text-sm font-medium">{value}</p>}
      </div>
    </div>
  )
}

function ProfileCard({ data }: { data: AdminOrgDetail }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BuildingIcon className="size-4" />
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ProfileField icon={BuildingIcon} label="Name" value={data.name} />
          <ProfileField icon={BuildingIcon} label="Slug" value={data.slug ?? '-'} />
          <ProfileField icon={NetworkIcon} label="Parent Organization">
            {data.parentOrganization ? (
              <Link
                to="/admin/organizations/$orgId"
                params={{ orgId: data.parentOrganization.id }}
                className="text-sm font-medium hover:underline"
              >
                {data.parentOrganization.name}
              </Link>
            ) : (
              <p className="text-sm font-medium">None (top-level)</p>
            )}
          </ProfileField>
          <div className="flex items-center gap-2">
            <div className="size-4" />
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant={data.deletedAt ? 'secondary' : 'default'}>
                {data.deletedAt ? 'Archived' : 'Active'}
              </Badge>
            </div>
          </div>
          <ProfileField icon={CalendarIcon} label="Created" value={formatDate(data.createdAt)} />
          <ProfileField icon={CalendarIcon} label="Updated" value={formatDate(data.updatedAt)} />
        </div>
      </CardContent>
    </Card>
  )
}

function MembersCard({ members }: { members: AdminOrgDetail['members'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UsersIcon className="size-4" />
          Members ({members.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No members</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name || 'Unnamed'}</TableCell>
                  <TableCell className="text-muted-foreground">{member.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(member.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function ChildOrgsCard({ childOrgs }: { childOrgs: AdminOrgDetail['children'] }) {
  if (childOrgs.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <NetworkIcon className="size-4" />
          Child Organizations ({childOrgs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Members</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {childOrgs.map((child) => (
              <TableRow key={child.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link
                    to="/admin/organizations/$orgId"
                    params={{ orgId: child.id }}
                    className="font-medium text-foreground hover:underline"
                  >
                    {child.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{child.slug ?? '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{child.memberCount}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function AdminOrgDetailPage() {
  const { orgId } = Route.useParams()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<AdminOrgDetail>({
    queryKey: ['admin', 'organizations', orgId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/organizations/${orgId}`)
      if (!res.ok) throw new Error('Organization not found')
      return res.json()
    },
  })

  function handleActionComplete() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'organizations', orgId] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] })
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
              {error instanceof Error ? error.message : 'Organization not found'}
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
          <h1 className="text-2xl font-bold">{data.name}</h1>
          <p className="text-sm text-muted-foreground">{data.slug ?? 'No slug'}</p>
        </div>
        <OrgActions
          orgId={data.id}
          orgName={data.name}
          isArchived={Boolean(data.deletedAt)}
          onActionComplete={handleActionComplete}
        />
      </div>
      <ProfileCard data={data} />
      <MembersCard members={data.members} />
      <ChildOrgsCard childOrgs={data.children} />
    </div>
  )
}
