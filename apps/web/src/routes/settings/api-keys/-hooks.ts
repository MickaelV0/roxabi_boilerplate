import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { ApiKey, CreateApiKeyResponse } from '@/lib/api-keys'
import { listApiKeys, revokeApiKey } from '@/lib/api-keys'
import { m } from '@/paraglide/messages'
import { responseToApiKey } from './-helpers'

export function useApiKeys(orgId: string | undefined) {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: orgId triggers re-fetch on org switch
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
  }, [orgId])

  function updateKeyLocally(id: string, patch: Partial<ApiKey>) {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, ...patch } : k)))
  }

  function addKeyLocally(key: ApiKey) {
    setKeys((prev) => [key, ...prev])
  }

  return { keys, loading, error, updateKeyLocally, addKeyLocally }
}

export function useCreateKeyForm(open: boolean) {
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

export function useApiKeyDialogs(
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
