import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Switch } from './Switch'

describe('Switch', () => {
  it('should render correctly', () => {
    // Arrange & Act
    render(<Switch aria-label="Toggle" />)

    // Assert
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    render(<Switch aria-label="Toggle" />)

    // Assert
    expect(screen.getByRole('switch')).toHaveAttribute('data-slot', 'switch')
  })

  it('should be unchecked by default', () => {
    // Arrange & Act
    render(<Switch aria-label="Toggle" />)

    // Assert
    expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'unchecked')
  })

  it('should toggle when clicked', () => {
    // Arrange
    render(<Switch aria-label="Toggle" />)
    const switchEl = screen.getByRole('switch')

    // Act
    fireEvent.click(switchEl)

    // Assert
    expect(switchEl).toHaveAttribute('data-state', 'checked')
  })

  it('should be checked when defaultChecked is set', () => {
    // Arrange & Act
    render(<Switch aria-label="Toggle" defaultChecked />)

    // Assert
    expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'checked')
  })

  it('should be disabled when disabled prop is set', () => {
    // Arrange & Act
    render(<Switch aria-label="Toggle" disabled />)

    // Assert
    expect(screen.getByRole('switch')).toBeDisabled()
  })

  it('should call onCheckedChange when toggled', () => {
    // Arrange
    const handleChange = vi.fn()
    render(<Switch aria-label="Toggle" onCheckedChange={handleChange} />)

    // Act
    fireEvent.click(screen.getByRole('switch'))

    // Assert
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('should apply default size when no size is specified', () => {
    // Arrange & Act
    render(<Switch aria-label="Toggle" />)

    // Assert
    expect(screen.getByRole('switch')).toHaveAttribute('data-size', 'default')
  })

  it('should apply sm size when size is sm', () => {
    // Arrange & Act
    render(<Switch aria-label="Toggle" size="sm" />)

    // Assert
    expect(screen.getByRole('switch')).toHaveAttribute('data-size', 'sm')
  })
})
