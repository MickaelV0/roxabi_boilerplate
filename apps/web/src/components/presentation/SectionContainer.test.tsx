import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// Mock @repo/ui to avoid resolution issues in the test environment
vi.mock('@repo/ui', () => ({
  cn: (...classes: Array<string | undefined | false>) => classes.filter(Boolean).join(' '),
}))

import { SectionContainer } from './SectionContainer'

describe('SectionContainer', () => {
  it('renders children', () => {
    // Arrange & Act
    render(
      <SectionContainer id="test-section">
        <p>Hello World</p>
      </SectionContainer>
    )

    // Assert
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('applies correct CSS classes (min-h-dvh, snap-start, flex)', () => {
    // Arrange & Act
    const { container } = render(
      <SectionContainer id="test-section">
        <p>Content</p>
      </SectionContainer>
    )

    // Assert
    const section = container.firstChild as HTMLElement
    expect(section).toHaveClass('min-h-dvh')
    expect(section).toHaveClass('snap-start')
    expect(section).toHaveClass('flex')
  })

  it('sets the section id attribute', () => {
    // Arrange & Act
    render(
      <SectionContainer id="my-section">
        <p>Identified content</p>
      </SectionContainer>
    )

    // Assert
    const section = document.getElementById('my-section')
    expect(section).toBeInTheDocument()
    expect(section?.tagName.toLowerCase()).toBe('section')
  })
})
