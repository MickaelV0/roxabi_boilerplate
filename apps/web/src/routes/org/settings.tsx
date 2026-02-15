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
import { createFileRoute, redirect, useBlocker, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { authClient, useSession } from '@/lib/auth-client'
import { hasPermission } from '@/lib/permissions'
import { m } from '@/paraglide/messages'

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

export const Route = createFileRoute('/org/settings')({
  beforeLoad: async () => {
    if (typeof window === 'undefined') return
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

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

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
  const [slugError, setSlugError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')

  // I8: Dirty-state tracking
  const isDirty = name !== (activeOrg?.name ?? '') || slug !== (activeOrg?.slug ?? '')

  function handleSlugBlur() {
    if (slug && !SLUG_REGEX.test(slug)) {
      setSlugError(m.org_slug_invalid())
    }
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(e.target.value)
    if (slugError) {
      setSlugError('')
    }
  }

  // Sync local state when the active org changes (e.g. user switches org)
  useEffect(() => {
    if (activeOrg) {
      setName(activeOrg.name)
      setSlug(activeOrg.slug ?? '')
    }
  }, [activeOrg])

  // I8: Navigation blocker when form is dirty
  const { status, proceed, reset } = useBlocker({
    shouldBlockFn: () => isDirty,
    withResolver: true,
    enableBeforeUnload: true,
  })

  if (!activeOrg) {
    return (
      <>
        <h1 className="text-2xl font-bold">{m.org_settings_title()}</h1>
        <p className="text-muted-foreground">{m.org_switcher_no_org()}</p>
      </>
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (slug && !SLUG_REGEX.test(slug)) {
      setSlugError(m.org_slug_invalid())
      return
    }
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
    <>
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
              <div className="flex gap-2">
                <Input
                  id="org-slug"
                  value={slug}
                  onChange={handleSlugChange}
                  onBlur={handleSlugBlur}
                  placeholder={m.org_slug_placeholder()}
                  disabled={!canDeleteOrg || saving}
                  required
                  className="flex-1"
                  aria-invalid={slugError ? true : undefined}
                  aria-describedby={slugError ? 'slug-error' : undefined}
                />
                {canDeleteOrg && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSlug(slugify(name))}
                    disabled={saving || !name.trim()}
                  >
                    {m.org_slug_generate()}
                  </Button>
                )}
              </div>
              {slugError && (
                <p id="slug-error" className="text-sm text-destructive">
                  {slugError}
                </p>
              )}
            </div>
            {canDeleteOrg && (
              <Button type="submit" disabled={saving || !isDirty}>
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
            <Dialog
              open={deleteOpen}
              onOpenChange={(open: boolean) => {
                setDeleteOpen(open)
                if (!open) setDeleteConfirm('')
              }}
            >
              <DialogTrigger asChild>
                <Button variant="destructive">{m.org_delete()}</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{m.org_delete_title()}</DialogTitle>
                  <DialogDescription>
                    {m.org_delete_type_confirm({ name: activeOrg.name })}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <Input
                    value={deleteConfirm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setDeleteConfirm(e.target.value)
                    }
                    placeholder={m.org_delete_type_placeholder()}
                    autoComplete="off"
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">{m.common_cancel()}</Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting || deleteConfirm !== activeOrg.name}
                  >
                    {deleting ? m.org_deleting() : m.org_delete()}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* I8: Navigation blocker dialog */}
      {status === 'blocked' && (
        <Dialog open onOpenChange={() => reset()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{m.org_unsaved_changes()}</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => reset()}>
                {m.org_unsaved_stay()}
              </Button>
              <Button variant="destructive" onClick={() => proceed()}>
                {m.org_unsaved_leave()}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
