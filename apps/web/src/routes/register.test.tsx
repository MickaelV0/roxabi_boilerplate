import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
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

vi.mock('@repo/ui', async () => await import('@/test/__mocks__/repo-ui'))

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

vi.mock('../components/OrDivider', () => ({
  OrDivider: () => <hr />,
}))

vi.mock('lucide-react', () => ({
  CheckCircle: () => <span data-testid="check-circle-icon" />,
}))

mockParaglideMessages()

// Import to trigger createFileRoute and capture the component
import './register'

function createDefaultLoaderData() {
  return { google: true, github: true }
}

describe('RegisterPage', () => {
  it('should render name, email, and password inputs when component mounts', () => {
    // Arrange
    captured.loaderData = createDefaultLoaderData()
    const RegisterPage = captured.Component

    // Act
    render(<RegisterPage />)

    // Assert
    expect(screen.getByLabelText('auth_name')).toBeInTheDocument()
    expect(screen.getByLabelText('auth_email')).toBeInTheDocument()
    expect(screen.getByLabelText('auth_password')).toBeInTheDocument()
  })

  it('should render create account button when component mounts', () => {
    // Arrange
    captured.loaderData = createDefaultLoaderData()
    const RegisterPage = captured.Component

    // Act
    render(<RegisterPage />)

    // Assert
    expect(screen.getByRole('button', { name: 'auth_create_account_button' })).toBeInTheDocument()
  })

  it('should render OAuth buttons when Google and GitHub are enabled', () => {
    // Arrange
    captured.loaderData = createDefaultLoaderData()
    const RegisterPage = captured.Component

    // Act
    render(<RegisterPage />)

    // Assert
    expect(screen.getByText('auth_sign_up_with_google')).toBeInTheDocument()
    expect(screen.getByText('auth_sign_up_with_github')).toBeInTheDocument()
  })

  it('should render sign in link for existing accounts when component mounts', () => {
    // Arrange
    captured.loaderData = createDefaultLoaderData()
    const RegisterPage = captured.Component

    // Act
    render(<RegisterPage />)

    // Assert
    const link = screen.getByText('auth_sign_in_link')
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', '/login')
  })

  it('should hide OAuth buttons when providers are not configured', () => {
    // Arrange
    captured.loaderData = { google: false, github: false }
    const RegisterPage = captured.Component

    // Act
    render(<RegisterPage />)

    // Assert
    expect(screen.queryByText('auth_sign_up_with_google')).not.toBeInTheDocument()
    expect(screen.queryByText('auth_sign_up_with_github')).not.toBeInTheDocument()
  })

  it('should display generic error message when signUp.email returns an error (security guardrail)', async () => {
    // Arrange
    captured.loaderData = createDefaultLoaderData()
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

    // Assert -- generic error, NOT the backend message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('auth_register_unable')
    })
  })

  it('should show success card and hide form after successful registration', async () => {
    // Arrange
    captured.loaderData = createDefaultLoaderData()
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

    // Assert -- form hidden, success card shown
    await waitFor(() => {
      expect(screen.getByText('auth_register_success_title')).toBeInTheDocument()
      expect(screen.getByText('auth_check_email_verify')).toBeInTheDocument()
    })
    expect(screen.queryByLabelText('auth_name')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('auth_password')).not.toBeInTheDocument()
  })
})
