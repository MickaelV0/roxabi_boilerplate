import type { UpdateProfilePayload, UserProfile } from '@repo/types'
import { isErrorWithMessage } from '@/lib/errorUtils'

/**
 * Fetch the current user's profile from the API.
 * Throws on network error or non-ok response.
 */
export async function getProfile(): Promise<UserProfile> {
  const res = await fetch('/api/users/me', { credentials: 'include' })
  if (!res.ok) throw new Error('fetch failed')
  return res.json() as Promise<UserProfile>
}

/**
 * Update the current user's profile.
 *
 * On API error (non-ok response): throws Error with `message` from the response body
 * (empty string if body has no message). Tagged with `isApiError: true` so the component
 * can distinguish this from network errors.
 *
 * On network error: throws a generic Error (no `isApiError` property).
 */
export async function updateProfile(payload: UpdateProfilePayload): Promise<void> {
  const res = await fetch('/api/users/me', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const data: unknown = await res.json().catch(() => null)
    const err = Object.assign(new Error(isErrorWithMessage(data) ? data.message : ''), {
      isApiError: true as const,
    })
    throw err
  }
}
