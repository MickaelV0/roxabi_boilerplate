import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@repo/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

import { SectionHeading } from './SectionHeading'

describe('SectionHeading', () => {
  it('renders the title', () => {
    render(<SectionHeading title="My Title" />)

    expect(screen.getByText('My Title')).toBeInTheDocument()
  })

  it('renders the title as an h2 element', () => {
    render(<SectionHeading title="Heading" />)

    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Heading')
  })

  it('renders the subtitle when provided', () => {
    render(<SectionHeading title="Title" subtitle="A subtitle" />)

    expect(screen.getByText('A subtitle')).toBeInTheDocument()
  })

  it('does not render a subtitle paragraph when subtitle is not provided', () => {
    const { container } = render(<SectionHeading title="Title Only" />)

    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs).toHaveLength(0)
  })

  it('applies custom className', () => {
    const { container } = render(<SectionHeading title="Title" className="my-class" />)

    expect(container.firstChild).toHaveClass('my-class')
  })
})
