import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renders children correctly', () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    const { container } = render(<Badge>New</Badge>)
    expect(container.querySelector('[data-slot="badge"]')).toBeInTheDocument()
  })

  it('applies default variant classes', () => {
    const { container } = render(<Badge>Default</Badge>)
    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge).toHaveClass('bg-primary')
  })

  it('applies secondary variant classes', () => {
    const { container } = render(<Badge variant="secondary">Secondary</Badge>)
    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge).toHaveClass('bg-secondary')
  })

  it('applies destructive variant classes', () => {
    const { container } = render(<Badge variant="destructive">Destructive</Badge>)
    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge).toHaveClass('bg-destructive')
  })

  it('applies outline variant classes', () => {
    const { container } = render(<Badge variant="outline">Outline</Badge>)
    const badge = container.querySelector('[data-slot="badge"]')
    expect(badge).toHaveClass('border-border')
  })

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom-class">Custom</Badge>)
    expect(container.querySelector('[data-slot="badge"]')).toHaveClass('custom-class')
  })

  it('renders as span by default', () => {
    const { container } = render(<Badge>Span</Badge>)
    expect(container.querySelector('[data-slot="badge"]')?.tagName).toBe('SPAN')
  })
})
