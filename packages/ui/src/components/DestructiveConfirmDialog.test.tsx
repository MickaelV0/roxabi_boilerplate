import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DestructiveConfirmDialog } from './DestructiveConfirmDialog'

function renderDialog(overrides: Partial<Parameters<typeof DestructiveConfirmDialog>[0]> = {}) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Delete account',
    description: 'This will permanently remove your account.',
    confirmText: 'DELETE',
    onConfirm: vi.fn(),
    ...overrides,
  }
  return { ...render(<DestructiveConfirmDialog {...defaultProps} />), props: defaultProps }
}

describe('DestructiveConfirmDialog', () => {
  it('should render title, description, and confirm label when open', () => {
    // Arrange & Act
    renderDialog({ confirmLabel: 'Type DELETE to confirm' })

    // Assert
    expect(screen.getByText('Delete account')).toBeInTheDocument()
    expect(screen.getByText('This will permanently remove your account.')).toBeInTheDocument()
    expect(screen.getByText('Type DELETE to confirm')).toBeInTheDocument()
  })

  it('should disable the action button when input does not match confirmText', () => {
    // Arrange
    renderDialog()

    // Act
    const input = screen.getByPlaceholderText('DELETE')
    fireEvent.change(input, { target: { value: 'WRONG' } })

    // Assert
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled()
  })

  it('should enable the action button when input matches confirmText (case-insensitive)', () => {
    // Arrange
    renderDialog({ confirmText: 'DELETE' })

    // Act
    const input = screen.getByPlaceholderText('DELETE')
    fireEvent.change(input, { target: { value: 'delete' } })

    // Assert
    expect(screen.getByRole('button', { name: 'Delete' })).not.toBeDisabled()
  })

  it('should call onConfirm when action button is clicked with matching input', () => {
    // Arrange
    const onConfirm = vi.fn()
    renderDialog({ onConfirm, confirmText: 'DELETE' })

    // Act
    const input = screen.getByPlaceholderText('DELETE')
    fireEvent.change(input, { target: { value: 'DELETE' } })
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    // Assert
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should reset input when dialog closes', () => {
    // Arrange
    const { rerender, props } = renderDialog()
    const input = screen.getByPlaceholderText('DELETE')
    fireEvent.change(input, { target: { value: 'DELETE' } })

    // Act
    rerender(<DestructiveConfirmDialog {...props} open={false} />)
    rerender(<DestructiveConfirmDialog {...props} open={true} />)

    // Assert
    const refreshedInput = screen.getByPlaceholderText('DELETE')
    expect(refreshedInput).toHaveValue('')
  })

  it('should show impactSummary when provided', () => {
    // Arrange & Act
    renderDialog({ impactSummary: 'All your data will be lost.' })

    // Assert
    expect(screen.getByText('All your data will be lost.')).toBeInTheDocument()
  })

  it('should not render impactSummary when not provided', () => {
    // Arrange & Act
    renderDialog()

    // Assert
    expect(screen.queryByText('All your data will be lost.')).not.toBeInTheDocument()
  })

  it('should show "Deleting..." and disable action button when isLoading is true', () => {
    // Arrange
    renderDialog({ isLoading: true, confirmText: 'DELETE' })
    const input = screen.getByPlaceholderText('DELETE')

    // Act
    fireEvent.change(input, { target: { value: 'DELETE' } })

    // Assert
    const actionButton = screen.getByRole('button', { name: 'Deleting...' })
    expect(actionButton).toBeInTheDocument()
    expect(actionButton).toBeDisabled()
  })

  it('should render Cancel button', () => {
    // Arrange & Act
    renderDialog()

    // Assert
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('should disable action button by default when input is empty', () => {
    // Arrange & Act
    renderDialog()

    // Assert
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled()
  })
})
