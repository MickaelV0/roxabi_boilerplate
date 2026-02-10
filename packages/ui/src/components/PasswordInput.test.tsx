import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { calculateStrength, PasswordInput } from './PasswordInput'

const noop = vi.fn()

describe('PasswordInput', () => {
  it('renders with data-slot attribute', () => {
    const { container } = render(<PasswordInput />)
    expect(container.querySelector('[data-slot="password-input"]')).toBeTruthy()
  })

  it('renders as password type by default', () => {
    render(<PasswordInput aria-label="Password" />)
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
  })

  it('toggles visibility when eye button is clicked', () => {
    render(<PasswordInput aria-label="Password" />)
    const input = screen.getByLabelText('Password')
    const toggleButton = screen.getByLabelText('Show password')

    expect(input).toHaveAttribute('type', 'password')

    fireEvent.click(toggleButton)
    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText('Hide password')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Hide password'))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('does not render strength indicator by default', () => {
    const { container } = render(<PasswordInput value="" onChange={noop} />)
    expect(container.querySelector('[data-slot="password-strength"]')).toBeFalsy()
  })

  it('does not render strength indicator when showStrength is true but value is empty', () => {
    const { container } = render(<PasswordInput showStrength value="" onChange={noop} />)
    expect(container.querySelector('[data-slot="password-strength"]')).toBeFalsy()
  })

  it('renders strength indicator when showStrength is true and value is non-empty', () => {
    const { container } = render(<PasswordInput showStrength value="abc" onChange={noop} />)
    expect(container.querySelector('[data-slot="password-strength"]')).toBeTruthy()
  })

  it('renders 4 strength bar segments', () => {
    const { container } = render(<PasswordInput showStrength value="test" onChange={noop} />)
    const segments = container.querySelectorAll('[data-slot="password-strength"] .flex.gap-1 > div')
    expect(segments).toHaveLength(4)
  })

  it('renders password rules checklist', () => {
    render(<PasswordInput showStrength value="test" onChange={noop} />)
    expect(screen.getByText('8+ characters')).toBeTruthy()
    expect(screen.getByText('Uppercase letter')).toBeTruthy()
    expect(screen.getByText('Number')).toBeTruthy()
    expect(screen.getByText('Symbol')).toBeTruthy()
  })

  it('shows strength label based on password', () => {
    // "abcdefgh" → 1 rule (8+ chars) → Weak
    const { rerender } = render(<PasswordInput showStrength value="abcdefgh" onChange={noop} />)
    expect(screen.getByText('Weak')).toBeTruthy()

    // "Abcdefgh" → 2 rules (8+ chars + uppercase) → Fair
    rerender(<PasswordInput showStrength value="Abcdefgh" onChange={noop} />)
    expect(screen.getByText('Fair')).toBeTruthy()

    // "Abcdefg1" → 3 rules (8+ chars + uppercase + number) → Good
    rerender(<PasswordInput showStrength value="Abcdefg1" onChange={noop} />)
    expect(screen.getByText('Good')).toBeTruthy()

    // "Abcdefg1!" → 4 rules (all) → Strong
    rerender(<PasswordInput showStrength value="Abcdefg1!" onChange={noop} />)
    expect(screen.getByText('Strong')).toBeTruthy()
  })

  it('sets data-strength attribute', () => {
    const { container } = render(<PasswordInput showStrength value="Abcdefg1!" onChange={noop} />)
    expect(container.querySelector('[data-strength="4"]')).toBeTruthy()
  })
})

describe('calculateStrength', () => {
  it('returns 0 for empty string', () => {
    expect(calculateStrength('')).toBe(0)
  })

  it('returns 0 for short lowercase-only password', () => {
    expect(calculateStrength('abc')).toBe(0)
  })

  it('returns 1 for a password meeting one rule', () => {
    expect(calculateStrength('abcdefgh')).toBe(1)
  })

  it('returns 2 for a password meeting two rules', () => {
    expect(calculateStrength('Abcdefgh')).toBe(2)
  })

  it('returns 3 for a password meeting three rules', () => {
    expect(calculateStrength('Abcdefg1')).toBe(3)
  })

  it('returns 4 for a password meeting all rules', () => {
    expect(calculateStrength('Abcdefg1!')).toBe(4)
  })
})
