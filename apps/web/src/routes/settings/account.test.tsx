import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockParaglideMessages } from '@/test/__mocks__/mockMessages'

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
}))

vi.mock('@repo/ui', async () => {
  const repoUi = await import('@/test/__mocks__/repoUi')
  return {
    ...repoUi,
    DestructiveConfirmDialog: ({
      open,
      title,
      description,
      confirmLabel,
      confirmText,
      impactSummary,
      onConfirm,
      isLoading,
    }: {
      open: boolean
      title: string
      description: string
      confirmLabel?: string
      confirmText?: string
      impactSummary?: React.ReactNode
      onConfirm?: () => void
      isLoading?: boolean
    }) =>
      open ? (
        <div data-testid="destructive-confirm-dialog">
          <h2>{title}</h2>
          <p>{description}</p>
          {confirmLabel && <p>{confirmLabel}</p>}
          {impactSummary}
          {confirmText && <input data-testid="confirm-input" defaultValue="" />}
          <button
            type="button"
            data-testid="confirm-button"
            onClick={onConfirm}
            disabled={isLoading}
          >
            Confirm
          </button>
        </div>
      ) : null,
    PasswordInput: (props: Record<string, unknown>) => <input type="password" {...props} />,
    Separator: () => <hr />,
    Alert: ({ children }: React.PropsWithChildren) => <div role="alert">{children}</div>,
    AlertTitle: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
    AlertDescription: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
  }
})

const mockListAccounts = vi.fn()
const mockChangeEmail = vi.fn()
const mockChangePassword = vi.fn()
const mockSignOut = vi.fn()
const mockGetFullOrg = vi.fn()

