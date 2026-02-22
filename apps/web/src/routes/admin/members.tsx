import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'
import {
  AlertCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { parseErrorMessage } from '@/lib/error-utils'
import { roleBadgeVariant, roleLabel } from '@/lib/org-utils'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/admin/members')({
  component: AdminMembersPage,
  head: () => ({
    meta: [{ title: `${m.org_members_title()} | Roxabi` }],
  }),
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Member = {
  id: string
  userId: string
  role: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    lastActive?: string | null
  }
}

type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

type MembersResponse = {
  data: Member[]
  pagination: PaginationMeta
}

type OrgRole = {
  id: string
  name: string
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

const PAGE_LIMIT = 20

async function fetchMembers(page: number, signal?: AbortSignal): Promise<MembersResponse> {
  const res = await fetch(`/api/admin/members?page=${page}&limit=${PAGE_LIMIT}`, {
    credentials: 'include',
    signal,
  })
  if (!res.ok) {
    const data: unknown = await res.json().catch(() => null)
    throw new Error(parseErrorMessage(data, m.auth_toast_error()))
  }
  return (await res.json()) as MembersResponse
}

async function fetchRoles(signal?: AbortSignal): Promise<OrgRole[]> {
  const res = await fetch('/api/roles', { credentials: 'include', signal })
  if (!res.ok) return []
  return (await res.json()) as OrgRole[]
}

async function inviteMember(email: string, roleId: string): Promise<void> {
  const res = await fetch('/api/admin/members/invite', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, roleId }),
  })
  if (!res.ok) {
    const data: unknown = await res.json().catch(() => null)
    throw new Error(parseErrorMessage(data, m.auth_toast_error()))
  }
}

async function updateMemberRole(memberId: string, roleId: string): Promise<void> {
  const res = await fetch(`/api/admin/members/${memberId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roleId }),
  })
  if (!res.ok) {
    const data: unknown = await res.json().catch(() => null)
    throw new Error(parseErrorMessage(data, m.auth_toast_error()))
  }
}

async function removeMember(memberId: string): Promise<void> {
  const res = await fetch(`/api/admin/members/${memberId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) {
    const data: unknown = await res.json().catch(() => null)
    throw new Error(parseErrorMessage(data, m.auth_toast_error()))
  }
}

// ---------------------------------------------------------------------------
// Hook: useAdminMembers
// ---------------------------------------------------------------------------

function useAdminMembers() {
  const [members, setMembers] = useState<Member[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  const refetch = useCallback(() => setVersion((v) => v + 1), [])

  const goToPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }))
    setVersion((v) => v + 1)
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: version triggers manual refetch
  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError(null)
    fetchMembers(pagination.page, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) {
          setMembers(res.data)
          setPagination(res.pagination)
          setIsLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : m.auth_toast_error())
          setIsLoading(false)
        }
      })
    return () => controller.abort()
  }, [version, pagination.page])

  return { members, pagination, isLoading, error, refetch, goToPage }
}

// ---------------------------------------------------------------------------
// Hook: useOrgRoles
// ---------------------------------------------------------------------------

function useOrgRoles() {
  const [roles, setRoles] = useState<OrgRole[]>([])

  useEffect(() => {
    const controller = new AbortController()
    fetchRoles(controller.signal).then((data) => {
      if (!controller.signal.aborted) setRoles(data)
    })
    return () => controller.abort()
  }, [])

  return roles
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MembersTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
        <div key={i} className="flex items-center gap-4 px-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto h-8 w-20" />
        </div>
      ))}
    </div>
  )
}

type ErrorCardProps = {
  message: string
  onRetry: () => void
}

function ErrorCard({ message, onRetry }: ErrorCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12">
        <AlertCircleIcon className="size-10 text-destructive" />
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <UsersIcon className="size-10 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{m.org_members_empty()}</p>
    </div>
  )
}

type InviteDialogProps = {
  roles: OrgRole[]
  onSuccess: () => void
}

