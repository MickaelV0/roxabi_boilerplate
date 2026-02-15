import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@repo/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

import { SectionHeading } from './SectionHeading'

describe('SectionHeading', () => {
  it('should render the title', () => {
    // Arrange & Act
    render(<SectionHeading title="My Title" />)

    // Assert
    expect(screen.getByText('My Title')).toBeInTheDocument()
  })

  it('should render the title as an h2 element', () => {
    // Arrange & Act
    render(<SectionHeading title="Heading" />)

    // Assert
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Heading')
  })

  it('should render the subtitle when provided', () => {
    // Arrange & Act
    render(<SectionHeading title="Title" subtitle="A subtitle" />)

    // Assert
    expect(screen.getByText('A subtitle')).toBeInTheDocument()
  })

  it('should not render a subtitle paragraph when subtitle is not provided', () => {
    // Arrange & Act
    const { container } = render(<SectionHeading title="Title Only" />)

    // Assert
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs).toHaveLength(0)
  })

  it('should apply custom className to the wrapper div', () => {
    // Arrange & Act
    // Custom className is passed through cn() which concatenates it
    // with the default classes. Verify the heading renders within
    // a container that includes the custom class in its className string.
    const { container } = render(<SectionHeading title="Title" className="my-class" />)

    // Assert -- className is the only practical way to verify custom class passthrough
    // on a purely presentational wrapper div with no ARIA role or semantic meaning.
    expect(container.firstChild).toHaveClass('my-class')
  })
})
