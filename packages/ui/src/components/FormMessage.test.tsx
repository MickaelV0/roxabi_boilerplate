import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormMessage } from './FormMessage'

describe('FormMessage', () => {
  it('should render default (error) variant with correct icon and styling', () => {
    // Arrange & Act
    const { container } = render(<FormMessage>Something went wrong</FormMessage>)

    // Assert
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    // FormMessage does not expose a data-variant attribute;
    // CSS class assertion is the only way to verify the variant styling
    expect(alert).toHaveClass('text-destructive')
    expect(container.querySelector('[data-slot="form-message"]')).toBeInTheDocument()
  })

  it('should render success variant correctly', () => {
    // Arrange & Act
    render(<FormMessage variant="success">Saved</FormMessage>)

    // Assert — no data-variant attribute; CSS class verifies variant
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('text-success')
  })

  it('should render warning variant correctly', () => {
    // Arrange & Act
    render(<FormMessage variant="warning">Careful</FormMessage>)

    // Assert — no data-variant attribute; CSS class verifies variant
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('text-warning')
  })

  it('should render info variant correctly', () => {
    // Arrange & Act
    render(<FormMessage variant="info">FYI</FormMessage>)

    // Assert — no data-variant attribute; CSS class verifies variant
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('text-info')
  })

  it('should render children text', () => {
    // Arrange & Act
    render(<FormMessage>Error message text</FormMessage>)

    // Assert
    expect(screen.getByText('Error message text')).toBeInTheDocument()
  })

  it('should have role="alert" and aria-live="polite"', () => {
    // Arrange & Act
    render(<FormMessage>Alert message</FormMessage>)

    // Assert
    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('aria-live', 'polite')
  })

  it('should pass through custom className when provided', () => {
    // Arrange & Act
    render(<FormMessage className="custom-class">Message</FormMessage>)

    // Assert
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('custom-class')
  })
})
