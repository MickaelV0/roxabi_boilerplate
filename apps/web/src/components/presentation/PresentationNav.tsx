import { cn } from '@repo/ui'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'

type Section = {
  id: string
  label: string
}

type PresentationNavProps = {
  sections: ReadonlyArray<Section>
}

export function PresentationNav({ sections }: PresentationNavProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const navigate = useNavigate()

  // Track current section via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = []

    for (const [index, section] of sections.entries()) {
      const el = document.getElementById(section.id)
      if (!el) continue

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            setActiveIndex(index)
          }
        },
        { threshold: 0.5 }
      )

      observer.observe(el)
      observers.push(observer)
    }

    return () => {
      for (const observer of observers) {
        observer.disconnect()
      }
    }
  }, [sections])

  const scrollToSection = useCallback(
    (index: number) => {
      const section = sections[index]
      if (!section) return
      const el = document.getElementById(section.id)
      el?.scrollIntoView({ behavior: 'smooth' })
    },
    [sections]
  )

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept when user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown': {
          e.preventDefault()
          const nextIndex = Math.min(activeIndex + 1, sections.length - 1)
          scrollToSection(nextIndex)
          break
        }
        case ' ': {
          // Space scrolls to next section (like presentation software)
          e.preventDefault()
          const nextIdx = Math.min(activeIndex + 1, sections.length - 1)
          scrollToSection(nextIdx)
          break
        }
        case 'ArrowUp':
        case 'PageUp': {
          e.preventDefault()
          const prevIndex = Math.max(activeIndex - 1, 0)
          scrollToSection(prevIndex)
          break
        }
        case 'Home': {
          e.preventDefault()
          scrollToSection(0)
          break
        }
        case 'End': {
          e.preventDefault()
          scrollToSection(sections.length - 1)
          break
        }
        case 'Escape': {
          e.preventDefault()
          navigate({ to: '/' })
          break
        }
        default: {
          // Number keys 1-7
          const num = Number.parseInt(e.key, 10)
          if (num >= 1 && num <= sections.length) {
            e.preventDefault()
            scrollToSection(num - 1)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeIndex, sections, scrollToSection, navigate])

  return (
    <nav
      className="fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 md:flex flex-col items-center gap-3"
      aria-label="Presentation sections"
    >
      {sections.map((section, index) => (
        <button
          key={section.id}
          type="button"
          aria-label={section.label}
          title={section.label}
          onClick={() => scrollToSection(index)}
          className={cn(
            'group relative h-3 w-3 rounded-full border-2 transition-all duration-300',
            index === activeIndex
              ? 'border-primary bg-primary scale-125'
              : 'border-muted-foreground/40 bg-transparent hover:border-primary/60 hover:scale-110'
          )}
        >
          {/* Tooltip */}
          <span className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100 border border-border">
            {section.label}
          </span>
        </button>
      ))}
    </nav>
  )
}
