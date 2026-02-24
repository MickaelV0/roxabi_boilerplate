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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { SearchIcon, UsersIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ErrorCard } from '@/components/admin/ErrorCard'
import { InviteDialog } from '@/components/admin/InviteDialog'
import { MembersTable } from '@/components/admin/MembersTable'
import { PaginationControls } from '@/components/admin/PaginationControls'
import { PendingInvitations } from '@/components/admin/PendingInvitations'
import type { MembersResponse, OrgRole } from '@/components/admin/types'
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
// Constants
// ---------------------------------------------------------------------------

const PAGE_LIMIT = 20
const SEARCH_DEBOUNCE_MS = 300

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function fetchMembers(
  page: number,
  search: string | undefined,
  signal?: AbortSignal
): Promise<MembersResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_LIMIT),
  })
  if (search) {
    params.set('search', search)
  }
  const res = await fetch(`/api/admin/members?${params.toString()}`, {
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

async function removeMemberApi(memberId: string): Promise<void> {
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

// S8: Include member name/email in the remove confirmation dialog
type MemberToRemove = {
  id: string
  name: string | null
  email: string
}

type RemoveMemberDialogProps = {
  member: MemberToRemove | null
  onConfirm: () => void
  onCancel: () => void
}

function RemoveMemberDialog({ member, onConfirm, onCancel }: RemoveMemberDialogProps) {
  const displayName = member?.name ?? member?.email ?? ''

  return (
    <AlertDialog
      open={member !== null}
      onOpenChange={(open: boolean) => {
        if (!open) onCancel()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{m.org_members_remove()}</AlertDialogTitle>
          <AlertDialogDescription>
            {m.org_members_remove_confirm()}{' '}
            <span className="font-medium text-foreground">{displayName}</span>
          </AlertDialogDescription>
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
// Custom hook: debounced search value
// ---------------------------------------------------------------------------

function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Custom hook: members page data and mutations
// ---------------------------------------------------------------------------

function useMembersSearch() {
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS)
  const [page, setPage] = useState(1)

  const prevSearchRef = useRef(debouncedSearch)
  useEffect(() => {
    if (prevSearchRef.current !== debouncedSearch) {
      setPage(1)
      prevSearchRef.current = debouncedSearch
    }
  }, [debouncedSearch])

  return { searchInput, setSearchInput, debouncedSearch, page, setPage }
}

function useMembersMutations(
  queryClient: ReturnType<typeof useQueryClient>,
  setMemberToRemove: (m: MemberToRemove | null) => void
) {
  const roleChangeMutation = useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId: string }) =>
      updateMemberRole(memberId, roleId),
    onSuccess: () => {
      toast.success(m.org_toast_role_updated())
      queryClient.invalidateQueries({ queryKey: ['admin-members'] })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : m.auth_toast_error())
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => removeMemberApi(memberId),
    onSuccess: () => {
      toast.success(m.org_toast_member_removed())
      queryClient.invalidateQueries({ queryKey: ['admin-members'] })
      queryClient.invalidateQueries({ queryKey: ['admin-invitations'] })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : m.auth_toast_error())
    },
    onSettled: () => {
      setMemberToRemove(null)
    },
  })

  return { roleChangeMutation, removeMemberMutation }
}

function useMembersPageQueries(orgId: string | undefined, page: number, debouncedSearch: string) {
  return useQuery({
    queryKey: ['admin-members', orgId, page, PAGE_LIMIT, debouncedSearch || undefined],
    queryFn: ({ signal }) => fetchMembers(page, debouncedSearch || undefined, signal),
    enabled: Boolean(orgId),
  })
}

// ---------------------------------------------------------------------------
// Sub-components for the members page layout
// ---------------------------------------------------------------------------

type MembersSearchBarProps = {
  searchInput: string
  onSearchChange: (value: string) => void
}

function MembersSearchBar({ searchInput, onSearchChange }: MembersSearchBarProps) {
  return (
    <div className="relative max-w-sm">
      <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={m.org_members_search_placeholder()}
        aria-label={m.org_members_search_placeholder()}
        value={searchInput}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
        className="pl-9"
      />
    </div>
  )
}

function MembersLoadingCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{m.org_members_active()}</CardTitle>
      </CardHeader>
      <CardContent>
        <MembersTableSkeleton />
      </CardContent>
    </Card>
  )
}

