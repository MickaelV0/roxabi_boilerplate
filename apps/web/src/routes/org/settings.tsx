import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DestructiveConfirmDialog,
  Input,
  Label,
} from '@repo/ui'
import { createFileRoute, useBlocker, useNavigate } from '@tanstack/react-router'
import { AlertTriangleIcon } from 'lucide-react'
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

type DeletionImpact = {
  memberCount: number
  invitationCount: number
  customRoleCount: number
}

type DangerZoneCardProps = {
  orgId: string
  orgName: string
  onDeleted: () => void
}

function DangerZoneCard({ orgId, orgName, onDeleted }: DangerZoneCardProps) {
  const [deleting, setDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [impact, setImpact] = useState<DeletionImpact | null>(null)
  const [loadingImpact, setLoadingImpact] = useState(false)

  async function handleDeleteClick() {
    setLoadingImpact(true)
    try {
      const res = await fetch(`/api/organizations/${orgId}/deletion-impact`, {
        credentials: 'include',
      })
      if (res.ok) {
        setImpact((await res.json()) as DeletionImpact)
      }
    } catch {
      // Proceed without impact summary
    } finally {
      setLoadingImpact(false)
      setDeleteOpen(true)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/organizations/${orgId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmName: orgName }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null
        toast.error(data?.message ?? m.auth_toast_error())
        return
      }

      toast.success(m.org_toast_deleted())
      setDeleteOpen(false)
      onDeleted()
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
        <Button variant="destructive" onClick={handleDeleteClick} disabled={loadingImpact}>
          {loadingImpact ? m.org_deleting() : m.org_delete()}
        </Button>

        <DestructiveConfirmDialog
          open={deleteOpen}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setDeleteOpen(false)
              setImpact(null)
            }
          }}
          title={m.org_delete_title()}
          description={m.org_delete_type_confirm({ name: orgName })}
          confirmText={orgName}
          confirmLabel={m.org_delete_type_placeholder()}
          impactSummary={
            impact ? (
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">{impact.memberCount}</span> member
                  {impact.memberCount !== 1 ? 's' : ''} will lose access
                </p>
                {impact.invitationCount > 0 && (
                  <p>
                    <span className="font-medium">{impact.invitationCount}</span> pending invitation
                    {impact.invitationCount !== 1 ? 's' : ''} will be cancelled
                  </p>
                )}
                {impact.customRoleCount > 0 && (
                  <p>
                    <span className="font-medium">{impact.customRoleCount}</span> custom role
                    {impact.customRoleCount !== 1 ? 's' : ''} will be removed
                  </p>
                )}
                <p className="pt-1 text-muted-foreground">
                  The organization will be permanently deleted after 30 days.
                </p>
              </div>
            ) : null
          }
          onConfirm={handleDelete}
          isLoading={deleting}
        />
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
    <DestructiveConfirmDialog
      open
      onOpenChange={() => reset?.()}
      title={m.org_unsaved_changes()}
      description="You have unsaved changes. Are you sure you want to leave?"
      confirmText="leave"
      confirmLabel="Type 'leave' to discard changes"
      onConfirm={() => proceed?.()}
    />
  )
}

type ReactivationBannerProps = {
  orgId: string
  deleteScheduledFor: string
  canReactivate: boolean
}

function ReactivationBanner({ orgId, deleteScheduledFor, canReactivate }: ReactivationBannerProps) {
  const [reactivating, setReactivating] = useState(false)

  const formattedDate = new Date(deleteScheduledFor).toLocaleDateString()

  async function handleReactivate() {
    setReactivating(true)
    try {
      const res = await fetch(`/api/organizations/${orgId}/reactivate`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null
        toast.error(data?.message ?? 'Failed to reactivate organization')
        return
      }

      toast.success('Organization reactivated successfully')
      // Force session refresh to clear cached state
      window.location.reload()
    } catch {
      toast.error('Failed to reactivate organization')
    } finally {
      setReactivating(false)
    }
  }

  return (
    <Alert variant="destructive">
      <AlertTriangleIcon className="size-4" />
      <AlertTitle>Organization Scheduled for Deletion</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>This organization is scheduled for permanent deletion on {formattedDate}.</p>
        {canReactivate ? (
          <Button variant="outline" size="sm" onClick={handleReactivate} disabled={reactivating}>
            {reactivating ? 'Reactivating...' : 'Reactivate Organization'}
          </Button>
        ) : (
          <p className="text-sm">Contact an organization owner to reactivate this organization.</p>
        )}
      </AlertDescription>
    </Alert>
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

  // Check if org is soft-deleted
  const orgDeletedAt = (activeOrg as { deletedAt?: string | null }).deletedAt
  const orgDeleteScheduledFor = (activeOrg as { deleteScheduledFor?: string | null })
    .deleteScheduledFor

  if (orgDeletedAt) {
    return (
      <>
        <h1 className="text-2xl font-bold">{m.org_settings_title()}</h1>
        <ReactivationBanner
          orgId={activeOrg.id}
          deleteScheduledFor={orgDeleteScheduledFor ?? orgDeletedAt}
          canReactivate={canDeleteOrg}
        />
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
