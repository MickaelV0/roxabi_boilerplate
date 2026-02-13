import { cn } from '@repo/ui'
import { useEffect, useRef, useState } from 'react'
import { useIntersectionVisibility } from '@/components/presentation/hooks'

type StatCounterProps = {
  value: number
  label: string
  suffix?: string
  className?: string
}

export function StatCounter({ value, label, suffix = '', className }: StatCounterProps) {
  const { ref, isVisible } = useIntersectionVisibility<HTMLDivElement>({ threshold: 0.3 })
  const [displayValue, setDisplayValue] = useState(0)
  const hasAnimatedRef = useRef(false)

  useEffect(() => {
    if (!isVisible || hasAnimatedRef.current) return
    hasAnimatedRef.current = true

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value)
      return
    }

    const duration = 1500
    const startTime = performance.now()

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out cubic
      const eased = 1 - (1 - progress) ** 3
      setDisplayValue(Math.round(eased * value))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, isVisible])

  return (
    <div ref={ref} className={cn('text-center', className)}>
      <p className="text-5xl font-bold tracking-tight text-primary lg:text-6xl">
        {displayValue.toLocaleString()}
        {suffix}
      </p>
      <p className="mt-2 text-lg text-muted-foreground">{label}</p>
    </div>
  )
}
