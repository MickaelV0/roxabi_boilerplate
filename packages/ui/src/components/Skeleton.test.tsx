import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(<Skeleton />)

    // Assert
    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
  })

  it('should render as a div', () => {
    // Arrange & Act
    const { container } = render(<Skeleton />)

    // Assert
    expect(container.querySelector('[data-slot="skeleton"]')?.tagName).toBe('DIV')
  })

  it('should apply animate-pulse class when rendered', () => {
    // Arrange & Act
    const { container } = render(<Skeleton />)

    // Assert -- Skeleton does not expose a data attribute for animation state;
    // CSS class assertion is the only way to verify the pulse animation
    expect(container.querySelector('[data-slot="skeleton"]')).toHaveClass('animate-pulse')
  })

  it('should apply custom className when provided', () => {
    // Arrange & Act
    const { container } = render(<Skeleton className="h-4 w-32" />)

    // Assert
    const skeleton = container.querySelector('[data-slot="skeleton"]')
    expect(skeleton).toHaveClass('h-4')
    expect(skeleton).toHaveClass('w-32')
  })

  it('should forward additional props', () => {
    // Arrange & Act
    const { container } = render(<Skeleton data-testid="my-skeleton" />)

    // Assert
    expect(container.querySelector('[data-testid="my-skeleton"]')).toBeInTheDocument()
  })
})
