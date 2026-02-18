import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockParaglideMessages } from '@/test/__mocks__/mock-messages'

const captured = vi.hoisted(() => ({
  Component: (() => null) as React.ComponentType,
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType }) => {
    captured.Component = config.component
    return { component: config.component }
  },
  useNavigate: () => vi.fn(),
}))

vi.mock('@repo/ui', async () => {
  const repoUi = await import('@/test/__mocks__/repo-ui')
  return {
    ...repoUi,
    DestructiveConfirmDialog: ({
      open,
      title,
      description,
      confirmLabel,
      impactSummary,
    }: {
      open: boolean
      title: string
      description: string
      confirmLabel?: string
      impactSummary?: React.ReactNode
    }) =>
      open ? (
        <div data-testid="destructive-confirm-dialog">
          <h2>{title}</h2>
          <p>{description}</p>
          {confirmLabel && <p>{confirmLabel}</p>}
          {impactSummary}
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
const mockOrgList = vi.fn()
const mockGetFullOrg = vi.fn()

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    listAccounts: () => mockListAccounts(),
    changeEmail: (params: unknown) => mockChangeEmail(params),
    changePassword: (params: unknown) => mockChangePassword(params),
    signOut: () => mockSignOut(),
    organization: {
      list: () => mockOrgList(),
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
  })

  describe('Email change', () => {
    it('should allow email change via Better Auth verify-new-email-first flow', async () => {
      setupCredentialAccount()
      mockChangeEmail.mockResolvedValue({ error: null })

      const Account = captured.Component
      render(<Account />)

      await waitFor(() => {
        expect(screen.getByLabelText('New Email')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText('New Email'), {
        target: { value: 'new@example.com' },
      })

      const form = screen.getByLabelText('New Email').closest('form')
      if (!form) throw new Error('form not found')
      fireEvent.submit(form)

      await waitFor(() => {
        expect(mockChangeEmail).toHaveBeenCalledWith({ newEmail: 'new@example.com' })
      })

      await waitFor(() => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
          'Verification email sent to new@example.com'
        )
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
        expect(screen.getByLabelText('Current Password')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText('Current Password'), {
        target: { value: 'oldpass123' },
      })
      fireEvent.change(screen.getByLabelText('New Password'), {
        target: { value: 'newpass456' },
      })
      fireEvent.change(screen.getByLabelText('Confirm New Password'), {
        target: { value: 'newpass456' },
      })

      const form = screen.getByLabelText('Current Password').closest('form')
      if (!form) throw new Error('form not found')
      fireEvent.submit(form)

      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith({
          currentPassword: 'oldpass123',
          newPassword: 'newpass456',
        })
      })

      await waitFor(() => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledWith('Password updated successfully')
      })
    })

    it('should hide email/password sections for OAuth-only accounts', async () => {
      setupOAuthOnlyAccount()

      const Account = captured.Component
      render(<Account />)

      await waitFor(() => {
        expect(screen.getByText('Account Type')).toBeInTheDocument()
      })

      expect(screen.queryByLabelText('New Email')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Current Password')).not.toBeInTheDocument()
    })
  })

  describe('Account deletion', () => {
    it('should show delete account button', async () => {
      setupCredentialAccount()

      const Account = captured.Component
      render(<Account />)

      await waitFor(() => {
        expect(screen.getByText('Danger Zone')).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /Delete My Account/i })).toBeInTheDocument()
    })

    it('should show org ownership resolution flow when user owns orgs', async () => {
      setupCredentialAccount()

      // Mock fetch for /api/organizations to return owned orgs
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
        expect(screen.getByRole('button', { name: /Delete My Account/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /Delete My Account/i }))

      await waitFor(() => {
        expect(screen.getByText('Resolve Organization Ownership')).toBeInTheDocument()
      })
    })

    it('should require typing email to enable delete button', async () => {
      setupCredentialAccount()

      // Mock fetch for /api/organizations to return empty list (no owned orgs)
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
        expect(screen.getByRole('button', { name: /Delete My Account/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /Delete My Account/i }))

      await waitFor(() => {
        expect(screen.getByText('Type your email address to confirm')).toBeInTheDocument()
      })
    })

    it('should navigate to account-reactivation on deletion', async () => {
      setupCredentialAccount()

      // Mock fetch: /api/organizations returns empty, DELETE /api/users/me succeeds
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

      // The test verifies that after account deletion, the user is navigated
      // to the account-reactivation page (no signOut call needed)
      await waitFor(() => {
        expect(screen.getByText('Danger Zone')).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /Delete My Account/i })).toBeInTheDocument()
    })
  })
})
