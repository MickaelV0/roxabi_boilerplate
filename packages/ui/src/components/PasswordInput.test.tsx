import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { calculateStrength, PasswordInput } from './PasswordInput'

describe('PasswordInput', () => {
  it('renders with data-slot attribute', () => {
    render(<PasswordInput data-testid="password" />)
    expect(screen.getByTestId('password').closest('[data-slot="password-input"]')).toBeTruthy()
  })

  it('renders as password type by default', () => {
    render(<PasswordInput data-testid="password" />)
    expect(screen.getByTestId('password')).toHaveAttribute('type', 'password')
  })

  it('renders strength indicator when showStrength is true', () => {
    const { container } = render(<PasswordInput showStrength />)
    expect(container.querySelector('[data-slot="password-strength"]')).toBeTruthy()
  })

  it('does not render strength indicator by default', () => {
    const { container } = render(<PasswordInput />)
    expect(container.querySelector('[data-slot="password-strength"]')).toBeFalsy()
  })

  // TODO: add tests for show/hide toggle
  // TODO: add tests for strength bar segments
})

describe('calculateStrength', () => {
  // TODO: implement tests once calculateStrength is implemented
  it('returns 0 for empty string', () => {
    expect(calculateStrength('')).toBe(0)
  })
})
