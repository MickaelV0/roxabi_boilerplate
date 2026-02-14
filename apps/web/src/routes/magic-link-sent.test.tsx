import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mockParaglideMessages } from '@/test/__mocks__/mock-messages'

const { captured, useSearchFn } = vi.hoisted(() => ({
  captured: { Component: (() => null) as React.ComponentType },
  useSearchFn: vi.fn(() => ({ email: undefined as string | undefined })),
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
  Button: ({ children, ...props }: React.PropsWithChildren<{ [key: string]: unknown }>) => (
    <button {...props}>{children}</button>
  ),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: {
      magicLink: vi.fn(),
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

import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
// Import to trigger createFileRoute and capture the component
import { detectEmailProvider } from './magic-link-sent'

describe('MagicLinkSentPage', () => {
  it('should render title and description', () => {
    // Arrange
    useSearchFn.mockReturnValue({ email: undefined })
    const MagicLinkSentPage = captured.Component

    // Act
    render(<MagicLinkSentPage />)

    // Assert
    expect(screen.getByText('auth_magic_link_sent_title')).toBeInTheDocument()
    expect(screen.getByText('auth_magic_link_sent_desc')).toBeInTheDocument()
  })

  it('should show email-specific message when email is provided', () => {
    // Arrange
    useSearchFn.mockReturnValue({ email: 'user@example.com' })
    const MagicLinkSentPage = captured.Component

    // Act
    render(<MagicLinkSentPage />)

    // Assert
    expect(
      screen.getByText('auth_magic_link_sent_message({"email":"user@example.com"})')
    ).toBeInTheDocument()
  })

  it('should show generic message when no email is provided', () => {
    // Arrange
    useSearchFn.mockReturnValue({ email: undefined })
    const MagicLinkSentPage = captured.Component

    // Act
    render(<MagicLinkSentPage />)

    // Assert
    expect(screen.getByText('auth_check_email_magic_link')).toBeInTheDocument()
  })

  it('should show resend button when email is present', () => {
    // Arrange
    useSearchFn.mockReturnValue({ email: 'user@example.com' })
    const MagicLinkSentPage = captured.Component

    // Act
    render(<MagicLinkSentPage />)

    // Assert
    expect(screen.getByRole('button', { name: 'auth_resend_magic_link' })).toBeInTheDocument()
    expect(screen.getByText('auth_didnt_receive')).toBeInTheDocument()
  })

  it('should not show resend button when no email is present', () => {
    // Arrange
    useSearchFn.mockReturnValue({ email: undefined })
    const MagicLinkSentPage = captured.Component

    // Act
    render(<MagicLinkSentPage />)

    // Assert
    expect(screen.queryByRole('button', { name: 'auth_resend_magic_link' })).not.toBeInTheDocument()
  })

  it('should render back to sign in link', () => {
    // Arrange
    useSearchFn.mockReturnValue({ email: undefined })
    const MagicLinkSentPage = captured.Component

    // Act
    render(<MagicLinkSentPage />)

    // Assert
    const link = screen.getByText('auth_back_to_sign_in')
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', '/login')
  })

  it('should call authClient.signIn.magicLink on resend click', async () => {
    // Arrange
    vi.mocked(authClient.signIn.magicLink).mockResolvedValueOnce({
      error: null,
      data: null,
    } as never)
    useSearchFn.mockReturnValue({ email: 'user@example.com' })
    const MagicLinkSentPage = captured.Component

    // Act
    render(<MagicLinkSentPage />)
    fireEvent.click(screen.getByRole('button', { name: 'auth_resend_magic_link' }))

    // Assert
    await waitFor(() => {
      expect(authClient.signIn.magicLink).toHaveBeenCalledWith({ email: 'user@example.com' })
    })
    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith('auth_toast_magic_link_resent')
    })
  })

  it('should show error toast when resend returns an error', async () => {
    // Arrange
    vi.mocked(authClient.signIn.magicLink).mockResolvedValueOnce({
      error: { message: 'Rate limited' },
      data: null,
    } as never)
    useSearchFn.mockReturnValue({ email: 'user@example.com' })
    const MagicLinkSentPage = captured.Component

    // Act
    render(<MagicLinkSentPage />)
    fireEvent.click(screen.getByRole('button', { name: 'auth_resend_magic_link' }))

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Rate limited')
    })
  })

  it('should show error toast when resend throws an exception', async () => {
    // Arrange
    vi.mocked(authClient.signIn.magicLink).mockRejectedValueOnce(new Error('Network error'))
    useSearchFn.mockReturnValue({ email: 'user@example.com' })
    const MagicLinkSentPage = captured.Component

    // Act
    render(<MagicLinkSentPage />)
    fireEvent.click(screen.getByRole('button', { name: 'auth_resend_magic_link' }))

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('auth_toast_error')
    })
  })
})

describe('detectEmailProvider', () => {
  it('should detect Gmail', () => {
    const result = detectEmailProvider('user@gmail.com')
    expect(result).toEqual({ name: 'Gmail', url: 'https://mail.google.com' })
  })

  it('should detect Outlook from outlook.com', () => {
    const result = detectEmailProvider('user@outlook.com')
    expect(result).toEqual({ name: 'Outlook', url: 'https://outlook.live.com/mail' })
  })

  it('should detect Outlook from hotmail.com', () => {
    const result = detectEmailProvider('user@hotmail.com')
    expect(result).toEqual({ name: 'Outlook', url: 'https://outlook.live.com/mail' })
  })

  it('should detect Yahoo Mail', () => {
    const result = detectEmailProvider('user@yahoo.com')
    expect(result).toEqual({ name: 'Yahoo Mail', url: 'https://mail.yahoo.com' })
  })

  it('should detect iCloud Mail', () => {
    const result = detectEmailProvider('user@icloud.com')
    expect(result).toEqual({ name: 'iCloud Mail', url: 'https://www.icloud.com/mail' })
  })

  it('should detect ProtonMail from protonmail.com', () => {
    const result = detectEmailProvider('user@protonmail.com')
    expect(result).toEqual({ name: 'ProtonMail', url: 'https://mail.proton.me' })
  })

  it('should detect ProtonMail from proton.me', () => {
    const result = detectEmailProvider('user@proton.me')
    expect(result).toEqual({ name: 'ProtonMail', url: 'https://mail.proton.me' })
  })

  it('should return null for unknown domain', () => {
    expect(detectEmailProvider('user@custom-domain.org')).toBeNull()
  })

  it('should return null for email without @', () => {
    expect(detectEmailProvider('no-at-sign')).toBeNull()
  })

  it('should return null for empty string', () => {
    expect(detectEmailProvider('')).toBeNull()
  })

  it('should be case-insensitive for domain', () => {
    const result = detectEmailProvider('user@GMAIL.COM')
    expect(result).toEqual({ name: 'Gmail', url: 'https://mail.google.com' })
  })
})
