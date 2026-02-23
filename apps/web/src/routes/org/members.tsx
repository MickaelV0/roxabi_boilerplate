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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'
import { useReducer } from 'react'
import { toast } from 'sonner'
import { authClient, useSession } from '@/lib/auth-client'
import { roleBadgeVariant, roleLabel } from '@/lib/org-utils'
import { hasPermission } from '@/lib/permissions'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/org/members')({
  component: OrgMembersPage,
  head: () => ({
    meta: [{ title: `${m.org_members_title()} | Roxabi` }],
  }),
})

type MembersState = {
  inviteOpen: boolean
  inviteEmail: string
  inviteRole: 'admin' | 'member'
  inviting: boolean
  removeMemberId: string | null
  searchQuery: string
}

type MembersAction =
  | { type: 'SET_INVITE_OPEN'; payload: boolean }
  | { type: 'SET_INVITE_EMAIL'; payload: string }
  | { type: 'SET_INVITE_ROLE'; payload: 'admin' | 'member' }
  | { type: 'SET_INVITING'; payload: boolean }
  | { type: 'SET_REMOVE_MEMBER_ID'; payload: string | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'RESET_INVITE_FORM' }

const membersInitialState: MembersState = {
  inviteOpen: false,
  inviteEmail: '',
  inviteRole: 'member',
  inviting: false,
  removeMemberId: null,
  searchQuery: '',
}

function membersReducer(state: MembersState, action: MembersAction): MembersState {
  switch (action.type) {
    case 'SET_INVITE_OPEN':
      return { ...state, inviteOpen: action.payload }
    case 'SET_INVITE_EMAIL':
      return { ...state, inviteEmail: action.payload }
    case 'SET_INVITE_ROLE':
      return { ...state, inviteRole: action.payload }
    case 'SET_INVITING':
      return { ...state, inviting: action.payload }
    case 'SET_REMOVE_MEMBER_ID':
      return { ...state, removeMemberId: action.payload }
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload }
    case 'RESET_INVITE_FORM':
      return { ...state, inviteEmail: '', inviteRole: 'member', inviteOpen: false }
  }
}

