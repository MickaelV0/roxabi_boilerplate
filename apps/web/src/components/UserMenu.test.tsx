import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mockParaglideMessages } from '@/test/__mocks__/mock-messages'

const useSessionFn = vi.hoisted(() =>
  vi.fn(() => ({
    data: null as { user: { name: string; email: string; image?: string | null } } | null,
  }))
)

const navigateFn = vi.hoisted(() => vi.fn())

vi.mock('@repo/ui', () => ({
  Avatar: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-slot="avatar" className={className}>
      {children}
    </div>
  ),
  AvatarImage: ({ alt }: { src?: string; alt?: string }) => <img alt={alt} />,
  AvatarFallback: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <span data-slot="avatar-fallback" className={className}>
      {children}
    </span>
  ),
  DropdownMenu: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
    disabled,
  }: React.PropsWithChildren<{ onClick?: () => void; disabled?: boolean }>) => (
    <button type="button" role="menuitem" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  DropdownMenuLabel: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children, asChild }: React.PropsWithChildren<{ asChild?: boolean }>) =>
    asChild ? children : <button type="button">{children}</button>,
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    ...props
  }: React.PropsWithChildren<{ to: string; className?: string }>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => navigateFn,
}))

vi.mock('@/lib/auth-client', () => ({
  useSession: useSessionFn,
  authClient: {
    useActiveOrganization: vi.fn(() => ({ data: null })),
    signOut: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('lucide-react', () => ({
  LogOut: ({ className }: { className?: string }) => <span className={className} />,
  Settings: ({ className }: { className?: string }) => <span className={className} />,
  Users: ({ className }: { className?: string }) => <span className={className} />,
}))

mockParaglideMessages()

import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { UserMenu } from './UserMenu'

describe('UserMenu', () => {
  it('should render nothing when no session', () => {
    // Arrange
    useSessionFn.mockReturnValue({ data: null })

    // Act
    const { container } = render(<UserMenu />)

    // Assert
    expect(container.innerHTML).toBe('')
  })

  it('should render user initials when session exists', () => {
    // Arrange
    useSessionFn.mockReturnValue({
      data: { user: { name: 'John Doe', email: 'john@example.com', image: null } },
    })

    // Act
    render(<UserMenu />)

    // Assert
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('should render first letter of email when no name', () => {
    // Arrange
    useSessionFn.mockReturnValue({
      data: { user: { name: '', email: 'alice@example.com', image: null } },
    })

    // Act
    render(<UserMenu />)

    // Assert
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('should show sign out button', () => {
    // Arrange
    useSessionFn.mockReturnValue({
      data: { user: { name: 'Jane', email: 'jane@example.com', image: null } },
    })

    // Act
    render(<UserMenu />)

    // Assert
    expect(screen.getByText('user_menu_sign_out')).toBeInTheDocument()
  })

  it('should show org links when active org exists', () => {
    // Arrange
    useSessionFn.mockReturnValue({
      data: { user: { name: 'Jane', email: 'jane@example.com', image: null } },
    })
    vi.mocked(authClient.useActiveOrganization).mockReturnValue({
      data: { id: 'org-1', name: 'Acme' },
    } as ReturnType<typeof authClient.useActiveOrganization>)

    // Act
    render(<UserMenu />)

    // Assert
    expect(screen.getByText('user_menu_org_settings')).toBeInTheDocument()
    expect(screen.getByText('user_menu_org_members')).toBeInTheDocument()
  })

  it('should display user email', () => {
    // Arrange
    useSessionFn.mockReturnValue({
      data: { user: { name: 'Jane', email: 'jane@example.com', image: null } },
    })

    // Act
    render(<UserMenu />)

    // Assert
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
  })

  it('should call signOut and navigate to /login on sign out click', async () => {
    // Arrange
    useSessionFn.mockReturnValue({
      data: { user: { name: 'Jane', email: 'jane@example.com', image: null } },
    })
    vi.mocked(authClient.signOut).mockResolvedValue({} as never)
    render(<UserMenu />)

    // Act
    const signOutButton = screen.getByRole('menuitem', { name: /user_menu_sign_out/ })
    fireEvent.click(signOutButton)

    // Assert
    await waitFor(() => {
      expect(authClient.signOut).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(navigateFn).toHaveBeenCalledWith({ to: '/login' })
    })
  })

  it('should show error toast when sign out fails', async () => {
    // Arrange
    useSessionFn.mockReturnValue({
      data: { user: { name: 'Jane', email: 'jane@example.com', image: null } },
    })
    vi.mocked(authClient.signOut).mockRejectedValue(new Error('network error'))
    render(<UserMenu />)

    // Act
    const signOutButton = screen.getByRole('menuitem', { name: /user_menu_sign_out/ })
    fireEvent.click(signOutButton)

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('auth_toast_error')
    })
  })
})
