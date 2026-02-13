import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useReducedMotion } from './useReducedMotion'

type ChangeListener = (event: { matches: boolean }) => void

function createMockMatchMedia(matches: boolean) {
  const listeners: ChangeListener[] = []
  const mql = {
    matches,
    addEventListener: vi.fn((_event: string, listener: ChangeListener) => {
      listeners.push(listener)
    }),
    removeEventListener: vi.fn((_event: string, listener: ChangeListener) => {
      const idx = listeners.indexOf(listener)
      if (idx !== -1) listeners.splice(idx, 1)
    }),
  }
  return { mql, listeners }
}

describe('useReducedMotion', () => {
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    originalMatchMedia = window.matchMedia
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('returns false when prefers-reduced-motion does not match', () => {
    // Arrange
    const { mql } = createMockMatchMedia(false)
    window.matchMedia = vi.fn(() => mql as unknown as MediaQueryList)

    // Act
    const { result } = renderHook(() => useReducedMotion())

    // Assert
    expect(result.current).toBe(false)
  })

  it('returns true when prefers-reduced-motion matches', () => {
    // Arrange
    const { mql } = createMockMatchMedia(true)
    window.matchMedia = vi.fn(() => mql as unknown as MediaQueryList)

    // Act
    const { result } = renderHook(() => useReducedMotion())

    // Assert
    expect(result.current).toBe(true)
  })

  it('returns false when matchMedia is not available', () => {
    // Arrange — simulate environment without matchMedia
    // @ts-expect-error -- testing missing API
    window.matchMedia = undefined

    // Act
    const { result } = renderHook(() => useReducedMotion())

    // Assert
    expect(result.current).toBe(false)
  })

  it('responds to change events on the media query list', () => {
    // Arrange
    const { mql, listeners } = createMockMatchMedia(false)
    window.matchMedia = vi.fn(() => mql as unknown as MediaQueryList)

    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)

    // Act — simulate user enabling reduced motion
    act(() => {
      for (const listener of listeners) {
        listener({ matches: true })
      }
    })

    // Assert
    expect(result.current).toBe(true)
  })

  it('cleans up the event listener on unmount', () => {
    // Arrange
    const { mql } = createMockMatchMedia(false)
    window.matchMedia = vi.fn(() => mql as unknown as MediaQueryList)

    const { unmount } = renderHook(() => useReducedMotion())
    expect(mql.addEventListener).toHaveBeenCalledOnce()

    // Act
    unmount()

    // Assert
    expect(mql.removeEventListener).toHaveBeenCalledOnce()
  })
})
