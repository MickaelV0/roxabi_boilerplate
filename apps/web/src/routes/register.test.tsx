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

  it('should display error message when signUp.email returns an error', async () => {
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

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Email already exists')
    })
  })
})
