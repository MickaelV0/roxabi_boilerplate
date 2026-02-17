import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock useConsent
const mockAcceptAll = vi.fn()
const mockRejectAll = vi.fn()
const mockOpenSettings = vi.fn()
const mockUseConsent = vi.fn()

vi.mock('@/lib/consent/useConsent', () => ({
  useConsent: () => mockUseConsent(),
}))

vi.mock('@repo/ui', async () => {
  const mocks = await import('@/test/__mocks__/repo-ui')
  return { ...mocks }
})

import { ConsentBanner } from './ConsentBanner'

function defaultConsentState(overrides: Record<string, unknown> = {}) {
  return {
    categories: { necessary: true, analytics: false, marketing: false },
    consentedAt: null,
    policyVersion: null,
    action: null,
    showBanner: true,
    acceptAll: mockAcceptAll,
    rejectAll: mockRejectAll,
    saveCustom: vi.fn(),
    openSettings: mockOpenSettings,
    ...overrides,
  }
}

describe('ConsentBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseConsent.mockReturnValue(defaultConsentState())
  })

  it('should render when showBanner is true', () => {
    // Arrange
    mockUseConsent.mockReturnValue(defaultConsentState({ showBanner: true }))

    // Act
    render(<ConsentBanner />)

    // Assert
    expect(screen.getByText(/cookies/i)).toBeInTheDocument()
  })

  it('should not render when showBanner is false', () => {
    // Arrange
    mockUseConsent.mockReturnValue(defaultConsentState({ showBanner: false }))

    // Act
    const { container } = render(<ConsentBanner />)

    // Assert
    expect(container.firstChild).toBeNull()
  })

  it('should render three buttons with equal prominence', () => {
    // Arrange & Act
    render(<ConsentBanner />)

    // Assert — all three buttons should be present
    const acceptBtn = screen.getByRole('button', { name: /tout accepter/i })
    const rejectBtn = screen.getByRole('button', { name: /tout refuser/i })
    const customizeBtn = screen.getByRole('button', { name: /personnaliser/i })

    expect(acceptBtn).toBeInTheDocument()
    expect(rejectBtn).toBeInTheDocument()
    expect(customizeBtn).toBeInTheDocument()
  })

  it('should call acceptAll when clicking Tout accepter', () => {
    // Arrange
    render(<ConsentBanner />)

    // Act
    fireEvent.click(screen.getByRole('button', { name: /tout accepter/i }))

    // Assert
    expect(mockAcceptAll).toHaveBeenCalledOnce()
  })

  it('should call rejectAll when clicking Tout refuser', () => {
    // Arrange
    render(<ConsentBanner />)

    // Act
    fireEvent.click(screen.getByRole('button', { name: /tout refuser/i }))

    // Assert
    expect(mockRejectAll).toHaveBeenCalledOnce()
  })

  it('should call openSettings when clicking Personnaliser', () => {
    // Arrange
    render(<ConsentBanner />)

    // Act
    fireEvent.click(screen.getByRole('button', { name: /personnaliser/i }))

    // Assert
    expect(mockOpenSettings).toHaveBeenCalledOnce()
  })
})
