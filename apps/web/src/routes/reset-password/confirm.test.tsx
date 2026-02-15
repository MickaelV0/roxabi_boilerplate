import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { authClient } from '@/lib/auth-client'
import { mockParaglideMessages } from '@/test/__mocks__/mock-messages'

const { captured, useSearchFn } = vi.hoisted(() => ({
  captured: { Component: (() => null) as React.ComponentType },
  useSearchFn: vi.fn(() => ({ token: undefined as string | undefined })),
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
  useNavigate: () => vi.fn(),
}))

vi.mock('@repo/ui', async () => await import('@/test/__mocks__/repo-ui'))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    resetPassword: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('../../components/AuthLayout', () => ({
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
import './confirm'

describe('ResetPasswordConfirmPage', () => {
  it('should render missing token error when no token in search params', () => {
    // Arrange
    useSearchFn.mockReturnValue({ token: undefined })
    const ResetPasswordConfirmPage = captured.Component

    // Act
    render(<ResetPasswordConfirmPage />)

    // Assert
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('auth_missing_token')).toBeInTheDocument()
  })

  it('should show "request new reset" link when token is missing', () => {
    // Arrange
    useSearchFn.mockReturnValue({ token: undefined })
    const ResetPasswordConfirmPage = captured.Component

    // Act
    render(<ResetPasswordConfirmPage />)

    // Assert
    const link = screen.getByRole('link', { name: /auth_request_new_reset/ })
    expect(link).toHaveAttribute('href', '/reset-password')
  })

  it('should render password input when token is present', () => {
    // Arrange
    useSearchFn.mockReturnValue({ token: 'valid-token-123' })
    const ResetPasswordConfirmPage = captured.Component

    // Act
    render(<ResetPasswordConfirmPage />)

    // Assert
    expect(screen.getByLabelText('auth_new_password')).toBeInTheDocument()
  })

  it('should render reset password button when token is present', () => {
    // Arrange
    useSearchFn.mockReturnValue({ token: 'valid-token-123' })
    const ResetPasswordConfirmPage = captured.Component

    // Act
    render(<ResetPasswordConfirmPage />)

    // Assert
    expect(screen.getByRole('button', { name: 'auth_reset_password_button' })).toBeInTheDocument()
  })

  it('should show back to sign in link when token is present', () => {
    // Arrange
    useSearchFn.mockReturnValue({ token: 'valid-token-123' })
    const ResetPasswordConfirmPage = captured.Component

    // Act
    render(<ResetPasswordConfirmPage />)

    // Assert
    const link = screen.getByRole('link', { name: /auth_back_to_sign_in/ })
    expect(link).toHaveAttribute('href', '/login')
  })

  it('should display error when resetPassword returns an error', async () => {
    // Arrange
    vi.mocked(authClient.resetPassword).mockResolvedValueOnce({
      error: { message: 'Token expired' },
      data: null,
    } as never)

    useSearchFn.mockReturnValue({ token: 'expired-token' })
    const ResetPasswordConfirmPage = captured.Component
    render(<ResetPasswordConfirmPage />)

    // Act
    fireEvent.change(screen.getByLabelText('auth_new_password'), {
      target: { value: 'NewPassword123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'auth_reset_password_button' }))

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Token expired')
    })
  })

  it('should show "request new reset" link alongside error message', async () => {
    // Arrange
    vi.mocked(authClient.resetPassword).mockResolvedValueOnce({
      error: { message: 'Invalid token' },
      data: null,
    } as never)

    useSearchFn.mockReturnValue({ token: 'bad-token' })
    const ResetPasswordConfirmPage = captured.Component
    render(<ResetPasswordConfirmPage />)

    // Act
    fireEvent.change(screen.getByLabelText('auth_new_password'), {
      target: { value: 'NewPassword123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'auth_reset_password_button' }))

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
    const link = screen.getByRole('link', { name: /auth_request_new_reset/ })
    expect(link).toHaveAttribute('href', '/reset-password')
  })
})
