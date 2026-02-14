import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
  useNavigate: () => vi.fn(),
}))

vi.mock('@repo/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
  Button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button {...props}>{children}</button>
  ),
  Checkbox: ({
    id,
    checked,
    ...props
  }: {
    id?: string
    checked?: boolean
    onCheckedChange?: (v: boolean) => void
  }) => <input type="checkbox" id={id} defaultChecked={checked} {...props} />,
  FormMessage: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div role="alert" aria-live="polite" {...props}>
      {children}
    </div>
  ),
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
  Tabs: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="tabs" {...props}>
      {children}
    </div>
  ),
  TabsList: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div role="tablist" {...props}>
      {children}
    </div>
  ),
  TabsTrigger: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button role="tab" {...props}>
      {children}
    </button>
  ),
  TabsContent: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div role="tabpanel" {...props}>
      {children}
    </div>
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
import './login'

describe('LoginPage', () => {
  beforeEach(() => {
    captured.loaderData = { google: true, github: true }
  })

  it('should render email and password inputs', () => {
    const LoginPage = captured.Component
    render(<LoginPage />)

    // Password tab email input and password input
    const panels = screen.getAllByRole('tabpanel')
    const passwordPanel = panels[0] as HTMLElement
    expect(within(passwordPanel).getByLabelText('auth_email')).toBeInTheDocument()
    expect(within(passwordPanel).getByLabelText('auth_password')).toBeInTheDocument()
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

  it('should render tab triggers for Password and Magic Link', () => {
    const LoginPage = captured.Component
    render(<LoginPage />)

    expect(screen.getByRole('tab', { name: 'auth_tab_password' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'auth_tab_magic_link' })).toBeInTheDocument()
  })

  it('should render magic link form in tab', () => {
    const LoginPage = captured.Component
    render(<LoginPage />)

    // The magic link tab has its own email input
    const panels = screen.getAllByRole('tabpanel')
    const magicLinkPanel = panels[1] as HTMLElement
    expect(within(magicLinkPanel).getByLabelText('auth_email')).toBeInTheDocument()
    expect(
      within(magicLinkPanel).getByRole('button', { name: 'auth_send_magic_link' })
    ).toBeInTheDocument()
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

  it('should hide OAuth buttons when providers are not configured', () => {
    captured.loaderData = { google: false, github: false }
    const LoginPage = captured.Component
    render(<LoginPage />)

    expect(screen.queryByText('auth_sign_in_with_google')).not.toBeInTheDocument()
    expect(screen.queryByText('auth_sign_in_with_github')).not.toBeInTheDocument()
  })

  it('should display generic error message when signIn.email returns an error (security guardrail)', async () => {
    // Arrange
    vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
      error: { message: 'Invalid credentials' },
      data: null,
    } as never)

    const LoginPage = captured.Component
    render(<LoginPage />)

    // Act — target the password tab's email input via Testing Library
    const panels = screen.getAllByRole('tabpanel')
    const passwordPanel = panels[0] as HTMLElement
    const emailInput = within(passwordPanel).getByLabelText('auth_email')
    fireEvent.change(emailInput, {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByLabelText('auth_password'), {
      target: { value: 'wrongpassword' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'auth_sign_in_button' }))

    // Assert — always "Invalid email or password", never the backend message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('auth_login_invalid_credentials')
    })
  })
})
