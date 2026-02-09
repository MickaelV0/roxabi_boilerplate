import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Switch } from './Switch'

describe('Switch', () => {
  it('renders correctly', () => {
    render(<Switch aria-label="Toggle" />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    render(<Switch aria-label="Toggle" />)
    expect(screen.getByRole('switch')).toHaveAttribute('data-slot', 'switch')
  })

  it('is unchecked by default', () => {
    render(<Switch aria-label="Toggle" />)
    expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'unchecked')
  })

  it('toggles when clicked', () => {
    render(<Switch aria-label="Toggle" />)
    const switchEl = screen.getByRole('switch')
    fireEvent.click(switchEl)
    expect(switchEl).toHaveAttribute('data-state', 'checked')
  })

  it('can be controlled with defaultChecked', () => {
    render(<Switch aria-label="Toggle" defaultChecked />)
    expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'checked')
  })

  it('can be disabled', () => {
    render(<Switch aria-label="Toggle" disabled />)
    expect(screen.getByRole('switch')).toBeDisabled()
  })

  it('calls onCheckedChange when toggled', () => {
    const handleChange = vi.fn()
    render(<Switch aria-label="Toggle" onCheckedChange={handleChange} />)
    fireEvent.click(screen.getByRole('switch'))
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('applies default size', () => {
    render(<Switch aria-label="Toggle" />)
    expect(screen.getByRole('switch')).toHaveAttribute('data-size', 'default')
  })

  it('applies sm size', () => {
    render(<Switch aria-label="Toggle" size="sm" />)
    expect(screen.getByRole('switch')).toHaveAttribute('data-size', 'sm')
  })
})
