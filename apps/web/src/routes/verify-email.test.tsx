import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
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
    const link = screen.getByText('auth_back_to_sign_in')
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', '/login')
  })
})
