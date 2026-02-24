import {
  Badge,
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
import { Link } from '@tanstack/react-router'
import { Check, ChevronDown, Plus, Settings, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { authClient, useSession } from '@/lib/auth-client'
import { roleBadgeVariant, roleLabel } from '@/lib/org-utils'
import type { useOrganizations } from '@/lib/use-organizations'
import { m } from '@/paraglide/messages'

type OrgSwitcherProps = {
  orgState: ReturnType<typeof useOrganizations>
}

export function OrgSwitcher({ orgState }: OrgSwitcherProps) {
  const { data: session } = useSession()
  const { data: orgs, isLoading: orgsLoading, refetch: refetchOrgs } = orgState
  const { data: activeOrg } = authClient.useActiveOrganization()
  const [createOpen, setCreateOpen] = useState(false)
  // Optimistic org name — shown immediately on switch, cleared only once activeOrg catches up.
  const [optimisticOrgName, setOptimisticOrgName] = useState<string | null>(null)
  const prevActiveOrgId = useRef(activeOrg?.id)

  // Clear optimistic name once activeOrg actually changes (Better Auth has caught up)
  useEffect(() => {
    if (activeOrg?.id !== prevActiveOrgId.current) {
      prevActiveOrgId.current = activeOrg?.id
      setOptimisticOrgName(null)
    }
  }, [activeOrg?.id])

  const displayedOrgName = optimisticOrgName ?? activeOrg?.name ?? orgs?.[0]?.name

  const activeMember = activeOrg?.members?.find(
    (member: { userId: string }) => member.userId === session?.user?.id
  )

  // Only show Members/Settings links for users who can access /admin
  // (superadmins or org-level admin/owner with members:write permission)
  const canAccessAdmin =
    session?.user?.role === 'superadmin' ||
    activeMember?.role === 'owner' ||
    activeMember?.role === 'admin'

  // Still loading — render nothing to avoid flashing the "Create" button
  if (orgsLoading || orgs === undefined) {
    return null
  }

  if (orgs.length === 0) {
    return (
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Plus className="mr-1 size-4" />
            {m.org_create()}
          </Button>
        </DialogTrigger>
        <CreateOrgDialogContent onClose={() => setCreateOpen(false)} onCreated={refetchOrgs} />
      </Dialog>
    )
  }

  async function handleSwitch(orgId: string, orgName: string) {
    if (activeOrg?.id === orgId) return
    setOptimisticOrgName(orgName)
    try {
      await authClient.organization.setActive({ organizationId: orgId })
      toast.success(m.org_toast_switched({ name: orgName }))
      refetchOrgs()
    } catch {
      toast.error(m.auth_toast_error())
      setOptimisticOrgName(null)
    }
  }

  return (
    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            {displayedOrgName ?? m.org_switcher_no_org()}
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
                {/* Role badge only shows for the active org because the session
                    only provides membership info for the active organization. */}
                {activeOrg?.id === org.id && activeMember?.role && (
                  <Badge
                    variant={roleBadgeVariant(activeMember.role)}
                    className="text-[10px] px-1 py-0"
                  >
                    {roleLabel(activeMember.role)}
                  </Badge>
                )}
                {activeOrg?.id === org.id && <Check className="size-3 text-primary" />}
              </span>
            </DropdownMenuItem>
          ))}
          {activeOrg && canAccessAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin/members">
                  <Users className="mr-2 size-4" />
                  {m.user_menu_org_members()}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/settings">
                  <Settings className="mr-2 size-4" />
                  {m.user_menu_org_settings()}
                </Link>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DialogTrigger asChild>
            <DropdownMenuItem>
              <Plus className="mr-2 size-4" />
              {m.org_create()}
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateOrgDialogContent onClose={() => setCreateOpen(false)} onCreated={refetchOrgs} />
    </Dialog>
  )
}

type CreateOrgDialogContentProps = {
  onClose: () => void
  onCreated?: () => void
}

function CreateOrgDialogContent({ onClose, onCreated }: CreateOrgDialogContentProps) {
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [creating, setCreating] = useState(false)

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
        onCreated?.()
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
              {m.common_cancel()}
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
