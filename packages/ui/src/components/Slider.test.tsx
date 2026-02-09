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
  it('renders correctly', () => {
    render(<Slider aria-label="Volume" defaultValue={[50]} />)
    expect(screen.getByRole('slider')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    const { container } = render(<Slider aria-label="Volume" defaultValue={[50]} />)
    expect(container.querySelector('[data-slot="slider"]')).toBeInTheDocument()
  })

  it('renders thumb for single value', () => {
    const { container } = render(<Slider aria-label="Volume" defaultValue={[50]} />)
    const thumbs = container.querySelectorAll('[data-slot="slider-thumb"]')
    expect(thumbs).toHaveLength(1)
  })

  it('renders two thumbs for range slider', () => {
    const { container } = render(<Slider aria-label="Price range" defaultValue={[25, 75]} />)
    const thumbs = container.querySelectorAll('[data-slot="slider-thumb"]')
    expect(thumbs).toHaveLength(2)
  })

  it('renders track and range', () => {
    const { container } = render(<Slider aria-label="Volume" defaultValue={[50]} />)
    expect(container.querySelector('[data-slot="slider-track"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="slider-range"]')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <Slider aria-label="Volume" defaultValue={[50]} className="custom-class" />
    )
    expect(container.querySelector('[data-slot="slider"]')).toHaveClass('custom-class')
  })

  it('can be disabled', () => {
    const { container } = render(<Slider aria-label="Volume" defaultValue={[50]} disabled />)
    expect(container.querySelector('[data-slot="slider"]')).toHaveAttribute('data-disabled', '')
  })
})
