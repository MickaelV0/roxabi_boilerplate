import { adminClient, magicLinkClient, organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  plugins: [organizationClient(), adminClient(), magicLinkClient()],
})

export const { useSession, signIn, signUp, signOut } = authClient
