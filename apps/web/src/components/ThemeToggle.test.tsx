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
  it('should render the toggle button', () => {
    // Arrange & Act
    render(<ThemeToggle />)

    // Assert
    const button = screen.getByRole('button', { name: 'Toggle theme' })
    expect(button).toBeInTheDocument()
  })

  it('should have the correct aria-label', () => {
    // Arrange & Act
    render(<ThemeToggle />)

    // Assert
    const button = screen.getByLabelText('Toggle theme')
    expect(button).toBeInTheDocument()
  })

  it('should call setTheme when clicked', () => {
    // Arrange
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: 'Toggle theme' })

    // Act
    fireEvent.click(button)

    // Assert
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('should render without being disabled after mounting', () => {
    // Arrange & Act
    render(<ThemeToggle />)

    // Assert
    const button = screen.getByRole('button', { name: 'Toggle theme' })
    expect(button).not.toBeDisabled()
  })
})
