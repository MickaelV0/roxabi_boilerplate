import { vi } from 'vitest'

/**
 * Passive mock: observe is a no-op. Use for tests that don't need
 * IntersectionObserver to fire its callback.
 */
export class MockPassiveIntersectionObserver {
  observe: () => void = vi.fn()
  disconnect: () => void = vi.fn()
  unobserve: () => void = vi.fn()
}

/**
 * Active mock: triggers the callback via microtask with
 * `isIntersecting: true` on every `observe()` call.
 * Use for tests that rely on elements entering the viewport.
 */
export class MockActiveIntersectionObserver {
  private callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }

  observe: (target: Element) => void = vi.fn().mockImplementation(() => {
    queueMicrotask(() => {
      this.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver
      )
    })
  })

  disconnect: () => void = vi.fn()
  unobserve: (target: Element) => void = vi.fn()
}

/**
 * Helper to install the appropriate IntersectionObserver mock globally.
 *
 * @param variant - 'passive' for a no-op observer, 'active' for one that
 *                  fires immediately with isIntersecting: true
 */
export function setupIntersectionObserverMock(variant: 'passive' | 'active') {
  const Mock =
    variant === 'passive' ? MockPassiveIntersectionObserver : MockActiveIntersectionObserver

  vi.stubGlobal('IntersectionObserver', Mock)
}
