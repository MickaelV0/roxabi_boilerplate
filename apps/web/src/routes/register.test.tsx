import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authClient } from '@/lib/auth-client'
import { mockParaglideMessages } from '@/test/__mocks__/mock-messages'

const captured = vi.hoisted(() => ({
  Component: (() => null) as React.ComponentType,
  loaderData: { google: true, github: true } as { google: boolean; github: boolean },
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType }) => {
    captured.Component = config.component
    return {
      component: config.component,
      useLoaderData: () => captured.loaderData,
    }
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
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
  Button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button {...props}>{children}</button>
  ),
  Card: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  ),
  CardHeader: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <h2 {...props}>{children}</h2>
  ),
  FormMessage: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div role="alert" aria-live="polite" {...props}>
      {children}
    </div>
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
  OAuthButton: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button {...props}>{children}</button>
  ),
  PasswordInput: (props: Record<string, unknown>) => <input type="password" {...props} />,
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signUp: {
      email: vi.fn(),
    },
    signIn: {
      social: vi.fn(),
    },
  },
  fetchEnabledProviders: vi.fn(),
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
import './register'

describe('RegisterPage', () => {
  beforeEach(() => {
    captured.loaderData = { google: true, github: true }
  })

  it('should render name, email, and password inputs', () => {
    const RegisterPage = captured.Component
    render(<RegisterPage />)

    expect(screen.getByLabelText('auth_name')).toBeInTheDocument()
    expect(screen.getByLabelText('auth_email')).toBeInTheDocument()
    expect(screen.getByLabelText('auth_password')).toBeInTheDocument()
  })

  it('should render create account button', () => {
    const RegisterPage = captured.Component
    render(<RegisterPage />)

    expect(screen.getByRole('button', { name: 'auth_create_account_button' })).toBeInTheDocument()
  })

  it('should render OAuth buttons for Google and GitHub', () => {
    const RegisterPage = captured.Component
    render(<RegisterPage />)

    expect(screen.getByText('auth_sign_up_with_google')).toBeInTheDocument()
    expect(screen.getByText('auth_sign_up_with_github')).toBeInTheDocument()
  })

  it('should render sign in link for existing accounts', () => {
    const RegisterPage = captured.Component
    render(<RegisterPage />)

    const link = screen.getByText('auth_sign_in_link')
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', '/login')
  })

  it('should hide OAuth buttons when providers are not configured', () => {
    captured.loaderData = { google: false, github: false }
    const RegisterPage = captured.Component
    render(<RegisterPage />)

    expect(screen.queryByText('auth_sign_up_with_google')).not.toBeInTheDocument()
    expect(screen.queryByText('auth_sign_up_with_github')).not.toBeInTheDocument()
  })

  it('should display generic error message when signUp.email returns an error (security guardrail)', async () => {
    // Arrange
    vi.mocked(authClient.signUp.email).mockResolvedValueOnce({
      error: { message: 'Email already exists' },
      data: null,
    } as never)

    const RegisterPage = captured.Component
    render(<RegisterPage />)

    // Act
    fireEvent.change(screen.getByLabelText('auth_name'), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByLabelText('auth_email'), {
      target: { value: 'existing@example.com' },
    })
    fireEvent.change(screen.getByLabelText('auth_password'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'auth_create_account_button' }))

    // Assert — generic error, NOT the backend message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('auth_register_unable')
    })
  })

  it('should show success card and hide form after successful registration', async () => {
    // Arrange
    vi.mocked(authClient.signUp.email).mockResolvedValueOnce({
      error: null,
      data: { user: { id: '1' } },
    } as never)

    const RegisterPage = captured.Component
    render(<RegisterPage />)

    // Act
    fireEvent.change(screen.getByLabelText('auth_name'), {
      target: { value: 'New User' },
    })
    fireEvent.change(screen.getByLabelText('auth_email'), {
      target: { value: 'new@example.com' },
    })
    fireEvent.change(screen.getByLabelText('auth_password'), {
      target: { value: 'StrongP@ss1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'auth_create_account_button' }))

    // Assert — form hidden, success card shown
    await waitFor(() => {
      expect(screen.getByText('auth_register_success_title')).toBeInTheDocument()
      expect(screen.getByText('auth_check_email_verify')).toBeInTheDocument()
    })
    expect(screen.queryByLabelText('auth_name')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('auth_password')).not.toBeInTheDocument()
  })
})
