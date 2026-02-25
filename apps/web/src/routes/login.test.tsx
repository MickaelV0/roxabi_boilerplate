import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { toast } from 'sonner'
import { describe, expect, it, vi } from 'vitest'
import { authClient } from '@/lib/authClient'
import { mockParaglideMessages } from '@/test/__mocks__/mockMessages'

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
      useSearch: () => ({}),
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

vi.mock('@repo/ui', async () => await import('@/test/__mocks__/repoUi'))

vi.mock('@/lib/authClient', () => ({
  authClient: {
    signIn: {
      email: vi.fn(),
      magicLink: vi.fn(),
      social: vi.fn(),
    },
    sendVerificationEmail: vi.fn(),
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

mockParaglideMessages()

// Import to trigger createFileRoute and capture the component
import './login'

function createDefaultLoaderData() {
  return { google: true, github: true }
}

describe('LoginPage', () => {
  it('should render email and password inputs when component mounts', () => {
    // Arrange
    captured.loaderData = createDefaultLoaderData()
    const LoginPage = captured.Component

    // Act
    render(<LoginPage />)

    // Assert
    const panels = screen.getAllByRole('tabpanel')
    const passwordPanel = panels[0] as HTMLElement
    expect(within(passwordPanel).getByLabelText('auth_email')).toBeInTheDocument()
    expect(within(passwordPanel).getByLabelText('auth_password')).toBeInTheDocument()
  })

  it('should render sign in button when component mounts', () => {
    // Arrange
    captured.loaderData = createDefaultLoaderData()
    const LoginPage = captured.Component

    // Act
    render(<LoginPage />)

    // Assert
    expect(screen.getByRole('button', { name: 'auth_sign_in_button' })).toBeInTheDocument()
  })

  it('should render OAuth buttons when Google and GitHub are enabled', () => {
    // Arrange
    captured.loaderData = createDefaultLoaderData()
    const LoginPage = captured.Component

    // Act
    render(<LoginPage />)

    // Assert
    expect(screen.getByText('auth_sign_in_with_google')).toBeInTheDocument()
    expect(screen.getByText('auth_sign_in_with_github')).toBeInTheDocument()
  })

  it('should render tab triggers for Password and Magic Link when component mounts', () => {
    // Arrange
    captured.loaderData = createDefaultLoaderData()
    const LoginPage = captured.Component

    // Act
    render(<LoginPage />)

    // Assert
    expect(screen.getByRole('tab', { name: 'auth_tab_password' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'auth_tab_magic_link' })).toBeInTheDocument()
  })

  it('should render magic link form in tab when component mounts', () => {
    // Arrange
    captured.loaderData = createDefaultLoaderData()
    const LoginPage = captured.Component

    // Act
    render(<LoginPage />)

    // Assert
    const panels = screen.getAllByRole('tabpanel')
    const magicLinkPanel = panels[1] as HTMLElement
    expect(within(magicLinkPanel).getByLabelText('auth_email')).toBeInTheDocument()
    expect(
      within(magicLinkPanel).getByRole('button', { name: 'auth_send_magic_link' })
    ).toBeInTheDocument()
  })

  it('should render forgot password link when component mounts', () => {
    // Arrange
    captured.loaderData = createDefaultLoaderData()
    const LoginPage = captured.Component

    // Act
    render(<LoginPage />)

    // Assert
    const link = screen.getByRole('link', { name: /auth_forgot_password/ })
    expect(link).toHaveAttribute('href', '/reset-password')
  })

  it('should render register link when component mounts', () => {
    // Arrange
    captured.loaderData = createDefaultLoaderData()
    const LoginPage = captured.Component

    // Act
    render(<LoginPage />)

    // Assert
    const link = screen.getByRole('link', { name: /auth_register_link/ })
    expect(link).toHaveAttribute('href', '/register')
  })

  it('should hide OAuth buttons when providers are not configured', () => {
    // Arrange
    captured.loaderData = { google: false, github: false }
    const LoginPage = captured.Component

    // Act
    render(<LoginPage />)

    // Assert
    expect(screen.queryByText('auth_sign_in_with_google')).not.toBeInTheDocument()
    expect(screen.queryByText('auth_sign_in_with_github')).not.toBeInTheDocument()
  })

  it('should display generic error message when signIn.email returns an error (security guardrail)', async () => {
    // Arrange
    captured.loaderData = createDefaultLoaderData()
    vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
      error: { message: 'Invalid credentials' },
      data: null,
    } as never)

    const LoginPage = captured.Component
    render(<LoginPage />)

    // Act -- target the password tab's email input via Testing Library
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

    // Assert -- always "Invalid email or password", never the backend message
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('auth_login_invalid_credentials')
    })
  })

  it('should display email not verified message on 403 error', async () => {
    // Arrange
    captured.loaderData = createDefaultLoaderData()
    vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
      error: { message: 'Email not verified', status: 403 },
      data: null,
    } as never)

    const LoginPage = captured.Component
    render(<LoginPage />)

    // Act
    const panels = screen.getAllByRole('tabpanel')
    const passwordPanel = panels[0] as HTMLElement
    const emailInput = within(passwordPanel).getByLabelText('auth_email')
    fireEvent.change(emailInput, {
      target: { value: 'unverified@example.com' },
    })
    fireEvent.change(screen.getByLabelText('auth_password'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'auth_sign_in_button' }))

    // Assert -- should show the email not verified message, not generic credentials error
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('auth_login_email_not_verified')
    })
  })

  it('should call sendVerificationEmail with correct email when resend button is clicked after 403', async () => {
    // Arrange
    captured.loaderData = createDefaultLoaderData()
    vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
      error: { message: 'Email not verified', status: 403 },
      data: null,
    } as never)
    vi.mocked(authClient.sendVerificationEmail).mockResolvedValueOnce({} as never)

    const LoginPage = captured.Component
    render(<LoginPage />)

    const panels = screen.getAllByRole('tabpanel')
    const passwordPanel = panels[0] as HTMLElement
    fireEvent.change(within(passwordPanel).getByLabelText('auth_email'), {
      target: { value: 'unverified@example.com' },
    })
    fireEvent.change(screen.getByLabelText('auth_password'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'auth_sign_in_button' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    // Act -- click resend button
    fireEvent.click(screen.getByRole('button', { name: 'auth_resend_verification' }))

    // Assert
    await waitFor(() => {
      expect(authClient.sendVerificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'unverified@example.com' })
      )
    })
  })

  it('should show toast.success after successful resend of verification email', async () => {
    // Arrange
    captured.loaderData = createDefaultLoaderData()
    vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
      error: { message: 'Email not verified', status: 403 },
      data: null,
    } as never)
    vi.mocked(authClient.sendVerificationEmail).mockResolvedValueOnce({} as never)

    const LoginPage = captured.Component
    render(<LoginPage />)

    const panels = screen.getAllByRole('tabpanel')
    const passwordPanel = panels[0] as HTMLElement
    fireEvent.change(within(passwordPanel).getByLabelText('auth_email'), {
      target: { value: 'unverified@example.com' },
    })
    fireEvent.change(screen.getByLabelText('auth_password'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'auth_sign_in_button' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'auth_resend_verification' }))

    // Assert
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('auth_toast_verification_resent')
    })
  })

  it('should show cooldown text on resend button after successful resend', async () => {
    // Arrange
    captured.loaderData = createDefaultLoaderData()
    vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
      error: { message: 'Email not verified', status: 403 },
      data: null,
    } as never)
    vi.mocked(authClient.sendVerificationEmail).mockResolvedValueOnce({} as never)

    const LoginPage = captured.Component
    render(<LoginPage />)

    const panels = screen.getAllByRole('tabpanel')
    const passwordPanel = panels[0] as HTMLElement
    fireEvent.change(within(passwordPanel).getByLabelText('auth_email'), {
      target: { value: 'unverified@example.com' },
    })
    fireEvent.change(screen.getByLabelText('auth_password'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'auth_sign_in_button' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'auth_resend_verification' }))

    // Assert -- button should show cooldown text
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /auth_resend_in/ })).toBeInTheDocument()
    })
  })

  it('should show toast.error when resend verification email fails', async () => {
    // Arrange
    captured.loaderData = createDefaultLoaderData()
    vi.mocked(authClient.signIn.email).mockResolvedValueOnce({
      error: { message: 'Email not verified', status: 403 },
      data: null,
    } as never)
    vi.mocked(authClient.sendVerificationEmail).mockRejectedValueOnce(new Error('Network error'))

    const LoginPage = captured.Component
    render(<LoginPage />)

    const panels = screen.getAllByRole('tabpanel')
    const passwordPanel = panels[0] as HTMLElement
    fireEvent.change(within(passwordPanel).getByLabelText('auth_email'), {
      target: { value: 'unverified@example.com' },
    })
    fireEvent.change(screen.getByLabelText('auth_password'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'auth_sign_in_button' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'auth_resend_verification' }))

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('auth_toast_error')
    })
  })
})
