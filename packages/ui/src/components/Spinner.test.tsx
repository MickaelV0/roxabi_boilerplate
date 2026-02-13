import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Spinner } from './Spinner'

describe('Spinner', () => {
  it('renders with role status', () => {
    render(<Spinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    const { container } = render(<Spinner />)
    expect(container.querySelector('[data-slot="spinner"]')).toBeInTheDocument()
  })

  it('has default aria-label of Loading', () => {
    render(<Spinner />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading')
  })

  it('allows custom aria-label', () => {
    render(<Spinner aria-label="Submitting" />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Submitting')
  })

  it('applies default size classes', () => {
    const { container } = render(<Spinner />)
    const spinner = container.querySelector('[data-slot="spinner"]')
    expect(spinner).toHaveClass('h-6', 'w-6', 'border-2')
  })

  it('applies sm size classes', () => {
    const { container } = render(<Spinner size="sm" />)
    const spinner = container.querySelector('[data-slot="spinner"]')
    expect(spinner).toHaveClass('h-4', 'w-4', 'border-2')
  })

  it('applies lg size classes', () => {
    const { container } = render(<Spinner size="lg" />)
    const spinner = container.querySelector('[data-slot="spinner"]')
    expect(spinner).toHaveClass('h-8', 'w-8')
  })

  it('applies xl size classes', () => {
    const { container } = render(<Spinner size="xl" />)
    const spinner = container.querySelector('[data-slot="spinner"]')
    expect(spinner).toHaveClass('h-12', 'w-12', 'border-4')
  })

  it('applies base animation class', () => {
    const { container } = render(<Spinner />)
    const spinner = container.querySelector('[data-slot="spinner"]')
    expect(spinner).toHaveClass('animate-spin', 'rounded-full')
  })

  it('applies custom className', () => {
    const { container } = render(<Spinner className="custom-class" />)
    expect(container.querySelector('[data-slot="spinner"]')).toHaveClass('custom-class')
  })

  it('renders as output element', () => {
    const { container } = render(<Spinner />)
    expect(container.querySelector('[data-slot="spinner"]')?.tagName).toBe('OUTPUT')
  })
})
