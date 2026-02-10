import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
} from '@repo/ui'
import { Check, ChevronDown, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { m } from '@/paraglide/messages'

export function OrgSwitcher() {
  const { data: orgs } = authClient.useListOrganizations()
  const { data: activeOrg } = authClient.useActiveOrganization()
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [creating, setCreating] = useState(false)

  if (!orgs || orgs.length === 0) {
    return (
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Plus className="mr-1 size-4" />
            {m.org_create()}
          </Button>
        </DialogTrigger>
        <CreateOrgDialogContent
          newName={newName}
          setNewName={setNewName}
          newSlug={newSlug}
          setNewSlug={setNewSlug}
          creating={creating}
          setCreating={setCreating}
          onClose={() => setCreateOpen(false)}
        />
      </Dialog>
    )
  }

  async function handleSwitch(orgId: string, orgName: string) {
    if (activeOrg?.id === orgId) return
    try {
      await authClient.organization.setActive({ organizationId: orgId })
      toast.success(m.org_toast_switched({ name: orgName }))
    } catch {
      toast.error(m.auth_toast_error())
    }
  }

  return (
    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            {activeOrg?.name ?? m.org_switcher_no_org()}
            <ChevronDown className="ml-1 size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>{m.org_switcher_label()}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {orgs.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => handleSwitch(org.id, org.name)}
              className="flex items-center justify-between"
            >
              <span className="truncate">{org.name}</span>
              <span className="flex items-center gap-1.5">
                {activeOrg?.id === org.id && <Check className="size-3 text-primary" />}
              </span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DialogTrigger asChild>
            <DropdownMenuItem>
              <Plus className="mr-2 size-4" />
              {m.org_create()}
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateOrgDialogContent
        newName={newName}
        setNewName={setNewName}
        newSlug={newSlug}
        setNewSlug={setNewSlug}
        creating={creating}
        setCreating={setCreating}
        onClose={() => setCreateOpen(false)}
      />
    </Dialog>
  )
}

type CreateOrgDialogContentProps = {
  newName: string
  setNewName: (v: string) => void
  newSlug: string
  setNewSlug: (v: string) => void
  creating: boolean
  setCreating: (v: boolean) => void
  onClose: () => void
}

function CreateOrgDialogContent({
  newName,
  setNewName,
  newSlug,
  setNewSlug,
  creating,
  setCreating,
  onClose,
}: CreateOrgDialogContentProps) {
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const { error } = await authClient.organization.create({
        name: newName,
        slug: newSlug,
      })
      if (error) {
        toast.error(error.message ?? m.auth_toast_error())
      } else {
        toast.success(m.org_toast_created())
        setNewName('')
        setNewSlug('')
        onClose()
      }
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      setCreating(false)
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{m.org_create_title()}</DialogTitle>
        <DialogDescription>{m.org_create_desc()}</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleCreate} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org-name">{m.org_name()}</Label>
          <Input
            id="org-name"
            value={newName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
            placeholder={m.org_name_placeholder()}
            required
            disabled={creating}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="org-slug">{m.org_slug()}</Label>
          <Input
            id="org-slug"
            value={newSlug}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSlug(e.target.value)}
            placeholder={m.org_slug_placeholder()}
            required
            disabled={creating}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={creating}>
            {creating ? m.org_creating() : m.org_create()}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
