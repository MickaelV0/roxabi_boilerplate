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
import { createFileRoute, useBlocker } from '@tanstack/react-router'
import { AlertTriangleIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { authClient, useSession } from '@/lib/auth-client'
import { isErrorWithMessage } from '@/lib/error-utils'
import { hasPermission } from '@/lib/permissions'
import { useOrganizations } from '@/lib/use-organizations'
import { m } from '@/paraglide/messages'

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

type SoftDeletableOrg = {
  deletedAt?: string | null
  deleteScheduledFor?: string | null
}

function hasSoftDeleteFields(org: unknown): org is SoftDeletableOrg {
  if (org == null || typeof org !== 'object') return false
  return 'deletedAt' in org
}

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
        const data: unknown = await res.json().catch(() => null)
        toast.error(isErrorWithMessage(data) ? data.message : m.auth_toast_error())
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
                <p className="pt-1 text-muted-foreground">{m.org_deletion_grace_period()}</p>
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
      description={m.org_unsaved_desc()}
      confirmText="leave"
      confirmLabel={m.org_unsaved_leave_confirm()}
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
        const data: unknown = await res.json().catch(() => null)
        toast.error(isErrorWithMessage(data) ? data.message : m.org_reactivation_error())
        return
      }

      toast.success(m.org_reactivation_success())
      // Force session refresh to clear cached state
      window.location.reload()
    } catch {
      toast.error(m.org_reactivation_error())
    } finally {
      setReactivating(false)
    }
  }

  return (
    <Alert variant="destructive">
      <AlertTriangleIcon className="size-4" />
      <AlertTitle>{m.org_reactivation_title()}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{m.org_reactivation_scheduled({ date: formattedDate })}</p>
        {canReactivate ? (
          <Button variant="outline" size="sm" onClick={handleReactivate} disabled={reactivating}>
            {reactivating ? m.org_reactivation_reactivating() : m.org_reactivation_button()}
          </Button>
        ) : (
          <p className="text-sm">{m.org_reactivation_contact()}</p>
        )}
      </AlertDescription>
    </Alert>
  )
}

function OrgSettingsPage() {
  const { data: session } = useSession()
  const { data: activeOrg } = authClient.useActiveOrganization()
  const { data: orgs } = useOrganizations()

  const currentMember = activeOrg?.members?.find(
    (member: { userId: string }) => member.userId === session?.user?.id
  )
  const canDeleteOrg = currentMember?.role === 'owner'
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

  // If the active org is not in the user's active org list, it's deleted or stale.
  // Our GET /api/organizations endpoint only returns non-deleted orgs the user belongs to.
  const isOrgValid = orgs?.some((org) => org.id === activeOrg.id)

  // Check if org is soft-deleted (via Better Auth additionalFields or org list validation)
  const softDelete = hasSoftDeleteFields(activeOrg) ? activeOrg : null
  const orgDeletedAt = softDelete?.deletedAt
  const orgDeleteScheduledFor = softDelete?.deleteScheduledFor
  const isOrgDeleted = orgDeletedAt || (orgs !== undefined && !isOrgValid)

  if (isOrgDeleted) {
    return (
      <>
        <h1 className="text-2xl font-bold">{m.org_settings_title()}</h1>
        <ReactivationBanner
          orgId={activeOrg.id}
          deleteScheduledFor={orgDeleteScheduledFor ?? orgDeletedAt ?? new Date().toISOString()}
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
          onDeleted={() => {
            // window.location.href bypasses React Router entirely, so useBlocker
            // (even with enableBeforeUnload) does not intercept it. No need for
            // flushSync -- just clear the dirty flag before navigating.
            setIsDirty(false)
            window.location.href = '/'
          }}
        />
      )}

      <UnsavedChangesDialog status={status} proceed={proceed} reset={reset} />
    </>
  )
}
