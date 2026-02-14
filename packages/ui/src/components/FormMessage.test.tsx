import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormMessage } from './FormMessage'

describe('FormMessage', () => {
  it('renders default (error) variant with correct icon and styling', () => {
    // Arrange & Act
    const { container } = render(<FormMessage>Something went wrong</FormMessage>)

    // Assert
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveClass('text-destructive')
    expect(container.querySelector('[data-slot="form-message"]')).toBeInTheDocument()
  })

  it('renders success variant correctly', () => {
    // Arrange & Act
    render(<FormMessage variant="success">Saved</FormMessage>)

    // Assert
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('text-success')
  })

  it('renders warning variant correctly', () => {
    // Arrange & Act
    render(<FormMessage variant="warning">Careful</FormMessage>)

    // Assert
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('text-warning')
  })

  it('renders info variant correctly', () => {
    // Arrange & Act
    render(<FormMessage variant="info">FYI</FormMessage>)

    // Assert
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('text-info')
  })

  it('renders children text', () => {
    // Arrange & Act
    render(<FormMessage>Error message text</FormMessage>)

    // Assert
    expect(screen.getByText('Error message text')).toBeInTheDocument()
  })

  it('has role="alert" and aria-live="polite"', () => {
    // Arrange & Act
    render(<FormMessage>Alert message</FormMessage>)

    // Assert
    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('aria-live', 'polite')
  })

  it('passes through custom className', () => {
    // Arrange & Act
    render(<FormMessage className="custom-class">Message</FormMessage>)

    // Assert
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('custom-class')
  })
})
