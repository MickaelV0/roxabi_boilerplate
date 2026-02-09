import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  it('renders correctly', () => {
    const { container } = render(<Skeleton />)
    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    const { container } = render(<Skeleton />)
    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
  })

  it('renders as a div', () => {
    const { container } = render(<Skeleton />)
    expect(container.querySelector('[data-slot="skeleton"]')?.tagName).toBe('DIV')
  })

  it('applies animate-pulse class', () => {
    const { container } = render(<Skeleton />)
    expect(container.querySelector('[data-slot="skeleton"]')).toHaveClass('animate-pulse')
  })

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="h-4 w-32" />)
    const skeleton = container.querySelector('[data-slot="skeleton"]')
    expect(skeleton).toHaveClass('h-4')
    expect(skeleton).toHaveClass('w-32')
  })

  it('forwards additional props', () => {
    const { container } = render(<Skeleton data-testid="my-skeleton" />)
    expect(container.querySelector('[data-testid="my-skeleton"]')).toBeInTheDocument()
  })
})
