'use client'

import type { ReactNode } from 'react'

import { useInView } from 'react-intersection-observer'

import { useReducedMotion } from '@/lib/useReducedMotion'
import { cn } from '@/lib/utils'

type AnimatedSectionProps = {
  children: ReactNode
  className?: string
}

export function AnimatedSection({ children, className = '' }: AnimatedSectionProps) {
  const reducedMotion = useReducedMotion()
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px',
    triggerOnce: true,
  })

  if (reducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      ref={ref}
      className={cn(
        'transition-[opacity,transform] duration-700 ease-out',
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className
      )}
    >
      {children}
    </div>
  )
}
