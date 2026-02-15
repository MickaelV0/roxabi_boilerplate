import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Toaster } from './Sonner'

describe('Toaster', () => {
  it('should render without crashing', () => {
    // Arrange & Act
    const { container } = render(<Toaster />)

    // Assert
    expect(container).toBeTruthy()
  })

  it('should render sonner toaster into the DOM', () => {
    // Arrange & Act
    render(<Toaster />)

    // Assert — Sonner renders a section element as its root
    const section = document.querySelector('section')
    expect(section).toBeTruthy()
  })

  it('should accept position prop without error', () => {
    // Arrange, Act & Assert
    expect(() => render(<Toaster position="top-center" />)).not.toThrow()
  })
})
