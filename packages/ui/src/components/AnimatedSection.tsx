import type { ReactNode } from 'react'

import { useInView } from 'react-intersection-observer'

import { cn } from '@/lib/utils'

export function AnimatedSection({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px',
    triggerOnce: true,
  })

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
