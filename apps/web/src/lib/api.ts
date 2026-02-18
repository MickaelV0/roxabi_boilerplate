/**
 * Shared API utility functions for common fetch calls.
 * All functions include credentials for cookie-based auth.
 */

export async function fetchUserProfile(signal?: AbortSignal) {
  return fetch('/api/users/me', { credentials: 'include', signal })
}

export async function fetchOrganizations(signal?: AbortSignal) {
  return fetch('/api/organizations', { credentials: 'include', signal })
}

export async function deleteAccount(confirmEmail: string, orgResolutions: unknown[] = []) {
  return fetch('/api/users/me', {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmEmail, orgResolutions }),
  })
}

export async function reactivateAccount() {
  return fetch('/api/users/me/reactivate', {
    method: 'POST',
    credentials: 'include',
  })
}

export async function purgeAccount(confirmEmail: string) {
  return fetch('/api/users/me/purge', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmEmail }),
  })
}