vi.mock('@/lib/authClient', () => ({
  authClient: {
    listAccounts: () => mockListAccounts(),
    changeEmail: (params: unknown) => mockChangeEmail(params),
    changePassword: (params: unknown) => mockChangePassword(params),
    signOut: () => mockSignOut(),
    organization: {
      getFullOrganization: (params: unknown) => mockGetFullOrg(params),
    },
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

// Import after mocks to trigger createFileRoute and capture the component
import { toast } from 'sonner'
import './account'

let originalFetch: typeof globalThis.fetch

function setupCredentialAccount() {
  mockListAccounts.mockResolvedValue({
    data: [{ providerId: 'credential' }],
  })
}

function setupOAuthOnlyAccount() {
  mockListAccounts.mockResolvedValue({
    data: [{ providerId: 'google' }],
  })
}

describe('AccountSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  describe('Email change', () => {
    it('should allow email change via Better Auth verify-new-email-first flow', async () => {
      setupCredentialAccount()
      mockChangeEmail.mockResolvedValue({ error: null })

      const Account = captured.Component
      render(<Account />)

      await waitFor(() => {
        expect(screen.getByLabelText('account_email_new_label')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText('account_email_new_label'), {
        target: { value: 'new@example.com' },
      })

      const form = screen.getByLabelText('account_email_new_label').closest('form')
      if (!form) throw new Error('form not found')
      fireEvent.submit(form)

      await waitFor(() => {
        expect(mockChangeEmail).toHaveBeenCalledWith({ newEmail: 'new@example.com' })
      })

      await waitFor(() => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
          'account_email_change_success({"email":"new@example.com"})'
        )
      })
    })

    it('should show i18n error toast when email change returns an error', async () => {
      setupCredentialAccount()
      mockChangeEmail.mockResolvedValue({ error: { message: 'Server error details' } })

      const Account = captured.Component
      render(<Account />)

      await waitFor(() => {
        expect(screen.getByLabelText('account_email_new_label')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText('account_email_new_label'), {
        target: { value: 'new@example.com' },
      })

      const form = screen.getByLabelText('account_email_new_label').closest('form')
      if (!form) throw new Error('form not found')
      fireEvent.submit(form)

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith('account_email_change_error')
      })
    })

    it('should show i18n error toast when email change throws', async () => {
      setupCredentialAccount()
      mockChangeEmail.mockRejectedValue(new Error('Network failure'))

      const Account = captured.Component
      render(<Account />)

      await waitFor(() => {
        expect(screen.getByLabelText('account_email_new_label')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText('account_email_new_label'), {
        target: { value: 'new@example.com' },
      })

      const form = screen.getByLabelText('account_email_new_label').closest('form')
      if (!form) throw new Error('form not found')
      fireEvent.submit(form)

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith('account_email_change_error')
      })
    })
  })

  describe('Password change', () => {
    it('should allow password change for email+password accounts', async () => {
      setupCredentialAccount()
      mockChangePassword.mockResolvedValue({ error: null })

      const Account = captured.Component
      render(<Account />)

      await waitFor(() => {
        expect(screen.getByLabelText('account_password_current')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText('account_password_current'), {
        target: { value: 'oldpass123' },
      })
      fireEvent.change(screen.getByLabelText('account_password_new'), {
        target: { value: 'newpass456' },
      })
      fireEvent.change(screen.getByLabelText('account_password_confirm'), {
        target: { value: 'newpass456' },
      })

      const form = screen.getByLabelText('account_password_current').closest('form')
      if (!form) throw new Error('form not found')
      fireEvent.submit(form)

      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith({
          currentPassword: 'oldpass123',
          newPassword: 'newpass456',
        })
      })

      await waitFor(() => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledWith('account_password_update_success')
      })
    })

    it('should show i18n error toast when password change returns an error', async () => {
      setupCredentialAccount()
      mockChangePassword.mockResolvedValue({ error: { message: 'Invalid current password' } })

      const Account = captured.Component
      render(<Account />)

      await waitFor(() => {
        expect(screen.getByLabelText('account_password_current')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText('account_password_current'), {
        target: { value: 'wrongpass' },
      })
      fireEvent.change(screen.getByLabelText('account_password_new'), {
        target: { value: 'newpass456' },
      })
      fireEvent.change(screen.getByLabelText('account_password_confirm'), {
        target: { value: 'newpass456' },
      })

      const form = screen.getByLabelText('account_password_current').closest('form')
      if (!form) throw new Error('form not found')
      fireEvent.submit(form)

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith('account_password_update_error')
      })
    })

    it('should show mismatch message when passwords do not match', async () => {
      setupCredentialAccount()
      const Account = captured.Component
      render(<Account />)

      await waitFor(() => {
        expect(screen.getByLabelText('account_password_current')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText('account_password_new'), {
        target: { value: 'abc123' },
      })
      fireEvent.change(screen.getByLabelText('account_password_confirm'), {
        target: { value: 'xyz789' },
      })

      expect(screen.getByText('account_password_mismatch')).toBeInTheDocument()
    })

    it('should hide email/password sections for OAuth-only accounts', async () => {
      setupOAuthOnlyAccount()

      const Account = captured.Component
      render(<Account />)

      await waitFor(() => {
        expect(screen.getByText('account_type_title')).toBeInTheDocument()
      })

      expect(screen.queryByLabelText('account_email_new_label')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('account_password_current')).not.toBeInTheDocument()
    })
  })

  describe('Account deletion', () => {
    it('should show delete account button', async () => {
      setupCredentialAccount()

      const Account = captured.Component
      render(<Account />)

      await waitFor(() => {
        expect(screen.getByText('account_danger_zone')).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /account_delete_button/i })).toBeInTheDocument()
    })

    it('should show org ownership resolution flow when user owns orgs', async () => {
      setupCredentialAccount()

      const mockFetch = vi.fn().mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/api/organizations')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([{ id: 'org-1', name: 'My Org' }]),
          })
        }
        return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
      })
      globalThis.fetch = mockFetch

      mockGetFullOrg.mockResolvedValue({
        data: {
          members: [
            { id: 'm1', userId: 'user-1', role: 'owner', user: { name: 'Jane Doe' } },
            { id: 'm2', userId: 'user-2', role: 'member', user: { name: 'Bob' } },
          ],
        },
      })

      const Account = captured.Component
      render(<Account />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /account_delete_button/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /account_delete_button/i }))

      await waitFor(() => {
        expect(screen.getByText('account_delete_resolve_title')).toBeInTheDocument()
      })
    })

    it('should require typing email to enable delete button', async () => {
      setupCredentialAccount()

      const mockFetch = vi.fn().mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/api/organizations')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          })
        }
        return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
      })
      globalThis.fetch = mockFetch

      const Account = captured.Component
      render(<Account />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /account_delete_button/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /account_delete_button/i }))

      await waitFor(() => {
        expect(screen.getByText('account_delete_confirm_email_label')).toBeInTheDocument()
      })
    })

    it('should navigate to account-reactivation on deletion', async () => {
      setupCredentialAccount()

      const mockFetch = vi.fn().mockImplementation((url: string, options?: { method?: string }) => {
        if (typeof url === 'string' && url.includes('/api/organizations')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          })
        }
        if (
          typeof url === 'string' &&
          url.includes('/api/users/me') &&
          options?.method === 'DELETE'
        ) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
          })
        }
        return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
      })
      globalThis.fetch = mockFetch

      const Account = captured.Component
      render(<Account />)

      // Wait for the page to render
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /account_delete_button/i })).toBeInTheDocument()
      })

      // Click delete to open confirm dialog (no owned orgs -> direct confirm)
      fireEvent.click(screen.getByRole('button', { name: /account_delete_button/i }))

      // Wait for the confirm dialog to appear
      await waitFor(() => {
        expect(screen.getByTestId('confirm-button')).toBeInTheDocument()
      })

      // Click confirm to trigger the deletion
      fireEvent.click(screen.getByTestId('confirm-button'))

      // Assert navigation to account-reactivation
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/account-reactivation' })
      })
    })
  })
})
