import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Textarea } from './Textarea'

describe('Textarea', () => {
  it('renders correctly', () => {
    render(<Textarea aria-label="Message" />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    render(<Textarea aria-label="Message" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('data-slot', 'textarea')
  })

  it('renders as a textarea element', () => {
    render(<Textarea aria-label="Message" />)
    expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA')
  })

  it('accepts and displays a value', () => {
    render(<Textarea aria-label="Message" defaultValue="Hello world" />)
    expect(screen.getByRole('textbox')).toHaveValue('Hello world')
  })

  it('fires onChange when typing', () => {
    const handleChange = vi.fn()
    render(<Textarea aria-label="Message" onChange={handleChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'New text' } })
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('renders with placeholder', () => {
    render(<Textarea placeholder="Enter message..." />)
    expect(screen.getByPlaceholderText('Enter message...')).toBeInTheDocument()
  })

  it('can be disabled', () => {
    render(<Textarea aria-label="Message" disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('applies custom className', () => {
    render(<Textarea aria-label="Message" className="custom-class" />)
    expect(screen.getByRole('textbox')).toHaveClass('custom-class')
  })
})
