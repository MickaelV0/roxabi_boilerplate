import {
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
} from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/org/members')({
  component: OrgMembersPage,
})

function roleLabel(role: string) {
  switch (role) {
    case 'owner':
      return m.org_role_owner()
    case 'admin':
      return m.org_role_admin()
    default:
      return m.org_role_member()
  }
}

function roleBadgeVariant(role: string) {
  switch (role) {
    case 'owner':
      return 'default' as const
    case 'admin':
      return 'secondary' as const
    default:
      return 'outline' as const
  }
}

function OrgMembersPage() {
  const { data: activeOrg } = authClient.useActiveOrganization()
  const { data: activeMember } = authClient.useActiveMember()

  const canManage = activeMember?.role === 'owner' || activeMember?.role === 'admin'
  const members = activeOrg?.members ?? []
  const invitations = activeOrg?.invitations?.filter((inv) => inv.status === 'pending') ?? []

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [inviting, setInviting] = useState(false)

  if (!activeOrg) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <h1 className="text-2xl font-bold">{m.org_members_title()}</h1>
        <p className="text-muted-foreground">{m.org_switcher_no_org()}</p>
      </div>
    )
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    try {
      const { error } = await authClient.organization.inviteMember({
        email: inviteEmail,
        role: inviteRole,
      })
      if (error) {
        toast.error(error.message ?? m.auth_toast_error())
      } else {
        toast.success(m.org_toast_invited({ email: inviteEmail }))
        setInviteEmail('')
        setInviteRole('member')
        setInviteOpen(false)
      }
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      setInviting(false)
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      const { error } = await authClient.organization.removeMember({ memberIdOrEmail: memberId })
      if (error) {
        toast.error(error.message ?? m.auth_toast_error())
      } else {
        toast.success(m.org_toast_member_removed())
      }
    } catch {
      toast.error(m.auth_toast_error())
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

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{m.org_members_title()}</h1>

        {canManage && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>{m.org_invite_title()}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{m.org_invite_title()}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">{m.org_invite_email()}</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setInviteEmail(e.target.value)
                    }
                    placeholder={m.org_invite_email_placeholder()}
                    required
                    disabled={inviting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role">{m.org_invite_role()}</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(v) => setInviteRole(v as 'admin' | 'member')}
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
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={inviting}>
                    {inviting ? m.org_invite_sending() : m.org_invite_send()}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{m.org_members_active()}</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">{m.org_members_empty()}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">{m.org_members_name()}</th>
                    <th className="pb-2 pr-4 font-medium">{m.org_members_email()}</th>
                    <th className="pb-2 pr-4 font-medium">{m.org_members_role()}</th>
                    <th className="pb-2 pr-4 font-medium">{m.org_members_joined()}</th>
                    {canManage && <th className="pb-2 font-medium">{m.org_members_actions()}</th>}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">{member.user.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{member.user.email}</td>
                      <td className="py-3 pr-4">
                        {canManage && member.role !== 'owner' ? (
                          <Select
                            value={member.role}
                            onValueChange={(role) => handleRoleChange(member.id, role)}
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
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </td>
                      {canManage && (
                        <td className="py-3">
                          {member.role !== 'owner' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              {m.org_members_remove()}
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{m.org_invitations_title()}</CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground">{m.org_invitations_empty()}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">{m.org_invitations_email()}</th>
                    <th className="pb-2 pr-4 font-medium">{m.org_invitations_role()}</th>
                    <th className="pb-2 pr-4 font-medium">{m.org_invitations_status()}</th>
                    {canManage && <th className="pb-2 font-medium">{m.org_members_actions()}</th>}
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">{inv.email}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={roleBadgeVariant(inv.role)}>{roleLabel(inv.role)}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline">{inv.status}</Badge>
                      </td>
                      {canManage && (
                        <td className="py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRevokeInvitation(inv.id)}
                          >
                            {m.org_invitations_revoke()}
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
