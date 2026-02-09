import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Label } from './Label'

describe('Label', () => {
  it('renders children correctly', () => {
    render(<Label>Email</Label>)
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    const { container } = render(<Label>Email</Label>)
    expect(container.querySelector('[data-slot="label"]')).toBeInTheDocument()
  })

  it('renders as a label element', () => {
    const { container } = render(<Label>Email</Label>)
    expect(container.querySelector('label')).toBeInTheDocument()
  })

  it('supports htmlFor prop', () => {
    const { container } = render(<Label htmlFor="email-input">Email</Label>)
    expect(container.querySelector('label')).toHaveAttribute('for', 'email-input')
  })

  it('applies custom className', () => {
    const { container } = render(<Label className="custom-class">Email</Label>)
    expect(container.querySelector('[data-slot="label"]')).toHaveClass('custom-class')
  })
})