function InviteDialog({
  state,
  dispatch,
  onInvite,
}: {
  state: MembersState
  dispatch: React.Dispatch<MembersAction>
  onInvite: (e: React.FormEvent) => void
}) {
  return (
    <Dialog
      open={state.inviteOpen}
      onOpenChange={(v) => dispatch({ type: 'SET_INVITE_OPEN', payload: v })}
    >
      <DialogTrigger asChild>
        <Button>{m.org_invite_title()}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{m.org_invite_title()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onInvite} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">{m.org_invite_email()}</Label>
            <Input
              id="invite-email"
              type="email"
              value={state.inviteEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                dispatch({ type: 'SET_INVITE_EMAIL', payload: e.target.value })
              }
              placeholder={m.org_invite_email_placeholder()}
              required
              disabled={state.inviting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-role">{m.org_invite_role()}</Label>
            <Select
              value={state.inviteRole}
              onValueChange={(v: string) => {
                if (v === 'admin' || v === 'member')
                  dispatch({ type: 'SET_INVITE_ROLE', payload: v })
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{m.org_role_admin()}</SelectItem>
                <SelectItem value="member">{m.org_role_member()}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {m.common_cancel()}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={state.inviting}>
              {state.inviting ? m.org_invite_sending() : m.org_invite_send()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MembersTable({
  members,
  canManage,
  searchQuery,
  onRoleChange,
  onRemoveClick,
}: {
  members: NonNullable<ActiveOrgData['members']>
  canManage: boolean
  searchQuery: string
  onRoleChange: (memberId: string, role: string) => void
  onRemoveClick: (memberId: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{m.org_members_active()}</CardTitle>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {searchQuery ? m.org_members_no_results() : m.org_members_empty()}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="border-b text-left text-muted-foreground">
                  <TableHead className="pb-2 pr-4 font-medium">{m.org_members_name()}</TableHead>
                  <TableHead className="pb-2 pr-4 font-medium">{m.org_members_email()}</TableHead>
                  <TableHead className="pb-2 pr-4 font-medium">{m.org_members_role()}</TableHead>
                  <TableHead className="pb-2 pr-4 font-medium">{m.org_members_joined()}</TableHead>
                  {canManage && (
                    <TableHead className="pb-2 font-medium">{m.org_members_actions()}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} className="border-b last:border-0">
                    <TableCell className="py-3 pr-4">{member.user.name}</TableCell>
                    <TableCell className="py-3 pr-4 text-muted-foreground">
                      {member.user.email}
                    </TableCell>
                    <TableCell className="py-3 pr-4">
                      {canManage && member.role !== 'owner' ? (
                        <Select
                          value={member.role}
                          onValueChange={(role: string) => onRoleChange(member.id, role)}
                        >
                          <SelectTrigger className="h-7 w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">{m.org_role_admin()}</SelectItem>
                            <SelectItem value="member">{m.org_role_member()}</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={roleBadgeVariant(member.role)}>
                          {roleLabel(member.role)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3 pr-4 text-muted-foreground">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </TableCell>
                    {canManage && (
                      <TableCell className="py-3">
                        {member.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => onRemoveClick(member.id)}
                          >
                            {m.org_members_remove()}
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PendingInvitationsTable({
  invitations,
  canManage,
  onRevoke,
}: {
  invitations: Array<{ id: string; email: string; role: string; status: string }>
  canManage: boolean
  onRevoke: (invitationId: string) => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{m.org_invitations_title()}</CardTitle>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">{m.org_invitations_empty()}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow className="border-b text-left text-muted-foreground">
                  <TableHead className="pb-2 pr-4 font-medium">
                    {m.org_invitations_email()}
                  </TableHead>
                  <TableHead className="pb-2 pr-4 font-medium">
                    {m.org_invitations_role()}
                  </TableHead>
                  <TableHead className="pb-2 pr-4 font-medium">
                    {m.org_invitations_status()}
                  </TableHead>
                  {canManage && (
                    <TableHead className="pb-2 font-medium">{m.org_members_actions()}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id} className="border-b last:border-0">
                    <TableCell className="py-3 pr-4">{inv.email}</TableCell>
                    <TableCell className="py-3 pr-4">
                      <Badge variant={roleBadgeVariant(inv.role)}>{roleLabel(inv.role)}</Badge>
                    </TableCell>
                    <TableCell className="py-3 pr-4">
                      <Badge variant="outline">{inv.status}</Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell className="py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => onRevoke(inv.id)}
                        >
                          {m.org_invitations_revoke()}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function useMembersHandlers(state: MembersState, dispatch: React.Dispatch<MembersAction>) {
  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    dispatch({ type: 'SET_INVITING', payload: true })
    try {
      const { error } = await authClient.organization.inviteMember({
        email: state.inviteEmail,
        role: state.inviteRole,
      })
      if (error) {
        toast.error(error.message ?? m.auth_toast_error())
      } else {
        toast.success(m.org_toast_invited({ email: state.inviteEmail }))
        dispatch({ type: 'RESET_INVITE_FORM' })
      }
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      dispatch({ type: 'SET_INVITING', payload: false })
    }
  }

  async function handleRemoveMember() {
    if (!state.removeMemberId) return
    try {
      const { error } = await authClient.organization.removeMember({
        memberIdOrEmail: state.removeMemberId,
      })
      if (error) {
        toast.error(error.message ?? m.auth_toast_error())
      } else {
        toast.success(m.org_toast_member_removed())
      }
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      dispatch({ type: 'SET_REMOVE_MEMBER_ID', payload: null })
    }
  }

  async function handleRoleChange(memberId: string, role: string) {
    try {
      const { error } = await authClient.organization.updateMemberRole({ memberId, role })
      if (error) {
        toast.error(error.message ?? m.auth_toast_error())
      } else {
        toast.success(m.org_toast_role_updated())
      }
    } catch {
      toast.error(m.auth_toast_error())
    }
  }

  async function handleRevokeInvitation(invitationId: string) {
    try {
      const { error } = await authClient.organization.cancelInvitation({ invitationId })
      if (error) {
        toast.error(error.message ?? m.auth_toast_error())
      } else {
        toast.success(m.org_toast_invitation_revoked())
      }
    } catch {
      toast.error(m.auth_toast_error())
    }
  }

  return { handleInvite, handleRemoveMember, handleRoleChange, handleRevokeInvitation }
}

function RemoveMemberDialog({
  removeMemberId,
  dispatch,
  onConfirm,
}: {
  removeMemberId: string | null
  dispatch: React.Dispatch<MembersAction>
  onConfirm: () => void
}) {
  return (
    <AlertDialog
      open={removeMemberId !== null}
      onOpenChange={(open: boolean) => {
        if (!open) dispatch({ type: 'SET_REMOVE_MEMBER_ID', payload: null })
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

type ActiveOrgData = NonNullable<ReturnType<typeof authClient.useActiveOrganization>['data']>

function OrgMembersContent({
  canManage,
  members,
  invitations,
  state,
  dispatch,
  handlers,
}: {
  canManage: boolean
  members: NonNullable<ActiveOrgData['members']>
  invitations: Array<{ id: string; email: string; role: string; status: string }>
  state: MembersState
  dispatch: React.Dispatch<MembersAction>
  handlers: ReturnType<typeof useMembersHandlers>
}) {
  const filteredMembers = members.filter(
    (member) =>
      member.user.name?.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      member.user.email.toLowerCase().includes(state.searchQuery.toLowerCase())
  )

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{m.org_members_title()}</h1>
        {canManage && (
          <InviteDialog state={state} dispatch={dispatch} onInvite={handlers.handleInvite} />
        )}
      </div>

      <Input
        placeholder={m.org_members_search_placeholder()}
        value={state.searchQuery}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })
        }
        className="max-w-sm"
      />

      <MembersTable
        members={filteredMembers}
        canManage={canManage}
        searchQuery={state.searchQuery}
        onRoleChange={handlers.handleRoleChange}
        onRemoveClick={(id) => dispatch({ type: 'SET_REMOVE_MEMBER_ID', payload: id })}
      />

      <PendingInvitationsTable
        invitations={invitations}
        canManage={canManage}
        onRevoke={handlers.handleRevokeInvitation}
      />

      <RemoveMemberDialog
        removeMemberId={state.removeMemberId}
        dispatch={dispatch}
        onConfirm={handlers.handleRemoveMember}
      />
    </>
  )
}

function OrgMembersPage() {
  const { data: session } = useSession()
  const { data: activeOrg } = authClient.useActiveOrganization()
  const canManage = hasPermission(session, 'members:write')
  const [state, dispatch] = useReducer(membersReducer, membersInitialState)
  const handlers = useMembersHandlers(state, dispatch)

  if (!activeOrg) {
    return (
      <>
        <h1 className="text-2xl font-bold">{m.org_members_title()}</h1>
        <p className="text-muted-foreground">{m.org_switcher_no_org()}</p>
      </>
    )
  }

  return (
    <OrgMembersContent
      canManage={canManage}
      members={activeOrg.members ?? []}
      invitations={activeOrg.invitations?.filter((inv) => inv.status === 'pending') ?? []}
      state={state}
      dispatch={dispatch}
      handlers={handlers}
    />
  )
}
