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
    variant?: string
    size?: string
    'aria-label'?: string
  }>) =>
    asChild ? (
      children
    ) : (
      <button type="button" onClick={onClick} disabled={disabled} aria-label={props['aria-label']}>
        {children}
      </button>
    ),
}))

vi.mock('@/paraglide/messages', () => ({
  m: {
    theme_toggle: () => 'Toggle theme',
  },
}))

const mockSetTheme = vi.fn()

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light', setTheme: mockSetTheme }),
}))

import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  it('renders the toggle button', () => {
    render(<ThemeToggle />)

    const button = screen.getByRole('button', { name: 'Toggle theme' })
    expect(button).toBeInTheDocument()
  })

  it('has the correct aria-label', () => {
    render(<ThemeToggle />)

    const button = screen.getByLabelText('Toggle theme')
    expect(button).toBeInTheDocument()
  })

  it('calls setTheme when clicked', () => {
    render(<ThemeToggle />)

    const button = screen.getByRole('button', { name: 'Toggle theme' })
    fireEvent.click(button)

    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('renders without being disabled after mounting', () => {
    render(<ThemeToggle />)

    const button = screen.getByRole('button', { name: 'Toggle theme' })
    expect(button).not.toBeDisabled()
  })
})
