import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { Slider } from './Slider'

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

describe('Slider', () => {
  it('should render correctly', () => {
    // Arrange & Act
    render(<Slider aria-label="Volume" defaultValue={[50]} />)

    // Assert
    expect(screen.getByRole('slider')).toBeInTheDocument()
  })

  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(<Slider aria-label="Volume" defaultValue={[50]} />)

    // Assert
    expect(container.querySelector('[data-slot="slider"]')).toBeInTheDocument()
  })

  it('should render thumb for single value', () => {
    // Arrange & Act
    const { container } = render(<Slider aria-label="Volume" defaultValue={[50]} />)

    // Assert
    const thumbs = container.querySelectorAll('[data-slot="slider-thumb"]')
    expect(thumbs).toHaveLength(1)
  })

  it('should render two thumbs for range slider', () => {
    // Arrange & Act
    const { container } = render(<Slider aria-label="Price range" defaultValue={[25, 75]} />)

    // Assert
    const thumbs = container.querySelectorAll('[data-slot="slider-thumb"]')
    expect(thumbs).toHaveLength(2)
  })

  it('should render track and range', () => {
    // Arrange & Act
    const { container } = render(<Slider aria-label="Volume" defaultValue={[50]} />)

    // Assert
    expect(container.querySelector('[data-slot="slider-track"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="slider-range"]')).toBeInTheDocument()
  })

  it('should apply custom className when provided', () => {
    // Arrange & Act
    const { container } = render(
      <Slider aria-label="Volume" defaultValue={[50]} className="custom-class" />
    )

    // Assert
    expect(container.querySelector('[data-slot="slider"]')).toHaveClass('custom-class')
  })

  it('should be disabled when disabled prop is set', () => {
    // Arrange & Act
    const { container } = render(<Slider aria-label="Volume" defaultValue={[50]} disabled />)

    // Assert
    expect(container.querySelector('[data-slot="slider"]')).toHaveAttribute('data-disabled', '')
  })
})
