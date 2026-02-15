import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Textarea } from './Textarea'

describe('Textarea', () => {
  it('should render correctly', () => {
    // Arrange & Act
    render(<Textarea aria-label="Message" />)

    // Assert
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    render(<Textarea aria-label="Message" />)

    // Assert
    expect(screen.getByRole('textbox')).toHaveAttribute('data-slot', 'textarea')
  })

  it('should render as a textarea element', () => {
    // Arrange & Act
    render(<Textarea aria-label="Message" />)

    // Assert
    expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA')
  })

  it('should accept and display a value when defaultValue is set', () => {
    // Arrange & Act
    render(<Textarea aria-label="Message" defaultValue="Hello world" />)

    // Assert
    expect(screen.getByRole('textbox')).toHaveValue('Hello world')
  })

  it('should fire onChange when typing', () => {
    // Arrange
    const handleChange = vi.fn()
    render(<Textarea aria-label="Message" onChange={handleChange} />)

    // Act
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New text' } })

    // Assert
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('should render with placeholder when provided', () => {
    // Arrange & Act
    render(<Textarea placeholder="Enter message..." />)

    // Assert
    expect(screen.getByPlaceholderText('Enter message...')).toBeInTheDocument()
  })

  it('should be disabled when disabled prop is set', () => {
    // Arrange & Act
    render(<Textarea aria-label="Message" disabled />)

    // Assert
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('should apply custom className when provided', () => {
    // Arrange & Act
    render(<Textarea aria-label="Message" className="custom-class" />)

    // Assert
    expect(screen.getByRole('textbox')).toHaveClass('custom-class')
  })
})
