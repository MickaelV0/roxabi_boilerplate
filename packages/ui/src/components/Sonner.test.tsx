import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Toaster } from './Sonner'

describe('Toaster', () => {
  it('renders without crashing', () => {
    const { container } = render(<Toaster />)
    expect(container).toBeTruthy()
  })

  it('renders sonner toaster into the DOM', () => {
    render(<Toaster />)
    // Sonner renders a section element as its root
    const section = document.querySelector('section')
    expect(section).toBeTruthy()
  })

  it('accepts position prop without error', () => {
    expect(() => render(<Toaster position="top-center" />)).not.toThrow()
  })
})
