import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Spinner } from './Spinner'

describe('Spinner', () => {
  it('renders with role status', () => {
    // Arrange & Act
    render(<Spinner />)

    // Assert
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    // Arrange & Act
    const { container } = render(<Spinner />)

    // Assert
    expect(container.querySelector('[data-slot="spinner"]')).toBeInTheDocument()
  })

  it('has default aria-label of Loading', () => {
    // Arrange & Act
    render(<Spinner />)

    // Assert
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading')
  })

  it('allows custom aria-label', () => {
    // Arrange & Act
    render(<Spinner aria-label="Submitting" />)

    // Assert
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Submitting')
  })

  it('applies default size classes', () => {
    // Arrange & Act
    render(<Spinner />)

    // Assert
    expect(screen.getByRole('status')).toHaveClass('h-6', 'w-6', 'border-2')
  })

  it('applies sm size classes', () => {
    // Arrange & Act
    render(<Spinner size="sm" />)

    // Assert
    expect(screen.getByRole('status')).toHaveClass('h-4', 'w-4', 'border-2')
  })

  it('applies lg size classes', () => {
    // Arrange & Act
    render(<Spinner size="lg" />)

    // Assert
    expect(screen.getByRole('status')).toHaveClass('h-8', 'w-8')
  })

  it('applies xl size classes', () => {
    // Arrange & Act
    render(<Spinner size="xl" />)

    // Assert
    expect(screen.getByRole('status')).toHaveClass('h-12', 'w-12', 'border-4')
  })

  it('applies base animation class', () => {
    // Arrange & Act
    render(<Spinner />)

    // Assert
    expect(screen.getByRole('status')).toHaveClass('animate-spin', 'rounded-full')
  })

  it('applies custom className', () => {
    // Arrange & Act
    render(<Spinner className="custom-class" />)

    // Assert
    expect(screen.getByRole('status')).toHaveClass('custom-class')
  })

  it('renders as output element', () => {
    // Arrange & Act
    render(<Spinner />)

    // Assert
    expect(screen.getByRole('status').tagName).toBe('OUTPUT')
  })
})
