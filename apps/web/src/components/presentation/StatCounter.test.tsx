import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@repo/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

// Mock matchMedia — default: no reduced motion preference
const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

// Mock IntersectionObserver to trigger immediately
class MockIntersectionObserver {
  private callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }

  observe = vi.fn().mockImplementation(() => {
    queueMicrotask(() => {
      this.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver
      )
    })
  })

  disconnect = vi.fn()
  unobserve = vi.fn()
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

// Mock requestAnimationFrame to run callbacks synchronously
let rafCallbacks: Array<FrameRequestCallback> = []
vi.stubGlobal(
  'requestAnimationFrame',
  vi.fn((cb: FrameRequestCallback) => {
    rafCallbacks.push(cb)
    return rafCallbacks.length
  })
)
vi.stubGlobal('cancelAnimationFrame', vi.fn())

function flushRaf(iterations = 100) {
  for (let i = 0; i < iterations; i++) {
    const cbs = [...rafCallbacks]
    rafCallbacks = []
    for (const cb of cbs) {
      cb(performance.now() + i * 100)
    }
    if (rafCallbacks.length === 0) break
  }
}

import { StatCounter } from './StatCounter'

afterEach(() => {
  rafCallbacks = []
  mockMatchMedia.mockClear()
})

describe('StatCounter', () => {
  it('renders target value when animation completes', async () => {
    // Arrange & Act
    render(<StatCounter value={808} label="Sessions" />)

    // Wait for IntersectionObserver microtask to fire
    await vi.waitFor(() => {
      flushRaf()
      expect(screen.getByText('808')).toBeInTheDocument()
    })

    // Assert
    expect(screen.getByText('Sessions')).toBeInTheDocument()
  })

  it('respects prefers-reduced-motion by showing final value immediately', async () => {
    // Arrange — simulate reduced motion preference
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    // Act
    render(<StatCounter value={624} label="Commits" />)

    // Assert — value should appear immediately without animation
    await vi.waitFor(() => {
      expect(screen.getByText('624')).toBeInTheDocument()
    })
    expect(screen.getByText('Commits')).toBeInTheDocument()
  })

  it('displays label and suffix correctly', async () => {
    // Arrange & Act
    render(<StatCounter value={88} label="Completion Rate" suffix="%" />)

    // Wait for animation to complete
    await vi.waitFor(() => {
      flushRaf()
      expect(screen.getByText('Completion Rate')).toBeInTheDocument()
    })

    // Assert — suffix should appear alongside the number
    expect(screen.getByText(/%/)).toBeInTheDocument()
  })
})
