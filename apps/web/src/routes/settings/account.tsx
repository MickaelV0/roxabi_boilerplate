import type { OrgOwnershipResolution } from '@repo/types'
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
  PasswordInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@repo/ui'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AlertTriangleIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { authClient, useSession } from '@/lib/auth-client'
import { parseErrorMessage } from '@/lib/error-utils'

export const Route = createFileRoute('/settings/account')({
  component: AccountSettingsPage,
  head: () => ({
    meta: [{ title: 'Account Settings | Roxabi' }],
  }),
})

type OwnedOrg = {
  id: string
  name: string
  memberCount: number
  members: Array<{ id: string; userId: string; name: string; role: string }>
}

function useIsOAuthOnly() {
  const [isOAuthOnly, setIsOAuthOnly] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function check() {
      try {
        const { data } = await authClient.listAccounts()
        if (data) {
          const hasCredential = data.some((account) => account.providerId === 'credential')
          setIsOAuthOnly(!hasCredential)
        }
      } catch {
        // Default to showing all sections
      } finally {
        setLoading(false)
      }
    }
    check()
  }, [])

  return { isOAuthOnly, loading }
}

function EmailChangeSection() {
  const [newEmail, setNewEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setSubmitting(true)
    try {
      const { error } = await authClient.changeEmail({ newEmail })
      if (error) {
        toast.error(error.message ?? 'Failed to change email')
      } else {
        toast.success(`Verification email sent to ${newEmail}`)
        setNewEmail('')
      }
    } catch {
      toast.error('Failed to change email')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Address</CardTitle>
        <CardDescription>
          Change your email address. A verification link will be sent to the new address.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newEmail">New Email</Label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmail(e.target.value)}
              placeholder="new@example.com"
              required
              disabled={submitting}
            />
          </div>
          <Button type="submit" disabled={submitting || !newEmail.trim()}>
            {submitting ? 'Sending...' : 'Change Email'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function PasswordChangeSection() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const passwordsMatch = newPassword === confirmPassword
  const canSubmit = currentPassword && newPassword && confirmPassword && passwordsMatch

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
      })
      if (error) {
        toast.error(error.message ?? 'Failed to update password')
      } else {
        toast.success('Password updated successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      toast.error('Failed to update password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Update your password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <PasswordInput
              id="currentPassword"
              value={currentPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCurrentPassword(e.target.value)
              }
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <PasswordInput
              id="newPassword"
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setConfirmPassword(e.target.value)
              }
              disabled={submitting}
            />
            {confirmPassword && !passwordsMatch && (
              <p className="text-sm text-destructive">Passwords do not match</p>
            )}
          </div>
          <Button type="submit" disabled={submitting || !canSubmit}>
            {submitting ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function OrgResolutionStep({
  orgs,
  resolutions,
  onResolve,
}: {
  orgs: OwnedOrg[]
  resolutions: OrgOwnershipResolution[]
  onResolve: (resolutions: OrgOwnershipResolution[]) => void
}) {
  function setResolution(orgId: string, value: OrgOwnershipResolution) {
    const exists = resolutions.some((r) => r.organizationId === orgId)
    if (exists) {
      onResolve(resolutions.map((r) => (r.organizationId === orgId ? value : r)))
    } else {
      onResolve([...resolutions, value])
    }
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertTriangleIcon className="size-4" />
        <AlertTitle>Organization Ownership</AlertTitle>
        <AlertDescription>
          You own the following organizations. Choose what happens to each one before deleting your
          account.
        </AlertDescription>
      </Alert>

      {orgs.map((org) => {
        const resolution = resolutions.find((r) => r.organizationId === org.id)
        const action = resolution?.action ?? 'delete'
        const currentTransferUserId =
          resolution?.action === 'transfer' ? resolution.transferToUserId : ''
        const eligibleMembers = org.members.filter((m) => m.role !== 'owner')

        return (
          <Card key={org.id}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{org.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {org.memberCount} member{org.memberCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <Select
                  value={action}
                  onValueChange={(v: string) => {
                    if (v === 'delete') {
                      setResolution(org.id, { organizationId: org.id, action: 'delete' })
                    } else if (v === 'transfer') {
                      setResolution(org.id, {
                        organizationId: org.id,
                        action: 'transfer',
                        transferToUserId: currentTransferUserId,
                      })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleMembers.length > 0 && (
                      <SelectItem value="transfer">Transfer ownership</SelectItem>
                    )}
                    <SelectItem value="delete">Delete organization</SelectItem>
                  </SelectContent>
                </Select>

                {action === 'transfer' && eligibleMembers.length > 0 && (
                  <Select
                    value={currentTransferUserId}
                    onValueChange={(v: string) => {
                      setResolution(org.id, {
                        organizationId: org.id,
                        action: 'transfer',
                        transferToUserId: v,
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a member" />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleMembers.map((member) => (
                        <SelectItem key={member.userId} value={member.userId}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function DeleteAccountSection() {
  const { data: session } = useSession()
  const navigate = useNavigate()
  const userEmail = session?.user?.email ?? ''

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [ownedOrgs, setOwnedOrgs] = useState<OwnedOrg[]>([])
  const [resolutions, setResolutions] = useState<OrgOwnershipResolution[]>([])
  const [showOrgStep, setShowOrgStep] = useState(false)
  const [loadingOrgs, setLoadingOrgs] = useState(false)

  async function fetchOwnedOrgs(): Promise<OwnedOrg[]> {
    try {
      const { data: orgsData } = await authClient.organization.list()
      if (!orgsData) return []

      const owned: OwnedOrg[] = []
      for (const org of orgsData) {
        const { data: fullOrg } = await authClient.organization.getFullOrganization({
          query: { organizationId: org.id },
        })
        if (!fullOrg) continue

        const userMember = fullOrg.members.find(
          (m: { userId: string; role: string }) => m.userId === session?.user?.id
        )
        if (userMember && userMember.role === 'owner') {
          owned.push({
            id: org.id,
            name: org.name,
            memberCount: fullOrg.members.length,
            members: fullOrg.members.map(
              (m: { id: string; userId: string; role: string; user: { name: string | null } }) => ({
                id: m.id,
                userId: m.userId,
                name: m.user.name ?? 'Unknown',
                role: m.role,
              })
            ),
          })
        }
      }

      return owned
    } catch {
      return []
    }
  }

  async function handleDeleteClick() {
    setLoadingOrgs(true)
    const orgs = await fetchOwnedOrgs()
    setOwnedOrgs(orgs)

    if (orgs.length > 0) {
      // Initialize resolutions with default "delete" for each org
      setResolutions(orgs.map((org) => ({ organizationId: org.id, action: 'delete' as const })))
      setShowOrgStep(true)
    } else {
      setShowOrgStep(false)
      setDeleteOpen(true)
    }
    setLoadingOrgs(false)
  }

  function handleOrgStepComplete() {
    // Validate all transfer resolutions have a target member
    const allResolved = resolutions.every(
      (r) => r.action === 'delete' || (r.action === 'transfer' && r.transferToUserId)
    )
    if (!allResolved) {
      toast.error('Please select a member to transfer ownership to for all organizations')
      return
    }
    setShowOrgStep(false)
    setDeleteOpen(true)
  }

  async function handleConfirmDelete() {
    setDeleting(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmEmail: userEmail,
          orgResolutions: resolutions,
        }),
      })

      if (!res.ok) {
        const data: unknown = await res.json().catch(() => null)
        toast.error(parseErrorMessage(data, 'Failed to delete account'))
        return
      }

      setDeleteOpen(false)
      await authClient.signOut()
      navigate({ to: '/account-deleted' })
    } catch {
      toast.error('Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This action is reversible
            during a 30-day grace period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDeleteClick} disabled={loadingOrgs}>
            {loadingOrgs ? 'Checking...' : 'Delete My Account'}
          </Button>
        </CardContent>
      </Card>

      {showOrgStep && (
        <DestructiveConfirmDialog
          open={showOrgStep}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setShowOrgStep(false)
              setResolutions([])
            }
          }}
          title="Resolve Organization Ownership"
          description="You must decide what happens to your organizations before deleting your account."
          confirmText={userEmail}
          confirmLabel="Type your email to continue"
          impactSummary={
            <OrgResolutionStep
              orgs={ownedOrgs}
              resolutions={resolutions}
              onResolve={setResolutions}
            />
          }
          onConfirm={handleOrgStepComplete}
          isLoading={false}
        />
      )}

      <DestructiveConfirmDialog
        open={deleteOpen}
        onOpenChange={(open: boolean) => {
          if (!open) setDeleteOpen(false)
        }}
        title="Delete Your Account"
        description="This will schedule your account for permanent deletion. Your data will be removed after 30 days. You can reactivate by logging in during the grace period."
        confirmText={userEmail}
        confirmLabel="Type your email address to confirm"
        onConfirm={handleConfirmDelete}
        isLoading={deleting}
      />
    </>
  )
}

function AccountSettingsPage() {
  const { isOAuthOnly, loading } = useIsOAuthOnly()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!isOAuthOnly && (
        <>
          <EmailChangeSection />
          <PasswordChangeSection />
        </>
      )}

      {isOAuthOnly && (
        <Card>
          <CardHeader>
            <CardTitle>Account Type</CardTitle>
            <CardDescription>
              Your account is linked via a social provider. Email and password settings are managed
              through your provider.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Separator />

      <DeleteAccountSection />
    </div>
  )
}
