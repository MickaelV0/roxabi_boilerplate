import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Checkbox } from './Checkbox'

describe('Checkbox', () => {
  it('should render correctly', () => {
    // Arrange & Act
    render(<Checkbox aria-label="Accept terms" />)

    // Assert
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    render(<Checkbox aria-label="Accept terms" />)

    // Assert
    expect(screen.getByRole('checkbox')).toHaveAttribute('data-slot', 'checkbox')
  })

  it('should be unchecked by default', () => {
    // Arrange & Act
    render(<Checkbox aria-label="Accept terms" />)

    // Assert
    expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'unchecked')
  })

  it('should be checked when clicked', () => {
    // Arrange
    render(<Checkbox aria-label="Accept terms" />)
    const checkbox = screen.getByRole('checkbox')

    // Act
    fireEvent.click(checkbox)

    // Assert
    expect(checkbox).toHaveAttribute('data-state', 'checked')
  })

  it('should be checked when defaultChecked is set', () => {
    // Arrange & Act
    render(<Checkbox aria-label="Accept terms" defaultChecked />)

    // Assert
    expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'checked')
  })

  it('should be disabled when disabled prop is set', () => {
    // Arrange & Act
    render(<Checkbox aria-label="Accept terms" disabled />)

    // Assert
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })

  it('should call onCheckedChange when toggled', () => {
    // Arrange
    const handleChange = vi.fn()
    render(<Checkbox aria-label="Accept terms" onCheckedChange={handleChange} />)

    // Act
    fireEvent.click(screen.getByRole('checkbox'))

    // Assert
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('should apply custom className when provided', () => {
    // Arrange & Act
    render(<Checkbox aria-label="Accept terms" className="custom-class" />)

    // Assert
    expect(screen.getByRole('checkbox')).toHaveClass('custom-class')
  })
})
