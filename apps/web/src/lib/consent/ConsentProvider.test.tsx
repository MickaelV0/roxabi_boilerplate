import type { ConsentCookiePayload } from '@repo/types'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock auth-client to control useSession
const mockUseSession = vi.fn()
vi.mock('@/lib/auth-client', () => ({
  useSession: () => mockUseSession(),
}))

// Mock @repo/ui with shared mocks + Switch + Separator
vi.mock('@repo/ui', async () => {
  const mocks = await import('@/test/__mocks__/repo-ui')
  return {
    ...mocks,
    Separator: () => <hr />,
    Switch: ({
      checked,
      disabled,
      onCheckedChange,
      ...props
    }: {
      checked?: boolean
      disabled?: boolean
      onCheckedChange?: (v: boolean) => void
      [key: string]: unknown
    }) => (
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
    ),
  }
})

// Must import after vi.mock
import { ConsentProvider, useConsent } from './ConsentProvider'

function ConsentTestConsumer() {
  const ctx = useConsent()
  return (
    <div>
      <span data-testid="show-banner">{String(ctx.showBanner)}</span>
      <span data-testid="action">{ctx.action ?? 'null'}</span>
      <span data-testid="analytics">{String(ctx.categories.analytics)}</span>
      <span data-testid="marketing">{String(ctx.categories.marketing)}</span>
      <span data-testid="policy-version">{ctx.policyVersion ?? 'null'}</span>
      <button type="button" onClick={ctx.acceptAll}>
        Accept All
      </button>
      <button type="button" onClick={ctx.rejectAll}>
        Reject All
      </button>
      <button
        type="button"
        onClick={() => ctx.saveCustom({ necessary: true, analytics: true, marketing: false })}
      >
        Save Custom
      </button>
      <button type="button" onClick={ctx.openSettings}>
        Open Settings
      </button>
    </div>
  )
}

function renderWithProvider(initialConsent: ConsentCookiePayload | null) {
  return render(
    <ConsentProvider initialConsent={initialConsent}>
      <ConsentTestConsumer />
    </ConsentProvider>
  )
}

describe('ConsentProvider / useConsent', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // Default: unauthenticated user
    mockUseSession.mockReturnValue({ data: null })
    // Reset cookie
    // biome-ignore lint/suspicious/noDocumentCookie: Required for consent cookie management
    document.cookie = 'consent=; Max-Age=0'
    // Mock fetch globally
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
  })

  describe('showBanner', () => {
    it('should be true when no consent exists', () => {
      // Arrange & Act
      renderWithProvider(null)

      // Assert
      expect(screen.getByTestId('show-banner')).toHaveTextContent('true')
    })

    it('should be true when consent is older than 6 months', () => {
      // Arrange — consent from 7 months ago
      const sevenMonthsAgo = new Date()
      sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7)

      const oldConsent: ConsentCookiePayload = {
        categories: { necessary: true, analytics: true, marketing: true },
        consentedAt: sevenMonthsAgo.toISOString(),
        policyVersion: '2026-02-v1',
        action: 'accepted',
      }

      // Act
      renderWithProvider(oldConsent)

      // Assert
      expect(screen.getByTestId('show-banner')).toHaveTextContent('true')
    })

    it('should be true when policyVersion is outdated', () => {
      // Arrange — consent with old policy version
      const outdatedConsent: ConsentCookiePayload = {
        categories: { necessary: true, analytics: true, marketing: true },
        consentedAt: new Date().toISOString(),
        policyVersion: '2025-01-v1', // Outdated vs current '2026-02-v1'
        action: 'accepted',
      }

      // Act
      renderWithProvider(outdatedConsent)

      // Assert
      expect(screen.getByTestId('show-banner')).toHaveTextContent('true')
    })

    it('should be false when valid consent exists', () => {
      // Arrange — fresh consent with current policy version
      const validConsent: ConsentCookiePayload = {
        categories: { necessary: true, analytics: true, marketing: true },
        consentedAt: new Date().toISOString(),
        policyVersion: '2026-02-v1',
        action: 'accepted',
      }

      // Act
      renderWithProvider(validConsent)

      // Assert
      expect(screen.getByTestId('show-banner')).toHaveTextContent('false')
    })
  })

  describe('consent actions', () => {
    it('should set all categories to true and action to accepted on acceptAll', () => {
      // Arrange
      renderWithProvider(null)

      // Act
      fireEvent.click(screen.getByRole('button', { name: 'Accept All' }))

      // Assert
      expect(screen.getByTestId('analytics')).toHaveTextContent('true')
      expect(screen.getByTestId('marketing')).toHaveTextContent('true')
      expect(screen.getByTestId('action')).toHaveTextContent('accepted')
      expect(screen.getByTestId('show-banner')).toHaveTextContent('false')
    })

    it('should set analytics and marketing to false and action to rejected on rejectAll', () => {
      // Arrange
      renderWithProvider(null)

      // Act
      fireEvent.click(screen.getByRole('button', { name: 'Reject All' }))

      // Assert
      expect(screen.getByTestId('analytics')).toHaveTextContent('false')
      expect(screen.getByTestId('marketing')).toHaveTextContent('false')
      expect(screen.getByTestId('action')).toHaveTextContent('rejected')
      expect(screen.getByTestId('show-banner')).toHaveTextContent('false')
    })

    it('should save given categories with action customized on saveCustom', () => {
      // Arrange
      renderWithProvider(null)

      // Act
      fireEvent.click(screen.getByRole('button', { name: 'Save Custom' }))

      // Assert
      expect(screen.getByTestId('analytics')).toHaveTextContent('true')
      expect(screen.getByTestId('marketing')).toHaveTextContent('false')
      expect(screen.getByTestId('action')).toHaveTextContent('customized')
      expect(screen.getByTestId('show-banner')).toHaveTextContent('false')
    })
  })

  describe('useConsent outside provider', () => {
    it('should throw when used outside ConsentProvider', () => {
      // Arrange & Act & Assert
      expect(() => {
        render(<ConsentTestConsumer />)
      }).toThrow('useConsent must be used within a ConsentProvider')
    })
  })
})
