import type { ConsentActions, ConsentCategories, ConsentState } from '@repo/types'
import { createContext, type ReactNode, useContext } from 'react'

type ConsentContextValue = ConsentState & ConsentActions

const ConsentContext = createContext<ConsentContextValue | null>(null)

type ConsentProviderProps = {
  children: ReactNode
  initialConsent: ConsentState | null
}

export function ConsentProvider({
  children,
  initialConsent: _initialConsent,
}: ConsentProviderProps) {
  // TODO: implement
  // 1. On server: read initialConsent prop, compute showBanner
  // 2. On client: hydrate from initialConsent, then if authenticated, fetch GET /api/consent and reconcile (DB wins)
  // 3. Compute showBanner based on: no consent, expired (6 months), outdated policyVersion
  // 4. Provide acceptAll, rejectAll, saveCustom, openSettings actions

  const value: ConsentContextValue = {
    categories: { necessary: true, analytics: false, marketing: false },
    consentedAt: null,
    policyVersion: null,
    action: null,
    showBanner: true,
    acceptAll: () => {
      // TODO: implement
    },
    rejectAll: () => {
      // TODO: implement
    },
    saveCustom: (_categories: ConsentCategories) => {
      // TODO: implement
    },
    openSettings: () => {
      // TODO: implement
    },
  }

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
}

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext)
  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider')
  }
  return context
}
