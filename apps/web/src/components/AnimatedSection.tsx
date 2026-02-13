import { cn } from '@repo/ui'
import type { ReactNode } from 'react'
import { useIntersectionVisibility } from '@/components/presentation/hooks'

export function AnimatedSection({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const { ref, isVisible } = useIntersectionVisibility<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px',
  })

  return (
    <div
      ref={ref}
      className={cn(
        'transition-[opacity,transform] duration-700 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className
      )}
    >
      {children}
    </div>
  )
}
