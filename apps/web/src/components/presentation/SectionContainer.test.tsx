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

  it('applies custom className to the section element', () => {
    // Arrange & Act
    render(
      <SectionContainer id="styled-section" className="custom-class">
        <p>Styled content</p>
      </SectionContainer>
    )

    // Assert — className is merged into the section element via cn()
    const section = document.getElementById('styled-section')
    expect(section).toBeInTheDocument()
    expect(section).toHaveClass('custom-class')
  })
})
