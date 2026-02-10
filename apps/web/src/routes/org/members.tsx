import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
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

// TODO: import authClient from '@/lib/auth-client'
// TODO: import toast from 'sonner'
// TODO: import Paraglide messages

export const Route = createFileRoute('/org/members')({
  component: OrgMembersPage,
})

/**
 * Organization Members page.
 *
 * Shows members table with roles, invite button, and pending invitations.
 * Owner/admin can change roles, remove members, and revoke invitations.
 */
function OrgMembersPage() {
  // TODO: fetch members list from authClient.organization.listMembers()
  // TODO: fetch pending invitations
  // TODO: implement role change via dropdown (owner/admin only)
  // TODO: implement remove member with confirmation (owner/admin only)
  // TODO: implement invite modal
  // TODO: implement revoke invitation
  // TODO: implement loading states
  // TODO: implement i18n with Paraglide messages

  const [_inviteEmail, _setInviteEmail] = useState('')
  const [_inviteRole, _setInviteRole] = useState<'admin' | 'member'>('member')
  const [_loading, _setLoading] = useState(false)

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Members</h1>

        {/* Invite member modal */}
        <Dialog>
          <DialogTrigger asChild>
            <Button>Invite member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Member</DialogTitle>
            </DialogHeader>
            {/* TODO: implement invite form */}
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input id="invite-email" type="email" placeholder="user@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select defaultValue="member">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Send invitation
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Members table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Members</CardTitle>
        </CardHeader>
        <CardContent>
          {/* TODO: replace with actual members data */}
          <div className="text-sm text-muted-foreground">
            {/* TODO: render members table with avatar, name, email, role, join date */}
            <p>No members loaded yet.</p>
          </div>
        </CardContent>
      </Card>

      {/* Pending invitations */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          {/* TODO: replace with actual invitations data */}
          <div className="text-sm text-muted-foreground">
            <p>No pending invitations.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
