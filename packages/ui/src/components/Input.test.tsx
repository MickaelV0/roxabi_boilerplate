import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Input } from './Input'

describe('Input', () => {
  it('should render correctly', () => {
    // Arrange & Act
    render(<Input aria-label="Name" />)

    // Assert
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    render(<Input aria-label="Name" />)

    // Assert
    expect(screen.getByRole('textbox')).toHaveAttribute('data-slot', 'input')
  })

  it('should accept and display a value when defaultValue is set', () => {
    // Arrange & Act
    render(<Input aria-label="Name" defaultValue="John" />)

    // Assert
    expect(screen.getByRole('textbox')).toHaveValue('John')
  })

  it('should fire onChange when typing', () => {
    // Arrange
    const handleChange = vi.fn()
    render(<Input aria-label="Name" onChange={handleChange} />)

    // Act
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello' } })

    // Assert
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('should render with placeholder when provided', () => {
    // Arrange & Act
    render(<Input placeholder="Enter name" />)

    // Assert
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument()
  })

  it('should be disabled when disabled prop is set', () => {
    // Arrange & Act
    render(<Input aria-label="Name" disabled />)

    // Assert
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('should apply the correct type attribute when type is specified', () => {
    // Arrange & Act
    render(<Input aria-label="Email" type="email" />)

    // Assert
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')
  })

  it('should apply custom className when provided', () => {
    // Arrange & Act
    render(<Input aria-label="Name" className="custom-class" />)

    // Assert
    expect(screen.getByRole('textbox')).toHaveClass('custom-class')
  })
})
