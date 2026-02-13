import { type RefObject, useEffect, useRef, useState } from 'react'

type UseIntersectionVisibilityOptions = {
  threshold?: number
  rootMargin?: string
}

/**
 * Encapsulates IntersectionObserver + prefers-reduced-motion check.
 * Returns a ref to attach to the observed element and an isVisible flag.
 */
export function useIntersectionVisibility<T extends HTMLElement = HTMLElement>(
  options: UseIntersectionVisibilityOptions = {}
): { ref: RefObject<T | null>; isVisible: boolean } {
  const { threshold = 0.1, rootMargin } = options
  const ref = useRef<T | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return { ref, isVisible }
}
