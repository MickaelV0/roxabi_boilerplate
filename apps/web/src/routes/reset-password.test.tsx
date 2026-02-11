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

vi.mock('@repo/ui', () => ({
  Button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button {...props}>{children}</button>
  ),
  Input: (props: Record<string, unknown>) => <input {...props} />,
  Label: ({
    children,
    htmlFor,
    ...props
  }: React.PropsWithChildren<{ htmlFor?: string; [key: string]: unknown }>) => (
    <label htmlFor={htmlFor} {...props}>
      {children}
    </label>
  ),
}))

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
  it('should render email input', () => {
    const ResetPasswordPage = captured.Component
    render(<ResetPasswordPage />)

    expect(screen.getByLabelText('auth_email')).toBeInTheDocument()
  })

  it('should render send reset link button', () => {
    const ResetPasswordPage = captured.Component
    render(<ResetPasswordPage />)

    expect(screen.getByRole('button', { name: 'auth_send_reset_link' })).toBeInTheDocument()
  })

  it('should render sign in link for users who remember their password', () => {
    const ResetPasswordPage = captured.Component
    render(<ResetPasswordPage />)

    const link = screen.getByText('auth_sign_in_link')
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', '/login')
  })

  it('should display error message when requestPasswordReset returns an error', async () => {
    // Arrange
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

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('User not found')
    })
  })
})
