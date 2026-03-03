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
 * Type guard for API errors thrown by `updateProfile`.
 * Distinguishes intentional API errors (non-ok HTTP response) from network errors.
 */
export function isApiError(err: unknown): err is Error & { isApiError: true } {
  return (
    err instanceof Error &&
    'isApiError' in err &&
    (err as { isApiError: unknown }).isApiError === true
  )
}

/**
 * Update the current user's profile.
 *
 * On API error (non-ok response): throws an error tagged with `isApiError: true`.
 * Use `isApiError(err)` in the catch block to distinguish from network errors.
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
