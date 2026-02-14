import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Mock react-intersection-observer — always report as in view
vi.mock('react-intersection-observer', () => ({
  useInView: () => ({ ref: vi.fn(), inView: true }),
}))

// Mock useReducedMotion — defaults to false (motion enabled)
const mockUseReducedMotion = vi.fn(() => false)
vi.mock('@/lib/useReducedMotion', () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}))

import { AnimatedSection } from './AnimatedSection'

afterEach(() => {
  mockUseReducedMotion.mockReset()
  mockUseReducedMotion.mockReturnValue(false)
})

describe('AnimatedSection', () => {
  it('renders children', async () => {
    // Arrange & Act
    render(
      <AnimatedSection>
        <p>Hello World</p>
      </AnimatedSection>
    )

    // Assert
    await vi.waitFor(() => {
      expect(screen.getByText('Hello World')).toBeInTheDocument()
    })
  })

  it('applies custom className', async () => {
    // Arrange & Act
    const { container } = render(
      <AnimatedSection className="custom-class">
        <span>Content</span>
      </AnimatedSection>
    )

    // Assert
    await vi.waitFor(() => {
      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  it('becomes visible when inView is true', async () => {
    // Arrange & Act
    const { container } = render(
      <AnimatedSection>
        <span>Animated content</span>
      </AnimatedSection>
    )

    // Assert
    await vi.waitFor(() => {
      expect(container.firstChild).toHaveClass('opacity-100')
      expect(container.firstChild).toHaveClass('translate-y-0')
    })
  })

  it('applies transition classes', () => {
    // Arrange & Act
    const { container } = render(
      <AnimatedSection>
        <span>Transitions</span>
      </AnimatedSection>
    )

    // Assert
    expect(container.firstChild).toHaveClass('transition-[opacity,transform]')
    expect(container.firstChild).toHaveClass('duration-700')
    expect(container.firstChild).toHaveClass('ease-out')
  })

  it('renders without transition classes when reduced motion is preferred', () => {
    // Arrange
    mockUseReducedMotion.mockReturnValue(true)

    // Act
    render(
      <AnimatedSection>
        <span>Static content</span>
      </AnimatedSection>
    )

    // Assert — reduced-motion path renders a plain div without animation classes
    const wrapper = screen.getByText('Static content').parentElement
    expect(wrapper).toBeInTheDocument()
    expect(wrapper).not.toHaveClass('transition-[opacity,transform]')
    expect(wrapper).not.toHaveClass('duration-700')
    expect(wrapper).not.toHaveClass('opacity-0')
    expect(wrapper).not.toHaveClass('translate-y-8')
  })

  it('preserves custom className when reduced motion is preferred', () => {
    // Arrange
    mockUseReducedMotion.mockReturnValue(true)

    // Act
    const { container } = render(
      <AnimatedSection className="my-custom-class">
        <span>Accessible content</span>
      </AnimatedSection>
    )

    // Assert — className is still applied on the reduced-motion path
    expect(container.firstChild).toHaveClass('my-custom-class')
    expect(container.firstChild).not.toHaveClass('transition-[opacity,transform]')
  })
})
