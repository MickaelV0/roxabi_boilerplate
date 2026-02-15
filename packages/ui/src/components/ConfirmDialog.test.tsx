import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

function renderConfirmDialog(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Delete item?',
    description: 'This action cannot be undone.',
    onConfirm: vi.fn(),
    ...overrides,
  }
  return { ...render(<ConfirmDialog {...defaultProps} />), props: defaultProps }
}

describe('ConfirmDialog', () => {
  it('should render title and description', () => {
    // Arrange & Act
    renderConfirmDialog()

    // Assert
    expect(screen.getByText('Delete item?')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
  })

  it('should call onConfirm when action button is clicked', () => {
    // Arrange
    const onConfirm = vi.fn()
    renderConfirmDialog({ onConfirm })

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    // Assert
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should disable confirm button when loading is true', () => {
    // Arrange & Act
    renderConfirmDialog({ loading: true })

    // Assert
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled()
  })

  it('should apply danger variant styling by default', () => {
    // Arrange & Act
    renderConfirmDialog()

    // Assert -- ConfirmDialog does not expose a data-variant attribute;
    // CSS class assertion is the only way to verify the variant styling
    const confirmBtn = screen.getByRole('button', { name: 'Confirm' })
    expect(confirmBtn).toHaveClass('bg-destructive')
  })

  it('should apply warning variant styling when variant is warning', () => {
    // Arrange & Act
    renderConfirmDialog({ variant: 'warning' })

    // Assert -- no data-variant attribute; CSS class verifies variant
    const confirmBtn = screen.getByRole('button', { name: 'Confirm' })
    expect(confirmBtn).toHaveClass('bg-warning')
  })

  it('should apply info variant with no extra styles', () => {
    // Arrange & Act
    renderConfirmDialog({ variant: 'info' })

    // Assert -- info variant has empty string for styles, verify absence of other variant classes
    const confirmBtn = screen.getByRole('button', { name: 'Confirm' })
    expect(confirmBtn).not.toHaveClass('bg-destructive')
    expect(confirmBtn).not.toHaveClass('bg-warning')
  })

  it('should render default confirmText and cancelText', () => {
    // Arrange & Act
    renderConfirmDialog()

    // Assert
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('should render custom confirmText and cancelText when provided', () => {
    // Arrange & Act
    renderConfirmDialog({ confirmText: 'Delete', cancelText: 'Keep' })

    // Assert
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument()
  })
})
