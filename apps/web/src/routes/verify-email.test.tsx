import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

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
}))

vi.mock('@repo/ui', () => ({
  Button: ({
    children,
    asChild,
    ...props
  }: React.PropsWithChildren<{ asChild?: boolean; [key: string]: unknown }>) =>
    asChild ? children : <button {...props}>{children}</button>,
}))

vi.mock('@/lib/auth-client', () => ({
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

vi.mock('@/paraglide/messages', () => ({
  m: new Proxy(
    {},
    {
      get:
        (_target, prop) =>
        (...args: unknown[]) => {
          if (args.length > 0 && typeof args[0] === 'object') {
            return `${String(prop)}(${JSON.stringify(args[0])})`
          }
          return String(prop)
        },
    }
  ),
}))

// Import to trigger createFileRoute and capture the component
import './verify-email'

describe('VerifyEmailPage', () => {
  it('should render error state when token is missing', () => {
    useSearchFn.mockReturnValue({ token: undefined })
    const VerifyEmailPage = captured.Component
    render(<VerifyEmailPage />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('auth_missing_token')).toBeInTheDocument()
  })

  it('should render loading state when token is present', () => {
    useSearchFn.mockReturnValue({ token: 'abc123' })
    const VerifyEmailPage = captured.Component
    render(<VerifyEmailPage />)

    expect(screen.getByTestId('loader')).toBeInTheDocument()
    expect(screen.getByText('auth_verifying_email')).toBeInTheDocument()
  })

  it('should render resend verification button in error state', () => {
    useSearchFn.mockReturnValue({ token: undefined })
    const VerifyEmailPage = captured.Component
    render(<VerifyEmailPage />)

    expect(screen.getByRole('button', { name: 'auth_resend_verification' })).toBeInTheDocument()
  })

  it('should render back to sign in link in error state', () => {
    useSearchFn.mockReturnValue({ token: undefined })
    const VerifyEmailPage = captured.Component
    render(<VerifyEmailPage />)

    const link = screen.getByText('auth_back_to_sign_in')
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', '/login')
  })
})
