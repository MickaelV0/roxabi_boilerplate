import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@repo/ui', () => ({
  Button: ({
    children,
    asChild,
    ...props
  }: React.PropsWithChildren<{
    asChild?: boolean
    variant?: string
    size?: string
    'aria-label'?: string
  }>) =>
    asChild ? (
      children
    ) : (
      <button type="button" aria-label={props['aria-label']}>
        {children}
      </button>
    ),
  DropdownMenu: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: React.PropsWithChildren<{ asChild?: boolean }>) =>
    asChild ? children : <div>{children}</div>,
  DropdownMenuContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
  }: React.PropsWithChildren<{ onClick?: () => void; className?: string }>) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}))

vi.mock('@/paraglide/messages', () => ({
  m: {
    language_label: () => 'Language',
  },
}))

vi.mock('@/paraglide/runtime', () => ({
  getLocale: () => 'en',
  setLocale: vi.fn(),
  locales: ['en', 'fr'],
}))

import { LocaleSwitcher } from './LocaleSwitcher'

describe('LocaleSwitcher', () => {
  it('should render the language button', () => {
    // Arrange & Act
    render(<LocaleSwitcher />)

    // Assert
    const button = screen.getByLabelText('Language')
    expect(button).toBeInTheDocument()
  })

  it('should render as a button element', () => {
    // Arrange & Act
    render(<LocaleSwitcher />)

    // Assert
    const button = screen.getByRole('button', { name: 'Language' })
    expect(button).toBeInTheDocument()
  })

  it('should render locale options', () => {
    // Arrange & Act
    render(<LocaleSwitcher />)

    // Assert
    expect(screen.getByText('English')).toBeInTheDocument()
    expect(screen.getByText('Français')).toBeInTheDocument()
  })

  it('should have the correct aria-label for accessibility', () => {
    // Arrange & Act
    render(<LocaleSwitcher />)

    // Assert
    const button = screen.getByLabelText('Language')
    expect(button).toHaveAttribute('aria-label', 'Language')
  })
})
