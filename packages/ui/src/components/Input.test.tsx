import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Input } from './Input'

describe('Input', () => {
  it('renders correctly', () => {
    render(<Input aria-label="Name" />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    render(<Input aria-label="Name" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('data-slot', 'input')
  })

  it('accepts and displays a value', () => {
    render(<Input aria-label="Name" defaultValue="John" />)
    expect(screen.getByRole('textbox')).toHaveValue('John')
  })

  it('fires onChange when typing', () => {
    const handleChange = vi.fn()
    render(<Input aria-label="Name" onChange={handleChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello' } })
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('renders with placeholder', () => {
    render(<Input placeholder="Enter name" />)
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument()
  })

  it('can be disabled', () => {
    render(<Input aria-label="Name" disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('applies the correct type attribute', () => {
    render(<Input aria-label="Email" type="email" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')
  })

  it('applies custom className', () => {
    render(<Input aria-label="Name" className="custom-class" />)
    expect(screen.getByRole('textbox')).toHaveClass('custom-class')
  })
})
