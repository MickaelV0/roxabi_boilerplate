import type { FeatureFlag } from '@repo/types'
import { isErrorWithMessage } from '@/lib/errorUtils'

export async function toggleFeatureFlag(id: string, enabled: boolean): Promise<FeatureFlag> {
  const res = await fetch(`/api/admin/feature-flags/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  })
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null)
    throw new Error(isErrorWithMessage(body) ? body.message : 'Failed to update feature flag')
  }
  return (await res.json()) as FeatureFlag
}

export async function deleteFeatureFlag(id: string): Promise<void> {
  const res = await fetch(`/api/admin/feature-flags/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null)
    throw new Error(isErrorWithMessage(body) ? body.message : 'Failed to delete feature flag')
  }
}
