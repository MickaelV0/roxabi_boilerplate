import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// Mock react-intersection-observer — always report as in view
vi.mock('react-intersection-observer', () => ({
  useInView: () => ({ ref: vi.fn(), inView: true }),
}))

import { AnimatedSection } from './AnimatedSection'

describe('AnimatedSection', () => {
  it('renders children', async () => {
    render(
      <AnimatedSection>
        <p>Hello World</p>
      </AnimatedSection>
    )

    await vi.waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument()
    })
  })

  it('applies custom className', async () => {
    const { container } = render(
      <AnimatedSection className="custom-class">
        <span>Content</span>
      </AnimatedSection>
    )

    await vi.waitFor(() => {
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  it('becomes visible when inView is true', async () => {
    const { container } = render(
      <AnimatedSection>
        <span>Animated content</span>
      </AnimatedSection>
    )

    await vi.waitFor(() => {
      expect(container.firstChild).toHaveClass('opacity-100')
      expect(container.firstChild).toHaveClass('translate-y-0')
    })
  })

  it('applies transition classes', () => {
    const { container } = render(
      <AnimatedSection>
        <span>Transitions</span>
      </AnimatedSection>
    )

    expect(container.firstChild).toHaveClass('transition-[opacity,transform]')
    expect(container.firstChild).toHaveClass('duration-700')
    expect(container.firstChild).toHaveClass('ease-out')
  })
})