function InviteDialog({ roles, onSuccess }: InviteDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Default to first role when roles load
  useEffect(() => {
    if (roles.length > 0 && !roleId) {
      const memberRole = roles.find((r) => r.name === 'member')
      setRoleId(memberRole?.id ?? roles[0]?.id ?? '')
    }
  }, [roles, roleId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !roleId) return
    setSubmitting(true)
    try {
      await inviteMember(email, roleId)
      toast.success(m.org_toast_invited({ email }))
      setEmail('')
      setOpen(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.auth_toast_error())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlusIcon className="mr-2 size-4" />
          {m.org_invite_title()}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{m.org_invite_title()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">{m.org_invite_email()}</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder={m.org_invite_email_placeholder()}
              required
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-role">{m.org_invite_role()}</Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {roleLabel(role.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {m.common_cancel()}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting || !email}>
              {submitting ? m.org_invite_sending() : m.org_invite_send()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type RoleSelectProps = {
  currentRole: string
  roles: OrgRole[]
  onRoleChange: (roleId: string) => void
  disabled?: boolean
}

function RoleSelect({ currentRole, roles, onRoleChange, disabled }: RoleSelectProps) {
  const currentRoleObj = roles.find((r) => r.name === currentRole)
  const currentRoleId = currentRoleObj?.id ?? ''

  return (
    <Select value={currentRoleId} onValueChange={onRoleChange} disabled={disabled}>
      <SelectTrigger className="h-7 w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role.id} value={role.id}>
            {roleLabel(role.name)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

type RemoveMemberDialogProps = {
  memberId: string | null
  onConfirm: () => void
  onCancel: () => void
}

function RemoveMemberDialog({ memberId, onConfirm, onCancel }: RemoveMemberDialogProps) {
  return (
    <AlertDialog
      open={memberId !== null}
      onOpenChange={(open: boolean) => {
        if (!open) onCancel()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{m.org_members_remove()}</AlertDialogTitle>
          <AlertDialogDescription>{m.org_members_remove_confirm()}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{m.common_cancel()}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            {m.org_members_remove()}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

type PaginationControlsProps = {
  pagination: PaginationMeta
  onPageChange: (page: number) => void
}

function PaginationControls({ pagination, onPageChange }: PaginationControlsProps) {
  if (pagination.totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between border-t px-2 pt-4">
      <p className="text-sm text-muted-foreground">
        Page {pagination.page} of {pagination.totalPages} ({pagination.total} members)
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          <ChevronLeftIcon className="mr-1 size-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          Next
          <ChevronRightIcon className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

function AdminMembersPage() {
  const { data: activeOrg } = authClient.useActiveOrganization()
  const { members, pagination, isLoading, error, refetch, goToPage } = useAdminMembers()
  const roles = useOrgRoles()

  const [searchQuery, setSearchQuery] = useState('')
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null)

  // Client-side search within the current page
  const filteredMembers = members.filter((member) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      member.user.name?.toLowerCase().includes(q) || member.user.email.toLowerCase().includes(q)
    )
  })

  async function handleRoleChange(memberId: string, roleId: string) {
    try {
      await updateMemberRole(memberId, roleId)
      toast.success(m.org_toast_role_updated())
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.auth_toast_error())
    }
  }

  async function handleRemoveMember() {
    if (!removeMemberId) return
    try {
      await removeMember(removeMemberId)
      toast.success(m.org_toast_member_removed())
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.auth_toast_error())
    } finally {
      setRemoveMemberId(null)
    }
  }

  if (!activeOrg) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{m.org_members_title()}</h1>
        <p className="text-muted-foreground">{m.org_switcher_no_org()}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{m.org_members_title()}</h1>
        <InviteDialog roles={roles} onSuccess={refetch} />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={m.org_members_search_placeholder()}
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Error state */}
      {error && <ErrorCard message={error} onRetry={refetch} />}

      {/* Loading state */}
      {isLoading && !error && (
        <Card>
          <CardHeader>
            <CardTitle>{m.org_members_active()}</CardTitle>
          </CardHeader>
          <CardContent>
            <MembersTableSkeleton />
          </CardContent>
        </Card>
      )}

      {/* Members table */}
      {!isLoading && !error && (
        <Card>
          <CardHeader>
            <CardTitle>{m.org_members_active()}</CardTitle>
            <CardDescription>
              {pagination.total} {pagination.total === 1 ? 'member' : 'members'} in this
              organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredMembers.length === 0 ? (
              searchQuery ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {m.org_members_no_results()}
                </p>
              ) : (
                <EmptyState />
              )
            ) : (
              <div className="overflow-x-auto">
                <Table className="w-full text-sm">
                  <TableHeader>
                    <TableRow className="border-b text-left text-muted-foreground">
                      <TableHead className="pb-2 pr-4 font-medium">
                        {m.org_members_name()}
                      </TableHead>
                      <TableHead className="pb-2 pr-4 font-medium">
                        {m.org_members_email()}
                      </TableHead>
                      <TableHead className="pb-2 pr-4 font-medium">
                        {m.org_members_role()}
                      </TableHead>
                      <TableHead className="pb-2 pr-4 font-medium">
                        {m.org_members_joined()}
                      </TableHead>
                      <TableHead className="pb-2 pr-4 font-medium">Last Active</TableHead>
                      <TableHead className="pb-2 font-medium">{m.org_members_actions()}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id} className="border-b last:border-0">
                        <TableCell className="py-3 pr-4">
                          {member.user.name ?? (
                            <span className="italic text-muted-foreground">No name</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 pr-4 text-muted-foreground">
                          {member.user.email}
                        </TableCell>
                        <TableCell className="py-3 pr-4">
                          {member.role !== 'owner' && roles.length > 0 ? (
                            <RoleSelect
                              currentRole={member.role}
                              roles={roles}
                              onRoleChange={(roleId) => handleRoleChange(member.id, roleId)}
                            />
                          ) : (
                            <Badge variant={roleBadgeVariant(member.role)}>
                              {roleLabel(member.role)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3 pr-4 text-muted-foreground">
                          {new Date(member.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="py-3 pr-4 text-muted-foreground">
                          {member.user.lastActive
                            ? new Date(member.user.lastActive).toLocaleDateString()
                            : '--'}
                        </TableCell>
                        <TableCell className="py-3">
                          {member.role !== 'owner' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setRemoveMemberId(member.id)}
                            >
                              {m.org_members_remove()}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <PaginationControls pagination={pagination} onPageChange={goToPage} />
          </CardContent>
        </Card>
      )}

      {/* Remove member confirmation dialog */}
      <RemoveMemberDialog
        memberId={removeMemberId}
        onConfirm={handleRemoveMember}
        onCancel={() => setRemoveMemberId(null)}
      />
    </div>
  )
}
