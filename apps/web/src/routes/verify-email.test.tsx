import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { authClient } from '@/lib/auth-client'
import { mockParaglideMessages } from '@/test/__mocks__/mock-messages'

const { captured, useSearchFn, useSessionFn } = vi.hoisted(() => ({
  captured: { Component: (() => null) as React.ComponentType },
  useSearchFn: vi.fn(() => ({ token: undefined as string | undefined })),
  useSessionFn: vi.fn(() => ({ data: null as { user: { email: string } } | null })),
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { validateSearch?: unknown; component: React.ComponentType }) => {
    captured.Component = config.component
    return { component: config.component, useSearch: useSearchFn }
  },
  Link: ({
    children,
    to,
    ...props
  }: React.PropsWithChildren<{ to: string; className?: string }>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@repo/ui', async () => await import('@/test/__mocks__/repo-ui'))

vi.mock('@/lib/auth-client', () => ({
  useSession: useSessionFn,
  authClient: {
    verifyEmail: vi.fn(() => new Promise(() => {})),
    sendVerificationEmail: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => (
    <span data-testid="loader" className={className} />
  ),
}))

vi.mock('../components/AuthLayout', () => ({
  AuthLayout: ({
    children,
    title,
    description,
  }: React.PropsWithChildren<{ title: string; description?: string }>) => (
    <div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {children}
    </div>
  ),
}))

mockParaglideMessages()

// Import to trigger createFileRoute and capture the component
import './verify-email'

describe('VerifyEmailPage', () => {
  it('should render error alert when token is missing', () => {
    // Arrange
    useSearchFn.mockReturnValue({ token: undefined })
    const VerifyEmailPage = captured.Component

    // Act
    render(<VerifyEmailPage />)

    // Assert
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('auth_missing_token')).toBeInTheDocument()
  })

  it('should render loading state when token is present', () => {
    // Arrange
    useSearchFn.mockReturnValue({ token: 'abc123' })
    const VerifyEmailPage = captured.Component

    // Act
    render(<VerifyEmailPage />)

    // Assert
    expect(screen.getByTestId('loader')).toBeInTheDocument()
    expect(screen.getByText('auth_verifying_email')).toBeInTheDocument()
  })

  it('should render resend verification button when session exists in error state', () => {
    // Arrange
    useSearchFn.mockReturnValue({ token: undefined })
    useSessionFn.mockReturnValue({ data: { user: { email: 'user@example.com' } } })
    const VerifyEmailPage = captured.Component

    // Act
    render(<VerifyEmailPage />)

    // Assert
    expect(screen.getByRole('button', { name: 'auth_resend_verification' })).toBeInTheDocument()
  })

  it('should render back to sign in link when token is missing', () => {
    // Arrange
    useSearchFn.mockReturnValue({ token: undefined })
    const VerifyEmailPage = captured.Component

    // Act
    render(<VerifyEmailPage />)

    // Assert
    const link = screen.getByRole('link', { name: /auth_back_to_sign_in/ })
    expect(link).toHaveAttribute('href', '/login')
  })

  it('should render email input and submit button when no session exists', () => {
    // Arrange
    useSearchFn.mockReturnValue({ token: undefined })
    useSessionFn.mockReturnValue({ data: null })
    const VerifyEmailPage = captured.Component

    // Act
    render(<VerifyEmailPage />)

    // Assert
    expect(screen.getByLabelText('auth_verify_email_enter_email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'auth_resend_verification' })).toBeInTheDocument()
  })

  it('should call sendVerificationEmail when sessionless form is submitted', async () => {
    // Arrange
    useSearchFn.mockReturnValue({ token: undefined })
    useSessionFn.mockReturnValue({ data: null })
    vi.mocked(authClient.sendVerificationEmail).mockResolvedValueOnce({} as never)
    const VerifyEmailPage = captured.Component
    render(<VerifyEmailPage />)

    // Act
    fireEvent.change(screen.getByLabelText('auth_verify_email_enter_email'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'auth_resend_verification' }))

    // Assert
    await waitFor(() => {
      expect(authClient.sendVerificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com' })
      )
    })
  })

  it('should show neutral message after sessionless form submission', async () => {
    // Arrange
    useSearchFn.mockReturnValue({ token: undefined })
    useSessionFn.mockReturnValue({ data: null })
    vi.mocked(authClient.sendVerificationEmail).mockResolvedValueOnce({} as never)
    const VerifyEmailPage = captured.Component
    render(<VerifyEmailPage />)

    // Act
    fireEvent.change(screen.getByLabelText('auth_verify_email_enter_email'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'auth_resend_verification' }))

    // Assert -- neutral message appears (no account existence leak)
    await waitFor(() => {
      expect(screen.getByText('auth_verify_email_resend_neutral')).toBeInTheDocument()
    })
  })

  it('should activate cooldown timer after sessionless form submission', async () => {
    // Arrange
    useSearchFn.mockReturnValue({ token: undefined })
    useSessionFn.mockReturnValue({ data: null })
    vi.mocked(authClient.sendVerificationEmail).mockResolvedValueOnce({} as never)
    const VerifyEmailPage = captured.Component
    render(<VerifyEmailPage />)

    // Act
    fireEvent.change(screen.getByLabelText('auth_verify_email_enter_email'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'auth_resend_verification' }))

    // Assert -- button should show cooldown text
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /auth_resend_in/ })).toBeInTheDocument()
    })
  })

  it('should show neutral message even when sendVerificationEmail throws (security: no info leak)', async () => {
    // Arrange
    useSearchFn.mockReturnValue({ token: undefined })
    useSessionFn.mockReturnValue({ data: null })
    vi.mocked(authClient.sendVerificationEmail).mockRejectedValueOnce(new Error('Network error'))
    const VerifyEmailPage = captured.Component
    render(<VerifyEmailPage />)

    // Act
    fireEvent.change(screen.getByLabelText('auth_verify_email_enter_email'), {
      target: { value: 'nonexistent@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'auth_resend_verification' }))

    // Assert -- still shows neutral message, not an error (no info leak)
    await waitFor(() => {
      expect(screen.getByText('auth_verify_email_resend_neutral')).toBeInTheDocument()
    })
  })
})
