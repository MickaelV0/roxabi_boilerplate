import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockParaglideMessages } from '@/test/__mocks__/mock-messages'

const captured = vi.hoisted(() => ({
  Component: (() => null) as React.ComponentType,
}))

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType }) => {
    captured.Component = config.component
    return { component: config.component }
  },
  useNavigate: () => mockNavigate,
  useSearch: () => ({ deleteScheduledFor: '2026-03-20T00:00:00Z' }),
}))

vi.mock('@repo/ui', async () => {
  const repoUi = await import('@/test/__mocks__/repo-ui')
  return {
    ...repoUi,
    DestructiveConfirmDialog: ({
      open,
      title,
      onConfirm,
      isLoading,
    }: {
      open: boolean
      title: string
      onConfirm?: () => void
      isLoading?: boolean
    }) =>
      open ? (
        <div data-testid="purge-dialog">
          <h2>{title}</h2>
          <button
            type="button"
            data-testid="purge-confirm-button"
            onClick={onConfirm}
            disabled={isLoading}
          >
            Confirm Purge
          </button>
        </div>
      ) : null,
    Separator: () => <hr />,
    Alert: ({ children }: React.PropsWithChildren) => <div role="alert">{children}</div>,
    AlertTitle: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
    AlertDescription: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
  }
})

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signOut: vi.fn().mockResolvedValue({}),
  },
  useSession: vi.fn(() => ({
    data: {
      user: { id: 'user-1', name: 'Jane Doe', email: 'jane@example.com' },
    },
  })),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

mockParaglideMessages()

let originalFetch: typeof globalThis.fetch

// Import after mocks to trigger createFileRoute and capture the component
import './account-reactivation'

describe('AccountReactivationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('should render the reactivation page with title and alert', () => {
    // Arrange
    const Page = captured.Component

    // Act
    render(<Page />)

    // Assert
    expect(screen.getByText('account_reactivation_title')).toBeInTheDocument()
    expect(screen.getByText('account_reactivation_deletion_pending')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'account_reactivation_button' })).toBeInTheDocument()
  })

  it('should open purge confirmation dialog when clicking delete permanently button', () => {
    // Arrange
    const Page = captured.Component
    render(<Page />)

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'account_reactivation_delete_permanently' }))

    // Assert
    expect(screen.getByTestId('purge-dialog')).toBeInTheDocument()
    expect(screen.getByText('account_purge_confirm_title')).toBeInTheDocument()
  })

  it('should navigate to /account-deleted?purged=true after successful purge', async () => {
    // Arrange
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    })
    globalThis.fetch = mockFetch

    const Page = captured.Component
    render(<Page />)

    // Open purge dialog
    fireEvent.click(screen.getByRole('button', { name: 'account_reactivation_delete_permanently' }))

    // Act -- confirm purge
    fireEvent.click(screen.getByTestId('purge-confirm-button'))

    // Assert
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/account-deleted',
        search: { purged: 'true' },
      })
    })
  })
})
