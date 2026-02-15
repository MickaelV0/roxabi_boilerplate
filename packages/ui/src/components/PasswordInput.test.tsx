import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { calculateStrength, PasswordInput } from './PasswordInput'

function createNoop() {
  return vi.fn()
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PasswordInput', () => {
  it('should render with data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(<PasswordInput />)

    // Assert
    expect(container.querySelector('[data-slot="password-input"]')).toBeTruthy()
  })

  it('should render as password type by default', () => {
    // Arrange & Act
    render(<PasswordInput aria-label="Password" />)

    // Assert
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
  })

  it('should toggle visibility when eye button is clicked', () => {
    // Arrange
    render(<PasswordInput aria-label="Password" />)
    const input = screen.getByLabelText('Password')
    const toggleButton = screen.getByLabelText('Show password')

    // Act & Assert -- toggle to text
    expect(input).toHaveAttribute('type', 'password')
    fireEvent.click(toggleButton)
    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText('Hide password')).toBeTruthy()

    // Act & Assert -- toggle back to password
    fireEvent.click(screen.getByLabelText('Hide password'))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('should not render strength indicator by default', () => {
    // Arrange & Act
    const noop = createNoop()
    const { container } = render(<PasswordInput value="" onChange={noop} />)

    // Assert
    expect(container.querySelector('[data-slot="password-strength"]')).toBeFalsy()
  })

  it('should not render strength indicator when showStrength is true but value is empty', () => {
    // Arrange & Act
    const noop = createNoop()
    const { container } = render(<PasswordInput showStrength value="" onChange={noop} />)

    // Assert
    expect(container.querySelector('[data-slot="password-strength"]')).toBeFalsy()
  })

  it('should render strength indicator when showStrength is true and value is non-empty', () => {
    // Arrange & Act
    const noop = createNoop()
    const { container } = render(<PasswordInput showStrength value="abc" onChange={noop} />)

    // Assert
    expect(container.querySelector('[data-slot="password-strength"]')).toBeTruthy()
  })

  it('should render 4 strength bar segments', () => {
    // Arrange & Act
    const noop = createNoop()
    const { container } = render(<PasswordInput showStrength value="test" onChange={noop} />)

    // Assert
    const segments = container.querySelectorAll('[data-slot="password-strength"] .flex.gap-1 > div')
    expect(segments).toHaveLength(4)
  })

  it('should render password rules checklist', () => {
    // Arrange & Act
    const noop = createNoop()
    render(<PasswordInput showStrength value="test" onChange={noop} />)

    // Assert
    expect(screen.getByText('8+ characters')).toBeTruthy()
    expect(screen.getByText('Uppercase letter')).toBeTruthy()
    expect(screen.getByText('Number')).toBeTruthy()
    expect(screen.getByText('Symbol')).toBeTruthy()
  })

  it('should show strength label based on password', () => {
    // Arrange
    const noop = createNoop()

    // Act & Assert -- "abcdefgh" -> 1 rule (8+ chars) -> Weak
    const { rerender } = render(<PasswordInput showStrength value="abcdefgh" onChange={noop} />)
    expect(screen.getByText('Weak')).toBeTruthy()

    // Act & Assert -- "Abcdefgh" -> 2 rules (8+ chars + uppercase) -> Fair
    rerender(<PasswordInput showStrength value="Abcdefgh" onChange={noop} />)
    expect(screen.getByText('Fair')).toBeTruthy()

    // Act & Assert -- "Abcdefg1" -> 3 rules (8+ chars + uppercase + number) -> Good
    rerender(<PasswordInput showStrength value="Abcdefg1" onChange={noop} />)
    expect(screen.getByText('Good')).toBeTruthy()

    // Act & Assert -- "Abcdefg1!" -> 4 rules (all) -> Strong
    rerender(<PasswordInput showStrength value="Abcdefg1!" onChange={noop} />)
    expect(screen.getByText('Strong')).toBeTruthy()
  })

  it('should set data-strength attribute when strength indicator is shown', () => {
    // Arrange & Act
    const noop = createNoop()
    const { container } = render(<PasswordInput showStrength value="Abcdefg1!" onChange={noop} />)

    // Assert
    expect(container.querySelector('[data-strength="4"]')).toBeTruthy()
  })
})

describe('calculateStrength', () => {
  it('should return 0 for empty string', () => {
    // Arrange & Act
    const result = calculateStrength('')

    // Assert
    expect(result).toBe(0)
  })

  it('should return 0 for short lowercase-only password', () => {
    // Arrange & Act
    const result = calculateStrength('abc')

    // Assert
    expect(result).toBe(0)
  })

  it('should return 1 for a password meeting one rule', () => {
    // Arrange & Act
    const result = calculateStrength('abcdefgh')

    // Assert
    expect(result).toBe(1)
  })

  it('should return 2 for a password meeting two rules', () => {
    // Arrange & Act
    const result = calculateStrength('Abcdefgh')

    // Assert
    expect(result).toBe(2)
  })

  it('should return 3 for a password meeting three rules', () => {
    // Arrange & Act
    const result = calculateStrength('Abcdefg1')

    // Assert
    expect(result).toBe(3)
  })

  it('should return 4 for a password meeting all rules', () => {
    // Arrange & Act
    const result = calculateStrength('Abcdefg1!')

    // Assert
    expect(result).toBe(4)
  })
})
