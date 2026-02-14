import { cn } from '@repo/ui'
import type { ReactNode } from 'react'

type SectionContainerProps = {
  id: string
  children: ReactNode
  className?: string
}

export function SectionContainer({ id, children, className }: SectionContainerProps) {
  return (
    <section
      id={id}
      className={cn(
        // min-h-screen is a fallback for browsers that don't support dvh
        'min-h-screen min-h-dvh snap-start flex flex-col justify-center px-6 py-16 lg:px-16 relative',
        className
      )}
    >
      {children}
    </section>
  )
}
