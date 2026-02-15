import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { authClient } from '@/lib/auth-client'
import { mockParaglideMessages } from '@/test/__mocks__/mock-messages'

const captured = vi.hoisted(() => ({
  Component: (() => null) as React.ComponentType,
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType }) => {
    captured.Component = config.component
    return { component: config.component }
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
  authClient: {
    requestPasswordReset: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
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
import './reset-password'

describe('ResetPasswordPage', () => {
  it('should render email input when component mounts', () => {
    // Arrange
    const ResetPasswordPage = captured.Component

    // Act
    render(<ResetPasswordPage />)

    // Assert
    expect(screen.getByLabelText('auth_email')).toBeInTheDocument()
  })

  it('should render send reset link button when component mounts', () => {
    // Arrange
    const ResetPasswordPage = captured.Component

    // Act
    render(<ResetPasswordPage />)

    // Assert
    expect(screen.getByRole('button', { name: 'auth_send_reset_link' })).toBeInTheDocument()
  })

  it('should render sign in link for users who remember their password', () => {
    // Arrange
    const ResetPasswordPage = captured.Component

    // Act
    render(<ResetPasswordPage />)

    // Assert
    const link = screen.getByText('auth_sign_in_link')
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', '/login')
  })

  it('should always show generic success message regardless of backend response (security guardrail)', async () => {
    // Arrange -- even when backend returns an error, the UI must show
    // the same generic message to avoid revealing whether an email exists.
    vi.mocked(authClient.requestPasswordReset).mockResolvedValueOnce({
      error: { message: 'User not found' },
      data: null,
    } as never)

    const ResetPasswordPage = captured.Component
    render(<ResetPasswordPage />)

    // Act
    fireEvent.change(screen.getByLabelText('auth_email'), {
      target: { value: 'unknown@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'auth_send_reset_link' }))

    // Assert -- generic message shown, NOT the backend error
    await waitFor(() => {
      expect(screen.getByText('auth_reset_password_sent')).toBeInTheDocument()
    })
  })

  it('should show cooldown timer after successful submission', async () => {
    // Arrange
    vi.mocked(authClient.requestPasswordReset).mockResolvedValueOnce({
      error: null,
      data: null,
    } as never)

    const ResetPasswordPage = captured.Component
    render(<ResetPasswordPage />)

    // Act
    fireEvent.change(screen.getByLabelText('auth_email'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'auth_send_reset_link' }))

    // Assert -- button should be disabled with cooldown text
    await waitFor(() => {
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveTextContent('auth_resend_reset_in')
    })
  })
})
