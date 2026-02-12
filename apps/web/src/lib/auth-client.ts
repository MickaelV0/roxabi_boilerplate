import { adminClient, magicLinkClient, organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  plugins: [organizationClient(), adminClient(), magicLinkClient()],
})

export const { useSession, signIn, signUp, signOut } = authClient

export type EnabledProviders = { google: boolean; github: boolean }

export async function fetchEnabledProviders(): Promise<EnabledProviders> {
  try {
    const res = await fetch('/api/auth/providers')
    if (!res.ok) return { google: false, github: false }
    return (await res.json()) as EnabledProviders
  } catch {
    return { google: false, github: false }
  }
}
