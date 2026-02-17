'use client'

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import { useInView } from 'react-intersection-observer'

import { useReducedMotion } from '@/lib/useReducedMotion'
import { cn } from '@/lib/utils'

type AnimatedSectionProps = {
  children: ReactNode
  className?: string
}

export function AnimatedSection({ children, className = '' }: AnimatedSectionProps) {
  const reducedMotion = useReducedMotion()
  const elementRef = useRef<HTMLDivElement>(null)
  const [skipAnimation, setSkipAnimation] = useState(false)
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px',
    triggerOnce: true,
  })

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      elementRef.current = node
      inViewRef(node)
    },
    [inViewRef]
  )

  // After mount, check if already in viewport (e.g. client-side navigation).
  // Skip the fade-in animation so above-fold content appears instantly.
  useEffect(() => {
    const el = elementRef.current
    if (el) {
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setSkipAnimation(true)
      }
    }
  }, [])

  if (reducedMotion) {
    return <div className={className}>{children}</div>
  }

  const isVisible = skipAnimation || inView

  return (
    <div
      ref={setRefs}
      className={cn(
        skipAnimation ? '' : 'transition-[opacity,transform] duration-700 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className
      )}
    >
      {children}
    </div>
  )
}
