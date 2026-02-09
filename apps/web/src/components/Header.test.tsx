import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

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

vi.mock('@/paraglide/messages', () => ({
  m: {
    nav_home: () => 'Home',
    nav_demos: () => 'Demos',
    nav_docs: () => 'Docs',
    menu_open: () => 'Open menu',
    menu_close: () => 'Close menu',
    github_label: () => 'GitHub',
    language_label: () => 'Language',
    theme_toggle: () => 'Toggle theme',
  },
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

    expect(screen.getAllByText('Home').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Docs').length).toBeGreaterThanOrEqual(1)
  })

  it('renders the mobile menu toggle button', () => {
    render(<Header />)

    const menuButton = screen.getByLabelText('Open menu')
    expect(menuButton).toBeInTheDocument()
  })

  it('toggles mobile menu when clicking the menu button', () => {
    render(<Header />)

    const menuButton = screen.getByLabelText('Open menu')
    fireEvent.click(menuButton)

    expect(screen.getByLabelText('Close menu')).toBeInTheDocument()
  })

  it('links the logo to the home page', () => {
    render(<Header />)

    const logoLink = screen.getByText('Roxabi').closest('a')
    expect(logoLink).toHaveAttribute('href', '/')
  })
})
