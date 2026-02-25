import { createFileRoute } from '@tanstack/react-router'
import { authClient, useSession } from '@/lib/authClient'
import { hasPermission } from '@/lib/permissions'
import { ApiKeyListContent } from './-components/api-key-list-content'
import { CreateKeyDialog } from './-components/create-key-dialog'
import { ErrorState } from './-components/error-state'
import { LoadingSkeleton } from './-components/loading-skeleton'
import { NoOrgMessage } from './-components/no-org-message'
import { NoPermissionMessage } from './-components/no-permission-message'
import { OneTimeKeyDisplay } from './-components/one-time-key-display'
import { RevokeKeyDialog } from './-components/revoke-key-dialog'
import { useApiKeyDialogs, useApiKeys } from './-hooks'

export const Route = createFileRoute('/settings/api-keys/')({
  component: ApiKeysSettingsPage,
  head: () => ({
    meta: [{ title: 'API Keys | Settings | Roxabi' }],
  }),
})

function ApiKeysSettingsPage() {
  const { data: session } = useSession()
  const { data: activeOrg } = authClient.useActiveOrganization()
  const canRead = hasPermission(session, 'api_keys:read' as never)
  const canWrite = hasPermission(session, 'api_keys:write' as never)
  const { keys, loading, error, updateKeyLocally, addKeyLocally } = useApiKeys(activeOrg?.id)
  const dialogs = useApiKeyDialogs(addKeyLocally, updateKeyLocally)
  const userPermissions: string[] =
    session && 'permissions' in session && Array.isArray(session.permissions)
      ? session.permissions
      : []

  if (!activeOrg) return <NoOrgMessage />
  if (!canRead) return <NoPermissionMessage />
  if (loading) return <LoadingSkeleton />
  if (error) return <ErrorState error={error} />

  return (
    <div className="space-y-6">
      <ApiKeyListContent
        keys={keys}
        canWrite={canWrite}
        onCreateClick={() => dialogs.setCreateOpen(true)}
        onRevokeClick={dialogs.handleRevokeClick}
      />
      <CreateKeyDialog
        open={dialogs.createOpen}
        onOpenChange={dialogs.setCreateOpen}
        availablePermissions={userPermissions}
        onCreated={dialogs.handleCreateSuccess}
      />
      <OneTimeKeyDisplay
        open={dialogs.oneTimeOpen}
        onOpenChange={dialogs.handleOneTimeClose}
        createdKey={dialogs.oneTimeKey}
      />
      <RevokeKeyDialog
        open={dialogs.revokeOpen}
        onOpenChange={dialogs.handleRevokeClose}
        keyToRevoke={dialogs.revokeTarget}
        onConfirm={dialogs.handleRevokeConfirm}
      />
    </div>
  )
}
