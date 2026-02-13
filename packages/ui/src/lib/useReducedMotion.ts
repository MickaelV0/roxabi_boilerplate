import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function getMatchMedia(query: string): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  return window.matchMedia(query)
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    return getMatchMedia(QUERY)?.matches ?? false
  })

  useEffect(() => {
    const mql = getMatchMedia(QUERY)
    if (!mql) return
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return reduced
}
