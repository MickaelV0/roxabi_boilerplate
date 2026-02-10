import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

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
})
