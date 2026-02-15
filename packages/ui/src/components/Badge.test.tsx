import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './Badge'

describe('Badge', () => {
  it('should render children correctly', () => {
    // Arrange & Act
    render(<Badge>New</Badge>)

    // Assert
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(<Badge>New</Badge>)

    // Assert
    expect(container.querySelector('[data-slot="badge"]')).toBeInTheDocument()
  })

  it('should apply default variant classes when no variant is specified', () => {
    // Arrange & Act
    const { container } = render(<Badge>Default</Badge>)

    // Assert — Badge does not expose a data-variant attribute;
    // CSS class assertion is the only way to verify the variant styling
    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge).toHaveClass('bg-primary')
  })

  it('should apply secondary variant classes when variant is secondary', () => {
    // Arrange & Act
    const { container } = render(<Badge variant="secondary">Secondary</Badge>)

    // Assert — no data-variant attribute; CSS class verifies variant
    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge).toHaveClass('bg-secondary')
  })

  it('should apply destructive variant classes when variant is destructive', () => {
    // Arrange & Act
    const { container } = render(<Badge variant="destructive">Destructive</Badge>)

    // Assert — no data-variant attribute; CSS class verifies variant
    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge).toHaveClass('bg-destructive')
  })

  it('should apply outline variant classes when variant is outline', () => {
    // Arrange & Act
    const { container } = render(<Badge variant="outline">Outline</Badge>)

    // Assert — no data-variant attribute; CSS class verifies variant
    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge).toHaveClass('border-border')
  })

  it('should apply custom className when provided', () => {
    // Arrange & Act
    const { container } = render(<Badge className="custom-class">Custom</Badge>)

    // Assert
    expect(container.querySelector('[data-slot="badge"]')).toHaveClass('custom-class')
  })

  it('should render as span by default', () => {
    // Arrange & Act
    const { container } = render(<Badge>Span</Badge>)

    // Assert
    expect(container.querySelector('[data-slot="badge"]')?.tagName).toBe('SPAN')
  })
})
