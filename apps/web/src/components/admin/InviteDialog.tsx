import {
  Button,
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
import { UserPlusIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { parseErrorMessage } from '@/lib/error-utils'
import { roleLabel } from '@/lib/org-utils'
import { m } from '@/paraglide/messages'

type OrgRole = {
  id: string
  name: string
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

type InviteDialogProps = {
  roles: OrgRole[]
  onSuccess: () => void
}

export function InviteDialog({ roles, onSuccess }: InviteDialogProps) {
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
