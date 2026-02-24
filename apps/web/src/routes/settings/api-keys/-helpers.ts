import type { ApiKey, CreateApiKeyResponse } from '@/lib/api-keys'
import { m } from '@/paraglide/messages'
import type { ApiKeyStatus } from './-types'

export function deriveStatus(key: ApiKey): ApiKeyStatus {
  if (key.revokedAt) return 'revoked'
  if (key.expiresAt && new Date(key.expiresAt) < new Date()) return 'expired'
  return 'active'
}

export function formatMaskedKey(key: ApiKey): string {
  return `${key.keyPrefix}...${key.lastFour}`
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return m.api_keys_never()
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function groupPermissionsByResource(permissions: string[]): Record<string, string[]> {
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

export function responseToApiKey(response: CreateApiKeyResponse): ApiKey {
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
