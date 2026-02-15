import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Spinner } from './Spinner'

describe('Spinner', () => {
  it('should render with role status', () => {
    // Arrange & Act
    render(<Spinner />)

    // Assert
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(<Spinner />)

    // Assert
    expect(container.querySelector('[data-slot="spinner"]')).toBeInTheDocument()
  })

  it('should have default aria-label of Loading', () => {
    // Arrange & Act
    render(<Spinner />)

    // Assert
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading')
  })

  it('should allow custom aria-label when provided', () => {
    // Arrange & Act
    render(<Spinner aria-label="Submitting" />)

    // Assert
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Submitting')
  })

  it('should apply default size classes when no size is specified', () => {
    // Arrange & Act
    render(<Spinner />)

    // Assert — Spinner does not expose a data-size attribute;
    // CSS class assertion is the only way to verify size variant
    expect(screen.getByRole('status')).toHaveClass('size-6', 'border-2')
  })

  it('should apply sm size classes when size is sm', () => {
    // Arrange & Act
    render(<Spinner size="sm" />)

    // Assert — no data-size attribute; CSS class verifies size
    expect(screen.getByRole('status')).toHaveClass('size-4', 'border-2')
  })

  it('should apply lg size classes when size is lg', () => {
    // Arrange & Act
    render(<Spinner size="lg" />)

    // Assert — no data-size attribute; CSS class verifies size
    expect(screen.getByRole('status')).toHaveClass('size-8')
  })

  it('should apply xl size classes when size is xl', () => {
    // Arrange & Act
    render(<Spinner size="xl" />)

    // Assert — no data-size attribute; CSS class verifies size
    expect(screen.getByRole('status')).toHaveClass('size-12', 'border-4')
  })

  it('should apply base animation class when rendered', () => {
    // Arrange & Act
    render(<Spinner />)

    // Assert — no data attribute for animation; CSS class verifies spinner animation
    expect(screen.getByRole('status')).toHaveClass('animate-spin', 'rounded-full')
  })

  it('should apply custom className when provided', () => {
    // Arrange & Act
    render(<Spinner className="custom-class" />)

    // Assert
    expect(screen.getByRole('status')).toHaveClass('custom-class')
  })

  it('should render as output element', () => {
    // Arrange & Act
    render(<Spinner />)

    // Assert
    expect(screen.getByRole('status').tagName).toBe('OUTPUT')
  })
})
