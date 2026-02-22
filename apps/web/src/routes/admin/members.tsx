import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
} from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'
import { SearchIcon, UsersIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ErrorCard } from '@/components/admin/ErrorCard'
import { InviteDialog } from '@/components/admin/InviteDialog'
import { MembersTable } from '@/components/admin/MembersTable'
import { PaginationControls } from '@/components/admin/PaginationControls'
import { PendingInvitations } from '@/components/admin/PendingInvitations'
import { authClient } from '@/lib/auth-client'
import { parseErrorMessage } from '@/lib/error-utils'
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
  slug: string
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

function useAdminMembers(orgId: string | undefined) {
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
  }, [version, pagination.page, orgId])

  return { members, pagination, isLoading, error, refetch, goToPage }
}

// ---------------------------------------------------------------------------
// Hook: useOrgRoles
// ---------------------------------------------------------------------------

function useOrgRoles(orgId: string | undefined) {
  const [roles, setRoles] = useState<OrgRole[]>([])

  useEffect(() => {
    const controller = new AbortController()
    fetchRoles(controller.signal).then((data) => {
      if (!controller.signal.aborted) setRoles(data)
    })
    return () => controller.abort()
  }, [orgId])

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

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <UsersIcon className="size-10 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{m.org_members_empty()}</p>
    </div>
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

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

function AdminMembersPage() {
  const { data: activeOrg } = authClient.useActiveOrganization()
  const { members, pagination, isLoading, error, refetch, goToPage } = useAdminMembers(activeOrg?.id)
  const roles = useOrgRoles(activeOrg?.id)

  const [searchQuery, setSearchQuery] = useState('')
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null)
  const [inviteRefreshKey, setInviteRefreshKey] = useState(0)

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

  function handleInviteSuccess() {
    refetch()
    setInviteRefreshKey((k) => k + 1)
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
        <InviteDialog roles={roles} onSuccess={handleInviteSuccess} />
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
            <CardDescription>{m.admin_members_count({ count: pagination.total })}</CardDescription>
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
              <MembersTable
                members={filteredMembers}
                roles={roles}
                onRoleChange={handleRoleChange}
                onRemove={setRemoveMemberId}
              />
            )}

            <PaginationControls pagination={pagination} onPageChange={goToPage} />
          </CardContent>
        </Card>
      )}

      {/* Pending invitations */}
      <PendingInvitations refreshKey={inviteRefreshKey} />

      {/* Remove member confirmation dialog */}
      <RemoveMemberDialog
        memberId={removeMemberId}
        onConfirm={handleRemoveMember}
        onCancel={() => setRemoveMemberId(null)}
      />
    </div>
  )
}
