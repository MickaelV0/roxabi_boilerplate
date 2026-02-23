'use client'

import type { RefObject } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

type Section = {
  id: string
  label: string
}

type PresentationNavProps = {
  sections: ReadonlyArray<Section>
  onEscape?: () => void
  scrollContainerRef?: RefObject<HTMLDivElement | null>
}

function useActiveSection(
  sections: ReadonlyArray<Section>,
  scrollContainerRef?: RefObject<HTMLDivElement | null>
) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeIndexRef = useRef(activeIndex)
  activeIndexRef.current = activeIndex

  useEffect(() => {
    const container = scrollContainerRef?.current ?? null

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = sections.findIndex((s) => s.id === entry.target.id)
            if (index !== -1) setActiveIndex(index)
          }
        }
      },
      { threshold: 0.5, root: container }
    )

    for (const section of sections) {
      const el = document.getElementById(section.id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [sections, scrollContainerRef])

  const scrollToSection = useCallback(
    (index: number) => {
      const section = sections[index]
      if (!section) return
      const el = document.getElementById(section.id)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    [sections]
  )

  return { activeIndex, activeIndexRef, scrollToSection }
}

function isFormElement(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

function useKeyboardNavigation(
  sections: ReadonlyArray<Section>,
  activeIndexRef: { current: number },
  scrollToSection: (index: number) => void,
  onEscape?: () => void
) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isFormElement(e.target)) return

      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
        case ' ': {
          e.preventDefault()
          scrollToSection(Math.min(activeIndexRef.current + 1, sections.length - 1))
          break
        }
        case 'ArrowUp':
        case 'PageUp': {
          e.preventDefault()
          scrollToSection(Math.max(activeIndexRef.current - 1, 0))
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
          onEscape?.()
          break
        }
        default: {
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
  }, [sections, scrollToSection, onEscape, activeIndexRef])
}

export function PresentationNav({ sections, onEscape, scrollContainerRef }: PresentationNavProps) {
  const { activeIndex, activeIndexRef, scrollToSection } = useActiveSection(
    sections,
    scrollContainerRef
  )

  useKeyboardNavigation(sections, activeIndexRef, scrollToSection, onEscape)

  const progress = sections.length > 1 ? (activeIndex / (sections.length - 1)) * 100 : 0

  return (
    <>
      <div
        className="fixed top-0 left-0 z-50 h-0.5 bg-primary transition-[width] duration-500 ease-out"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={activeIndex + 1}
        aria-valuemin={1}
        aria-valuemax={sections.length}
        aria-label={`Section ${activeIndex + 1} of ${sections.length}`}
      />

      <nav
        className="fixed right-6 top-[55%] z-50 hidden -translate-y-1/2 md:flex flex-col items-center gap-3"
        aria-label="Presentation sections"
      >
        {sections.map((section, index) => {
          const isActive = index === activeIndex
          return (
            <button
              key={section.id}
              type="button"
              aria-label={section.label}
              aria-current={isActive ? 'true' : undefined}
              title={section.label}
              onClick={() => scrollToSection(index)}
              className={cn(
                'group relative size-3 rounded-full border-2 transition-all duration-300',
                isActive
                  ? 'border-primary bg-primary scale-125'
                  : 'border-muted-foreground/40 bg-transparent hover:border-primary/60 hover:scale-110'
              )}
            >
              <span className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-md opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 border border-border">
                {section.label}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
