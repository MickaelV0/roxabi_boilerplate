import { useContext } from 'react'
import type { ConsentContextValue } from './ConsentProvider'
import { ConsentContext } from './ConsentProvider'

export function useConsent(): ConsentContextValue {
  const context = useContext(ConsentContext)
  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider')
  }
  return context
}
