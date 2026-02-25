import { useContext } from 'react'
import type { ConsentContextValue } from './consentProvider'
import { ConsentContext } from './consentProvider'

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext)
  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider')
  }
  return context
}
