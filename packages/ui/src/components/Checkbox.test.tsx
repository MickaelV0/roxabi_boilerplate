import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Checkbox } from './Checkbox'

describe('Checkbox', () => {
  it('renders correctly', () => {
    render(<Checkbox aria-label="Accept terms" />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    render(<Checkbox aria-label="Accept terms" />)
    expect(screen.getByRole('checkbox')).toHaveAttribute('data-slot', 'checkbox')
  })

  it('is unchecked by default', () => {
    render(<Checkbox aria-label="Accept terms" />)
    expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'unchecked')
  })

  it('can be checked when clicked', () => {
    render(<Checkbox aria-label="Accept terms" />)
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(checkbox).toHaveAttribute('data-state', 'checked')
  })

  it('can be controlled with defaultChecked', () => {
    render(<Checkbox aria-label="Accept terms" defaultChecked />)
    expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'checked')
  })

  it('can be disabled', () => {
    render(<Checkbox aria-label="Accept terms" disabled />)
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })

  it('calls onCheckedChange when toggled', () => {
    const handleChange = vi.fn()
    render(<Checkbox aria-label="Accept terms" onCheckedChange={handleChange} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('applies custom className', () => {
    render(<Checkbox aria-label="Accept terms" className="custom-class" />)
    expect(screen.getByRole('checkbox')).toHaveClass('custom-class')
  })
})
