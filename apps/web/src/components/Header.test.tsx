import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mockParaglideMessages } from '@/test/__mocks__/mock-messages'

vi.mock('@repo/ui', () => ({
  Button: ({
    children,
    asChild,
    onClick,
    disabled,
    ...props
  }: React.PropsWithChildren<{
    asChild?: boolean
    onClick?: () => void
    disabled?: boolean
    [key: string]: unknown
  }>) =>
    asChild ? (
      children
    ) : (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={props['aria-label'] as string}
        className={props.className as string}
      >
        {children}
      </button>
    ),
  DropdownMenu: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: React.PropsWithChildren<{ asChild?: boolean }>) =>
    asChild ? children : <div>{children}</div>,
  DropdownMenuContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

mockParaglideMessages()

vi.mock('@/lib/auth-client', () => ({
  useSession: () => ({ data: null }),
  authClient: {
    useActiveOrganization: () => ({ data: null }),
    useListOrganizations: () => ({ data: null }),
    organization: { setActive: vi.fn(), create: vi.fn() },
  },
}))

vi.mock('./UserMenu', () => ({
  UserMenu: () => <div data-testid="user-menu" />,
}))

vi.mock('./OrgSwitcher', () => ({
  OrgSwitcher: () => <div data-testid="org-switcher" />,
}))

vi.mock('@/lib/config', () => ({
  GITHUB_REPO_URL: 'https://github.com/test/repo',
}))

vi.mock('@/paraglide/runtime', () => ({
  getLocale: () => 'en',
  setLocale: vi.fn(),
  locales: ['en', 'fr'],
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light', setTheme: vi.fn() }),
}))

import { Header } from './Header'

describe('Header', () => {
  it('renders the Roxabi logo', () => {
    render(<Header />)

    expect(screen.getByText('Roxabi')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<Header />)

    expect(screen.getAllByText('nav_home').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('nav_docs').length).toBeGreaterThanOrEqual(1)
  })

  it('renders the mobile menu toggle button', () => {
    render(<Header />)

    const menuButton = screen.getByLabelText('menu_open')
    expect(menuButton).toBeInTheDocument()
  })

  it('toggles mobile menu when clicking the menu button', () => {
    render(<Header />)

    const menuButton = screen.getByLabelText('menu_open')
    fireEvent.click(menuButton)

    expect(screen.getByLabelText('menu_close')).toBeInTheDocument()
  })

  it('links the logo to the home page', () => {
    render(<Header />)

    const logoLink = screen.getByText('Roxabi').closest('a')
    expect(logoLink).toHaveAttribute('href', '/')
  })

  it('renders the Design System link in desktop nav', () => {
    render(<Header />)

    const links = screen.getAllByText('nav_design_system')
    expect(links.length).toBeGreaterThanOrEqual(1)

    const desktopLink = links[0]?.closest('a')
    expect(desktopLink).toHaveAttribute('href', '/design-system')
  })

  it('renders the Design System link in mobile nav when open', () => {
    render(<Header />)

    // Open mobile menu
    const menuButton = screen.getByLabelText('menu_open')
    fireEvent.click(menuButton)

    // Both desktop and mobile links should exist
    const links = screen.getAllByText('nav_design_system')
    expect(links.length).toBeGreaterThanOrEqual(2)
  })

  it('closes mobile menu when Escape key is pressed', () => {
    render(<Header />)

    // Open mobile menu
    fireEvent.click(screen.getByLabelText('menu_open'))
    expect(screen.getByLabelText('menu_close')).toBeInTheDocument()

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByLabelText('menu_open')).toBeInTheDocument()
  })

  it('closes mobile menu when clicking outside', () => {
    render(<Header />)

    // Open mobile menu
    fireEvent.click(screen.getByLabelText('menu_open'))
    expect(screen.getByLabelText('menu_close')).toBeInTheDocument()

    // Click outside (on document body)
    fireEvent.click(document.body)
    expect(screen.getByLabelText('menu_open')).toBeInTheDocument()
  })
})
