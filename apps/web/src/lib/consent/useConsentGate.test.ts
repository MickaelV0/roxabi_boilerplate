import { describe, expect, it, vi } from 'vitest'

const mockUseConsent = vi.fn()
vi.mock('./useConsent', () => ({
  useConsent: () => mockUseConsent(),
}))

// Must import after vi.mock
import { useConsentGate } from './useConsentGate'

function createConsentState(overrides: Partial<{ analytics: boolean; marketing: boolean }> = {}) {
  return {
    categories: {
      necessary: true,
      analytics: overrides.analytics,
      marketing: overrides.marketing,
    },
  }
}

describe('useConsentGate', () => {
  it('should return true when analytics category is consented', () => {
    // Arrange
    mockUseConsent.mockReturnValue(createConsentState({ analytics: true }))

    // Act
    const result = useConsentGate('analytics')

    // Assert
    expect(result).toBe(true)
  })

  it('should return false when analytics category is not consented', () => {
    // Arrange
    mockUseConsent.mockReturnValue(createConsentState({ analytics: false }))

    // Act
    const result = useConsentGate('analytics')

    // Assert
    expect(result).toBe(false)
  })

  it('should return true when marketing category is consented', () => {
    // Arrange
    mockUseConsent.mockReturnValue(createConsentState({ marketing: true }))

    // Act
    const result = useConsentGate('marketing')

    // Assert
    expect(result).toBe(true)
  })

  it('should return false when marketing category is not consented', () => {
    // Arrange
    mockUseConsent.mockReturnValue(createConsentState({ marketing: false }))

    // Act
    const result = useConsentGate('marketing')

    // Assert
    expect(result).toBe(false)
  })

  it('should return false for undefined/missing categories (the ?? false fallback)', () => {
    // Arrange — categories object exists but analytics/marketing are undefined
    mockUseConsent.mockReturnValue({
      categories: { necessary: true },
    })

    // Act
    const analyticsResult = useConsentGate('analytics')
    const marketingResult = useConsentGate('marketing')

    // Assert
    expect(analyticsResult).toBe(false)
    expect(marketingResult).toBe(false)
  })
})
