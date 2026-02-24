import {
  Badge,
  Button,
  Checkbox,
  cn,
  DestructiveConfirmDialog,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'
import { CheckIcon, CopyIcon, KeyIcon, PlusIcon, ShieldAlertIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { ApiKey, CreateApiKeyResponse } from '@/lib/api-keys'
import { createApiKey, listApiKeys, revokeApiKey } from '@/lib/api-keys'
import { authClient, useSession } from '@/lib/auth-client'
import { hasPermission } from '@/lib/permissions'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/settings/api-keys')({
  component: ApiKeysSettingsPage,
  head: () => ({
    meta: [{ title: 'API Keys | Settings | Roxabi' }],
  }),
})

// -- Types --

type ApiKeyStatus = 'active' | 'expired' | 'revoked'

// -- Helpers --

function deriveStatus(key: ApiKey): ApiKeyStatus {
  if (key.revokedAt) return 'revoked'
  if (key.expiresAt && new Date(key.expiresAt) < new Date()) return 'expired'
  return 'active'
}

function formatMaskedKey(key: ApiKey): string {
  return `${key.keyPrefix}...${key.lastFour}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function groupPermissionsByResource(permissions: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {}
  for (const perm of permissions) {
    const [resource, action] = perm.split(':')
    if (!(resource && action)) continue
    if (!groups[resource]) {
      groups[resource] = []
    }
    groups[resource].push(action)
  }
  return groups
}

function responseToApiKey(response: CreateApiKeyResponse): ApiKey {
  return {
    id: response.id,
    name: response.name,
    keyPrefix: response.keyPrefix,
    lastFour: response.lastFour,
    scopes: response.scopes,
    rateLimitTier: 'standard',
    expiresAt: response.expiresAt,
    lastUsedAt: null,
    revokedAt: null,
    createdAt: response.createdAt,
  }
}

// -- Hooks --

function useApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const response = await listApiKeys(controller.signal)
        setKeys(response.data)
      } catch (err) {
        if (controller.signal.aborted) return
        const message = err instanceof Error ? err.message : 'Failed to load API keys'
        setError(message)
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }
    load()
    return () => controller.abort()
  }, [])

  function updateKeyLocally(id: string, patch: Partial<ApiKey>) {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, ...patch } : k)))
  }

  function addKeyLocally(key: ApiKey) {
    setKeys((prev) => [key, ...prev])
  }

  return { keys, loading, error, updateKeyLocally, addKeyLocally }
}

function useCreateKeyForm(open: boolean) {
  const [name, setName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<Set<string>>(new Set())
  const [expiresAt, setExpiresAt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setName('')
      setSelectedScopes(new Set())
      setExpiresAt('')
      setSubmitting(false)
    }
  }, [open])

  function handleScopeToggle(scope: string) {
    setSelectedScopes((prev) => {
      const next = new Set(prev)
      if (next.has(scope)) {
        next.delete(scope)
      } else {
        next.add(scope)
      }
      return next
    })
  }

  return {
    name,
    setName,
    selectedScopes,
    expiresAt,
    setExpiresAt,
    submitting,
    setSubmitting,
    handleScopeToggle,
  }
}

// -- Sub-components --

function StatusBadge({ status }: { status: ApiKeyStatus }) {
  const config = {
    active: {
      label: m.api_keys_status_active(),
      className:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
    },
    expired: {
      label: m.api_keys_status_expired(),
      className:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    },
    revoked: {
      label: m.api_keys_status_revoked(),
      className:
        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    },
  }

  const { label, className } = config[status]

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}

function ScopeBadges({ scopes }: { scopes: string[] }) {
  if (scopes.length === 0) {
    return <span className="text-xs text-muted-foreground italic">{m.api_keys_no_scopes()}</span>
  }

  const maxVisible = 3
  const visible = scopes.slice(0, maxVisible)
  const remaining = scopes.length - maxVisible

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((scope) => (
        <Badge key={scope} variant="secondary" className="text-xs font-normal">
          {scope}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className="text-xs font-normal">
          +{remaining}
        </Badge>
      )}
    </div>
  )
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="mb-4 rounded-full bg-muted p-3">
        <KeyIcon className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-medium">{m.api_keys_empty_title()}</h3>
      <p className="mb-6 text-sm text-muted-foreground">{m.api_keys_empty_description()}</p>
      <Button onClick={onCreateClick}>
        <PlusIcon className="mr-2 size-4" />
        {m.api_keys_create_first()}
      </Button>
    </div>
  )
}

function KeyListTable({ keys, onRevoke }: { keys: ApiKey[]; onRevoke: (key: ApiKey) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{m.api_keys_col_name()}</TableHead>
          <TableHead>{m.api_keys_col_key()}</TableHead>
          <TableHead className="hidden md:table-cell">{m.api_keys_col_scopes()}</TableHead>
          <TableHead className="hidden sm:table-cell">{m.api_keys_col_created()}</TableHead>
          <TableHead className="hidden lg:table-cell">{m.api_keys_col_last_used()}</TableHead>
          <TableHead>{m.api_keys_col_status()}</TableHead>
          <TableHead className="text-right">{m.api_keys_col_actions()}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {keys.map((key) => {
          const status = deriveStatus(key)
          return (
            <TableRow key={key.id}>
              <TableCell className="font-medium">{key.name}</TableCell>
              <TableCell>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {formatMaskedKey(key)}
                </code>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <ScopeBadges scopes={key.scopes} />
              </TableCell>
              <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                {formatDate(key.createdAt)}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                {formatDate(key.lastUsedAt)}
              </TableCell>
              <TableCell>
                <StatusBadge status={status} />
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRevoke(key)}
                  disabled={status === 'revoked'}
                  className={cn(status === 'revoked' && 'opacity-50 cursor-not-allowed')}
                >
                  {m.api_keys_revoke()}
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

function ScopeCheckboxGroup({
  availablePermissions,
  selectedScopes,
  onToggle,
}: {
  availablePermissions: string[]
  selectedScopes: Set<string>
  onToggle: (scope: string) => void
}) {
  const grouped = groupPermissionsByResource(availablePermissions)
  const resources = Object.keys(grouped).sort()

  return (
    <div className="max-h-60 space-y-4 overflow-y-auto rounded-md border p-3">
      {resources.map((resource) => {
        const actions = grouped[resource]
        if (!actions) return null
        return (
          <div key={resource}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {resource}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {actions.sort().map((action) => {
                const perm = `${resource}:${action}`
                const checkboxId = `scope-${perm}`
                return (
                  <div
                    key={perm}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={selectedScopes.has(perm)}
                      onCheckedChange={() => onToggle(perm)}
                    />
                    <Label htmlFor={checkboxId} className="cursor-pointer text-sm font-normal">
                      {action}
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      {resources.length === 0 && (
        <p className="text-sm text-muted-foreground">{m.api_keys_no_permissions()}</p>
      )}
    </div>
  )
}

function CreateKeyFormFields({
  form,
  availablePermissions,
}: {
  form: ReturnType<typeof useCreateKeyForm>
  availablePermissions: string[]
}) {
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="api-key-name">{m.api_keys_name_label()}</Label>
        <Input
          id="api-key-name"
          value={form.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setName(e.target.value)}
          placeholder={m.api_keys_name_placeholder()}
          maxLength={100}
          required
          disabled={form.submitting}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label>{m.api_keys_scopes_label()}</Label>
        <ScopeCheckboxGroup
          availablePermissions={availablePermissions}
          selectedScopes={form.selectedScopes}
          onToggle={form.handleScopeToggle}
        />
        {form.selectedScopes.size === 0 && (
          <p className="text-xs text-muted-foreground">{m.api_keys_no_scopes_warning()}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="api-key-expiry">{m.api_keys_expiry_label()}</Label>
        <Input
          id="api-key-expiry"
          type="date"
          value={form.expiresAt}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setExpiresAt(e.target.value)}
          min={today}
          disabled={form.submitting}
        />
        <p className="text-xs text-muted-foreground">{m.api_keys_expiry_hint()}</p>
      </div>
    </div>
  )
}

function CreateKeyDialog({
  open,
  onOpenChange,
  availablePermissions,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  availablePermissions: string[]
  onCreated: (response: CreateApiKeyResponse) => void
}) {
  const form = useCreateKeyForm(open)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return

    form.setSubmitting(true)
    try {
      const response = await createApiKey({
        name: form.name.trim(),
        scopes: Array.from(form.selectedScopes),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      })
      onCreated(response)
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create API key'
      toast.error(message)
    } finally {
      form.setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{m.api_keys_create_title()}</DialogTitle>
            <DialogDescription>{m.api_keys_create_description()}</DialogDescription>
          </DialogHeader>

          <CreateKeyFormFields form={form} availablePermissions={availablePermissions} />

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={form.submitting}>
                {m.api_keys_cancel()}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={form.submitting || !form.name.trim()}>
              {form.submitting ? m.api_keys_creating() : m.api_keys_create()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function OneTimeKeyDisplay({
  open,
  onOpenChange,
  createdKey,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  createdKey: CreateApiKeyResponse | null
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) setCopied(false)
  }, [open])

  async function handleCopy() {
    if (!createdKey) return
    try {
      await navigator.clipboard.writeText(createdKey.key)
      setCopied(true)
      toast.success(m.api_keys_copied())
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(m.api_keys_copy_failed())
    }
  }

  if (!createdKey) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{m.api_keys_created_title()}</DialogTitle>
          <DialogDescription>{m.api_keys_created_description()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-md border bg-muted/50 p-3">
            <code className="block break-all font-mono text-sm">{createdKey.key}</code>
          </div>

          <Button onClick={handleCopy} variant="outline" className="w-full">
            {copied ? (
              <>
                <CheckIcon className="mr-2 size-4" />
                {m.api_keys_copied()}
              </>
            ) : (
              <>
                <CopyIcon className="mr-2 size-4" />
                {m.api_keys_copy()}
              </>
            )}
          </Button>

          <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
            <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-yellow-600 dark:text-yellow-500" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {m.api_keys_one_time_warning()}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            {m.api_keys_done()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RevokeKeyDialog({
  open,
  onOpenChange,
  keyToRevoke,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  keyToRevoke: ApiKey | null
  onConfirm: () => void
}) {
  if (!keyToRevoke) return null

  return (
    <DestructiveConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={m.api_keys_revoke_title()}
      description={m.api_keys_revoke_description({ name: keyToRevoke.name })}
      confirmText={keyToRevoke.name}
      confirmLabel={m.api_keys_revoke_confirm_label()}
      onConfirm={onConfirm}
    />
  )
}

// -- Permission gate messages --

function NoPermissionMessage() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="mb-4 rounded-full bg-muted p-3">
        <ShieldAlertIcon className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-medium">{m.api_keys_no_permission_title()}</h3>
      <p className="text-sm text-muted-foreground">{m.api_keys_no_permission_description()}</p>
    </div>
  )
}

function NoOrgMessage() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="mb-4 rounded-full bg-muted p-3">
        <KeyIcon className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-medium">{m.api_keys_no_org_title()}</h3>
      <p className="text-sm text-muted-foreground">{m.api_keys_no_org_description()}</p>
    </div>
  )
}

const SKELETON_KEYS = ['skeleton-1', 'skeleton-2', 'skeleton-3']

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        <div className="h-9 w-36 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-2">
        {SKELETON_KEYS.map((id) => (
          <div key={id} className="h-14 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  )
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
      <p className="text-sm text-destructive">{error}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
        {m.api_keys_retry()}
      </Button>
    </div>
  )
}

function ApiKeyListContent({
  keys,
  canWrite,
  onCreateClick,
  onRevokeClick,
}: {
  keys: ApiKey[]
  canWrite: boolean
  onCreateClick: () => void
  onRevokeClick: (key: ApiKey) => void
}) {
  if (keys.length === 0) {
    return <EmptyState onCreateClick={onCreateClick} />
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{m.api_keys_count({ count: keys.length })}</p>
        {canWrite && (
          <Button onClick={onCreateClick}>
            <PlusIcon className="mr-2 size-4" />
            {m.api_keys_create_button()}
          </Button>
        )}
      </div>
      <KeyListTable keys={keys} onRevoke={onRevokeClick} />
    </>
  )
}

// -- Dialog state management hook --

function useApiKeyDialogs(
  addKeyLocally: (key: ApiKey) => void,
  updateKeyLocally: (id: string, patch: Partial<ApiKey>) => void
) {
  const [createOpen, setCreateOpen] = useState(false)
  const [oneTimeKey, setOneTimeKey] = useState<CreateApiKeyResponse | null>(null)
  const [oneTimeOpen, setOneTimeOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null)
  const [revokeOpen, setRevokeOpen] = useState(false)

  function handleCreateSuccess(response: CreateApiKeyResponse) {
    addKeyLocally(responseToApiKey(response))
    setOneTimeKey(response)
    setOneTimeOpen(true)
    toast.success(m.api_keys_create_success())
  }

  function handleRevokeClick(key: ApiKey) {
    setRevokeTarget(key)
    setRevokeOpen(true)
  }

  async function handleRevokeConfirm() {
    if (!revokeTarget) return
    try {
      const result = await revokeApiKey(revokeTarget.id)
      updateKeyLocally(revokeTarget.id, { revokedAt: result.revokedAt })
      toast.success(m.api_keys_revoke_success())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to revoke API key'
      toast.error(message)
    } finally {
      setRevokeOpen(false)
      setRevokeTarget(null)
    }
  }

  function handleOneTimeClose(open: boolean) {
    if (!open) {
      setOneTimeKey(null)
      setOneTimeOpen(false)
    }
  }

  function handleRevokeClose(open: boolean) {
    if (!open) {
      setRevokeOpen(false)
      setRevokeTarget(null)
    }
  }

  return {
    createOpen,
    setCreateOpen,
    oneTimeKey,
    oneTimeOpen,
    revokeTarget,
    revokeOpen,
    handleCreateSuccess,
    handleRevokeClick,
    handleRevokeConfirm,
    handleOneTimeClose,
    handleRevokeClose,
  }
}

// -- Main page component --

function ApiKeysSettingsPage() {
  const { data: session } = useSession()
  const { data: activeOrg } = authClient.useActiveOrganization()
  const canRead = hasPermission(session, 'api_keys:read' as never)
  const canWrite = hasPermission(session, 'api_keys:write' as never)
  const { keys, loading, error, updateKeyLocally, addKeyLocally } = useApiKeys()
  const dialogs = useApiKeyDialogs(addKeyLocally, updateKeyLocally)
  const userPermissions: string[] =
    (session as { permissions?: string[] } | null)?.permissions ?? []

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
