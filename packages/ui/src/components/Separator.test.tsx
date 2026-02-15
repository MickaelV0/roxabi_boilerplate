import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Separator } from './Separator'

describe('Separator', () => {
  it('should render correctly', () => {
    // Arrange & Act
    const { container } = render(<Separator />)

    // Assert
    expect(container.querySelector('[data-slot="separator"]')).toBeInTheDocument()
  })

  it('should have horizontal orientation by default', () => {
    // Arrange & Act
    const { container } = render(<Separator />)

    // Assert
    expect(container.querySelector('[data-slot="separator"]')).toHaveAttribute(
      'data-orientation',
      'horizontal'
    )
  })

  it('should support vertical orientation when specified', () => {
    // Arrange & Act
    const { container } = render(<Separator orientation="vertical" />)

    // Assert
    expect(container.querySelector('[data-slot="separator"]')).toHaveAttribute(
      'data-orientation',
      'vertical'
    )
  })

  it('should be decorative by default', () => {
    // Arrange & Act
    const { container } = render(<Separator />)

    // Assert
    const separator = container.querySelector('[data-slot="separator"]')
    expect(separator).toHaveAttribute('role', 'none')
  })

  it('should render as separator role when not decorative', () => {
    // Arrange & Act
    const { container } = render(<Separator decorative={false} />)

    // Assert
    const separator = container.querySelector('[data-slot="separator"]')
    expect(separator).toHaveAttribute('role', 'separator')
  })

  it('should apply custom className when provided', () => {
    // Arrange & Act
    const { container } = render(<Separator className="custom-class" />)

    // Assert
    expect(container.querySelector('[data-slot="separator"]')).toHaveClass('custom-class')
  })
})