type MembersContentCardProps = {
  membersList: MembersResponse['data']
  pagination: MembersResponse['pagination']
  roles: OrgRole[]
  searchInput: string
  onRoleChange: (memberId: string, roleId: string) => void
  onRemove: (memberId: string) => void
  onPageChange: (page: number) => void
}

function MembersContentCard({
  membersList,
  pagination,
  roles,
  searchInput,
  onRoleChange,
  onRemove,
  onPageChange,
}: MembersContentCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{m.org_members_active()}</CardTitle>
        <CardDescription>{m.admin_members_count({ count: pagination.total })}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {membersList.length === 0 ? (
          searchInput ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {m.org_members_no_results()}
            </p>
          ) : (
            <EmptyState />
          )
        ) : (
          <MembersTable
            members={membersList}
            roles={roles}
            onRoleChange={onRoleChange}
            onRemove={onRemove}
          />
        )}

        <PaginationControls pagination={pagination} onPageChange={onPageChange} />
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

function useAdminMembersPage() {
  const { data: activeOrg } = authClient.useActiveOrganization()
  const queryClient = useQueryClient()
  const orgId = activeOrg?.id
  const search = useMembersSearch()
  const [memberToRemove, setMemberToRemove] = useState<MemberToRemove | null>(null)

  const membersQuery = useMembersPageQueries(orgId, search.page, search.debouncedSearch)
  const rolesQuery = useQuery({
    queryKey: ['org-roles', orgId],
    queryFn: ({ signal }) => fetchRoles(signal),
    staleTime: 60_000,
    enabled: Boolean(orgId),
  })
  const mutations = useMembersMutations(queryClient, setMemberToRemove)

  function handleRemoveClick(memberId: string) {
    const found = membersQuery.data?.data.find((mem) => mem.id === memberId)
    if (found) {
      setMemberToRemove({ id: found.id, name: found.user.name, email: found.user.email })
    }
  }

  const membersList = membersQuery.data?.data ?? []
  const pagination = membersQuery.data?.pagination ?? {
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 0,
  }
  const roles = rolesQuery.data ?? []
  const isLoading = membersQuery.isLoading
  const error = membersQuery.error
    ? membersQuery.error instanceof Error
      ? membersQuery.error.message
      : m.auth_toast_error()
    : null

  return {
    activeOrg,
    queryClient,
    search,
    memberToRemove,
    setMemberToRemove,
    membersQuery,
    mutations,
    handleRemoveClick,
    membersList,
    pagination,
    roles,
    isLoading,
    error,
  }
}

function NoOrgView() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{m.org_members_title()}</h1>
      <p className="text-muted-foreground">{m.org_switcher_no_org()}</p>
    </div>
  )
}

function AdminMembersPage() {
  const state = useAdminMembersPage()
  const {
    activeOrg,
    queryClient,
    search,
    memberToRemove,
    setMemberToRemove,
    membersQuery,
    mutations,
    handleRemoveClick,
    membersList,
    pagination,
    roles,
    isLoading,
    error,
  } = state

  if (!activeOrg) return <NoOrgView />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{m.org_members_title()}</h1>
        <InviteDialog
          roles={roles}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-members'] })
            queryClient.invalidateQueries({ queryKey: ['admin-invitations'] })
          }}
        />
      </div>
      <MembersSearchBar searchInput={search.searchInput} onSearchChange={search.setSearchInput} />
      {error && <ErrorCard message={error} onRetry={() => membersQuery.refetch()} />}
      {isLoading && !error && <MembersLoadingCard />}
      {!(isLoading || error) && (
        <MembersContentCard
          membersList={membersList}
          pagination={pagination}
          roles={roles}
          searchInput={search.searchInput}
          onRoleChange={(memberId, roleId) =>
            mutations.roleChangeMutation.mutate({ memberId, roleId })
          }
          onRemove={handleRemoveClick}
          onPageChange={search.setPage}
        />
      )}
      <PendingInvitations />
      <RemoveMemberDialog
        member={memberToRemove}
        onConfirm={() => memberToRemove && mutations.removeMemberMutation.mutate(memberToRemove.id)}
        onCancel={() => setMemberToRemove(null)}
      />
    </div>
  )
}
