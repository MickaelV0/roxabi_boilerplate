import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AnimatedSection } from './AnimatedSection'

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver as a class
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()

class MockIntersectionObserver {
  private callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }

  observe = (...args: Parameters<IntersectionObserver['observe']>) => {
    mockObserve(...args)
    // Trigger the callback after observe is called (simulating intersection)
    // Using queueMicrotask so the observer variable is assigned in the source
    queueMicrotask(() => {
      this.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver
      )
    })
  }

  disconnect = mockDisconnect
  unobserve = vi.fn()
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

describe('AnimatedSection', () => {
  it('renders children', async () => {
    render(
      <AnimatedSection>
        <p>Hello World</p>
      </AnimatedSection>
    )

    // Wait for microtask to trigger intersection callback
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

  it('becomes visible when intersection observer triggers', async () => {
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

  it('sets up IntersectionObserver on mount', () => {
    render(
      <AnimatedSection>
        <span>Observed</span>
      </AnimatedSection>
    )

    expect(mockObserve).toHaveBeenCalled()
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
