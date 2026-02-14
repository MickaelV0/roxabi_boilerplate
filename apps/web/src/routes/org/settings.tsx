import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
} from '@repo/ui'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { authClient, useSession } from '@/lib/auth-client'
import { hasPermission } from '@/lib/permissions'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/org/settings')({
  beforeLoad: async () => {
    const { data } = await authClient.getSession()
    if (!data) {
      throw redirect({ to: '/login' })
    }
  },
  component: OrgSettingsPage,
  head: () => ({
    meta: [{ title: `${m.org_settings_title()} | Roxabi` }],
  }),
})

function OrgSettingsPage() {
  const navigate = useNavigate()
  const { data: session } = useSession()
  const { data: activeOrg } = authClient.useActiveOrganization()

  const canDeleteOrg = hasPermission(session, 'organizations:delete')

  const [name, setName] = useState(activeOrg?.name ?? '')
  const [slug, setSlug] = useState(activeOrg?.slug ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Sync local state when the active org changes (e.g. user switches org)
  useEffect(() => {
    if (activeOrg) {
      setName(activeOrg.name)
      setSlug(activeOrg.slug ?? '')
    }
  }, [activeOrg])

  if (!activeOrg) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <h1 className="text-2xl font-bold">{m.org_settings_title()}</h1>
        <p className="text-muted-foreground">{m.org_switcher_no_org()}</p>
      </div>
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await authClient.organization.update({
        data: { name, slug },
      })
      if (error) {
        toast.error(error.message ?? m.auth_toast_error())
      } else {
        toast.success(m.org_toast_updated())
      }
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const { error } = await authClient.organization.delete({
        organizationId: activeOrg?.id ?? '',
      })
      if (error) {
        toast.error(error.message ?? m.auth_toast_error())
      } else {
        toast.success(m.org_toast_deleted())
        setDeleteOpen(false)
        navigate({ to: '/' })
      }
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">{m.org_settings_title()}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{m.org_settings_general()}</CardTitle>
          {!canDeleteOrg && <CardDescription>{m.org_settings_read_only()}</CardDescription>}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">{m.org_name()}</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder={m.org_name_placeholder()}
                disabled={!canDeleteOrg || saving}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-slug">{m.org_slug()}</Label>
              <Input
                id="org-slug"
                value={slug}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlug(e.target.value)}
                placeholder={m.org_slug_placeholder()}
                disabled={!canDeleteOrg || saving}
                required
              />
            </div>
            {canDeleteOrg && (
              <Button type="submit" disabled={saving}>
                {saving ? m.org_settings_saving() : m.org_settings_save()}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {canDeleteOrg && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">{m.org_settings_danger()}</CardTitle>
            <CardDescription>{m.org_settings_danger_desc()}</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">{m.org_delete()}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{m.org_delete_title()}</DialogTitle>
                  <DialogDescription>{m.org_delete_confirm()}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">{m.common_cancel()}</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                    {deleting ? m.org_deleting() : m.org_delete()}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
