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
import { createFileRoute, useBlocker, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { authClient, useSession } from '@/lib/auth-client'
import { hasPermission } from '@/lib/permissions'
import { m } from '@/paraglide/messages'

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

export const Route = createFileRoute('/org/settings')({
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

type DangerZoneCardProps = {
  orgId: string
  orgName: string
  onDeleted: () => void
}

function DangerZoneCard({ orgId, orgName, onDeleted }: DangerZoneCardProps) {
  const [deleting, setDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  async function handleDelete() {
    setDeleting(true)
    try {
      const { error } = await authClient.organization.delete({
        organizationId: orgId,
      })
      if (error) {
        toast.error(error.message ?? m.auth_toast_error())
      } else {
        toast.success(m.org_toast_deleted())
        setDeleteOpen(false)
        onDeleted()
      }
    } catch {
      toast.error(m.auth_toast_error())
    } finally {
      setDeleting(false)
    }
  }

  return (
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
              <DialogDescription>{m.org_delete_type_confirm({ name: orgName })}</DialogDescription>
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
                disabled={deleting || deleteConfirm !== orgName}
              >
                {deleting ? m.org_deleting() : m.org_delete()}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

type GeneralSettingsCardProps = {
  orgName: string
  orgSlug: string
  canEdit: boolean
  onDirtyChange: (dirty: boolean) => void
}

function GeneralSettingsCard({
  orgName,
  orgSlug,
  canEdit,
  onDirtyChange,
}: GeneralSettingsCardProps) {
  const [name, setName] = useState(orgName)
  const [slug, setSlug] = useState(orgSlug)
  const [saving, setSaving] = useState(false)
  const [slugError, setSlugError] = useState('')

  const isDirty = name !== orgName || slug !== orgSlug

  useEffect(() => {
    setName(orgName)
    setSlug(orgSlug)
  }, [orgName, orgSlug])

  useEffect(() => {
    onDirtyChange(isDirty)
  }, [isDirty, onDirtyChange])

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{m.org_settings_general()}</CardTitle>
        {!canEdit && <CardDescription>{m.org_settings_read_only()}</CardDescription>}
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
              disabled={!canEdit || saving}
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
                disabled={!canEdit || saving}
                required
                className="flex-1"
                aria-invalid={slugError ? true : undefined}
                aria-describedby={slugError ? 'slug-error' : undefined}
              />
              {canEdit && (
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
          {canEdit && (
            <Button type="submit" disabled={saving || !isDirty}>
              {saving ? m.org_settings_saving() : m.org_settings_save()}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

type UnsavedChangesDialogProps = {
  status: string
  proceed?: () => void
  reset?: () => void
}

function UnsavedChangesDialog({ status, proceed, reset }: UnsavedChangesDialogProps) {
  if (status !== 'blocked') {
    return null
  }

  return (
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
  )
}

function OrgSettingsPage() {
  const navigate = useNavigate()
  const { data: session } = useSession()
  const { data: activeOrg } = authClient.useActiveOrganization()

  const canDeleteOrg = hasPermission(session, 'organizations:delete')
  const [isDirty, setIsDirty] = useState(false)

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

  return (
    <>
      <h1 className="text-2xl font-bold">{m.org_settings_title()}</h1>

      <GeneralSettingsCard
        orgName={activeOrg.name}
        orgSlug={activeOrg.slug ?? ''}
        canEdit={canDeleteOrg}
        onDirtyChange={setIsDirty}
      />

      {canDeleteOrg && (
        <DangerZoneCard
          orgId={activeOrg.id}
          orgName={activeOrg.name}
          onDeleted={() => navigate({ to: '/' })}
        />
      )}

      <UnsavedChangesDialog status={status} proceed={proceed} reset={reset} />
    </>
  )
}
