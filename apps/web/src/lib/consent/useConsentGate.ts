import { useConsent } from './ConsentProvider'

export function useConsentGate(category: 'analytics' | 'marketing'): boolean {
  const { categories } = useConsent()
  return categories[category] ?? false
}
