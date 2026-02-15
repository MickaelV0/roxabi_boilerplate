import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Label } from './Label'

describe('Label', () => {
  it('should render children correctly', () => {
    // Arrange & Act
    render(<Label>Email</Label>)

    // Assert
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(<Label>Email</Label>)

    // Assert
    expect(container.querySelector('[data-slot="label"]')).toBeInTheDocument()
  })

  it('should render as a label element', () => {
    // Arrange & Act
    const { container } = render(<Label>Email</Label>)

    // Assert
    expect(container.querySelector('label')).toBeInTheDocument()
  })

  it('should support htmlFor prop', () => {
    // Arrange & Act
    const { container } = render(<Label htmlFor="email-input">Email</Label>)

    // Assert
    expect(container.querySelector('label')).toHaveAttribute('for', 'email-input')
  })

  it('should apply custom className when provided', () => {
    // Arrange & Act
    const { container } = render(<Label className="custom-class">Email</Label>)

    // Assert
    expect(container.querySelector('[data-slot="label"]')).toHaveClass('custom-class')
  })
})
