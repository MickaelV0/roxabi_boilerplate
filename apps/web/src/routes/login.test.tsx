import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { authClient } from '@/lib/auth-client'
import { mockParaglideMessages } from '@/test/mock-messages'

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
  useNavigate: () => vi.fn(),
}))

vi.mock('@repo/ui', () => ({
  Button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button {...props}>{children}</button>
  ),
  Checkbox: ({
    id,
    ...props
  }: {
    id?: string
    checked?: boolean
    onCheckedChange?: (v: boolean) => void
  }) => <input type="checkbox" id={id} {...props} />,
  Input: (props: Record<string, unknown>) => <input {...props} />,
  PasswordInput: (props: Record<string, unknown>) => <input {...props} />,
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
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: {
      email: vi.fn(),
      magicLink: vi.fn(),
      social: vi.fn(),
    },
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
import './login'

describe('LoginPage', () => {
  it('should render email and password inputs', () => {
    const LoginPage = captured.Component
    render(<LoginPage />)

    expect(screen.getByLabelText('auth_email')).toBeInTheDocument()
    expect(screen.getByLabelText('auth_password')).toBeInTheDocument()
  })

  it('should render sign in button', () => {
    const LoginPage = captured.Component
    render(<LoginPage />)

    expect(screen.getByRole('button', { name: 'auth_sign_in_button' })).toBeInTheDocument()
  })

  it('should render OAuth buttons for Google and GitHub', () => {
    const LoginPage = captured.Component
    render(<LoginPage />)

    expect(screen.getByText('auth_sign_in_with_google')).toBeInTheDocument()
    expect(screen.getByText('auth_sign_in_with_github')).toBeInTheDocument()
  })

  it('should render magic link section', () => {
    const LoginPage = captured.Component
    render(<LoginPage />)

    expect(screen.getByLabelText('auth_magic_link')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'auth_send_magic_link' })).toBeInTheDocument()
  })

  it('should render forgot password link', () => {
    const LoginPage = captured.Component
    render(<LoginPage />)

    const link = screen.getByText('auth_forgot_password')
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', '/reset-password')
  })

  it('should render register link', () => {
    const LoginPage = captured.Component
    render(<LoginPage />)

    const link = screen.getByText('auth_register_link')
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', '/register')
  })

  it('should display error message when signIn.email returns an error', async () => {
    // Arrange
    vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
      error: { message: 'Invalid credentials' },
      data: null,
    } as never)

    const LoginPage = captured.Component
    render(<LoginPage />)

    // Act
    fireEvent.change(screen.getByLabelText('auth_email'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByLabelText('auth_password'), {
      target: { value: 'wrongpassword' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'auth_sign_in_button' }))

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials')
    })
  })
})
