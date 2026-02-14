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
  it('renders title and description', () => {
    // Arrange & Act
    renderConfirmDialog()

    // Assert
    expect(screen.getByText('Delete item?')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
  })

  it('calls onConfirm when action button is clicked', () => {
    // Arrange
    const onConfirm = vi.fn()
    renderConfirmDialog({ onConfirm })

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    // Assert
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('disables confirm button when loading is true', () => {
    // Arrange & Act
    renderConfirmDialog({ loading: true })

    // Assert
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled()
  })

  it('applies danger variant className by default', () => {
    // Arrange & Act
    renderConfirmDialog()

    // Assert
    const confirmBtn = screen.getByRole('button', { name: 'Confirm' })
    expect(confirmBtn).toHaveClass('bg-destructive')
  })

  it('applies warning variant className', () => {
    // Arrange & Act
    renderConfirmDialog({ variant: 'warning' })

    // Assert
    const confirmBtn = screen.getByRole('button', { name: 'Confirm' })
    expect(confirmBtn).toHaveClass('bg-warning')
  })

  it('applies info variant with no extra styles', () => {
    // Arrange & Act
    renderConfirmDialog({ variant: 'info' })

    // Assert
    const confirmBtn = screen.getByRole('button', { name: 'Confirm' })
    expect(confirmBtn).not.toHaveClass('bg-destructive')
    expect(confirmBtn).not.toHaveClass('bg-warning')
  })

  it('renders default confirmText and cancelText', () => {
    // Arrange & Act
    renderConfirmDialog()

    // Assert
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('renders custom confirmText and cancelText', () => {
    // Arrange & Act
    renderConfirmDialog({ confirmText: 'Delete', cancelText: 'Keep' })

    // Assert
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument()
  })
})
