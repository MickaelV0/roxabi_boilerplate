import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies default variant by default', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'default')
  })

  it('applies secondary variant when specified', () => {
    render(<Button variant="secondary">Click me</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'secondary')
  })

  it('applies destructive variant when specified', () => {
    render(<Button variant="destructive">Click me</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'destructive')
  })

  it('applies outline variant when specified', () => {
    render(<Button variant="outline">Click me</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'outline')
  })

  it('can be disabled', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn()
    render(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>
    )
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies size variants', () => {
    render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'sm')
  })

  it('has data-slot attribute', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('data-slot', 'button')
  })
})
