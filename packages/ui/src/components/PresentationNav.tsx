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
  syncHash?: boolean
}

function useIntersectionObserver(
  sectionIdsRef: RefObject<string[]>,
  scrollContainerRef: RefObject<HTMLDivElement | null> | undefined,
  setActiveIndex: (index: number) => void,
  isScrollingRef: RefObject<boolean>
) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: sectionIdsRef and isScrollingRef are stable refs — reconnecting on .current changes would defeat the purpose of using refs
  useEffect(() => {
    const container = scrollContainerRef?.current ?? null

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = sectionIdsRef.current.indexOf(entry.target.id)
            if (index !== -1) setActiveIndex(index)
          }
        }
      },
      { threshold: 0.5, root: container }
    )

    for (const id of sectionIdsRef.current) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
    // Only reconnect when the scroll container changes, not on every render
  }, [scrollContainerRef])
}

function useScrollToSection(
  sections: ReadonlyArray<Section>,
  setActiveIndex: (index: number) => void,
  isScrollingRef: RefObject<boolean>
) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: setActiveIndex is stable (from useState); isScrollingRef is a stable ref — neither needs to be in deps
  return useCallback(
    (index: number) => {
      const section = sections[index]
      if (!section) return
      const el = document.getElementById(section.id)
      if (!el) return

      // Suppress observer during programmatic scroll
      isScrollingRef.current = true
      setActiveIndex(index)

      el.scrollIntoView({ behavior: 'smooth', block: 'start' })

      // Release guard after scroll settles
      setTimeout(() => {
        isScrollingRef.current = false
      }, 800)
    },
    [sections]
  )
}

function useActiveSection(
  sections: ReadonlyArray<Section>,
  scrollContainerRef?: RefObject<HTMLDivElement | null>,
  syncHash?: boolean
) {
  const [activeIndex, setActiveIndex] = useState(() => {
    if (!syncHash || typeof window === 'undefined') return 0
    const hash = window.location.hash.slice(1)
    if (!hash) return 0
    const idx = sections.findIndex((s) => s.id === hash)
    return idx !== -1 ? idx : 0
  })
  const activeIndexRef = useRef(activeIndex)
  activeIndexRef.current = activeIndex
  // Guard: suppress observer updates during programmatic scroll
  const isScrollingRef = useRef(false)
  // Stable section IDs for observer — avoids reconnecting on label changes
  const sectionIdsRef = useRef(sections.map((s) => s.id))
  sectionIdsRef.current = sections.map((s) => s.id)

  // Sync hash → URL when active section changes (debounced)
  useEffect(() => {
    if (!syncHash) return
    const section = sections[activeIndex]
    if (!section) return
    const newHash = `#${section.id}`
    if (window.location.hash !== newHash) {
      const timer = setTimeout(() => {
        window.history.replaceState(null, '', newHash)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [activeIndex, sections, syncHash])

  // Scroll to hash section on mount
  useEffect(() => {
    if (!syncHash) return
    const hash = window.location.hash.slice(1)
    if (!hash) return
    const el = document.getElementById(hash)
    if (el) {
      requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }))
    }
  }, [syncHash])

  useIntersectionObserver(sectionIdsRef, scrollContainerRef, setActiveIndex, isScrollingRef)

  const scrollToSection = useScrollToSection(sections, setActiveIndex, isScrollingRef)

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

// Keys right of '9' on QWERTY → sections 10-12
const EXTENDED_KEY_MAP: Record<string, number> = { '0': 9, '-': 10, '=': 11 }

function resolveKeyIndex(key: string, sectionCount: number): number | null {
  const num = Number.parseInt(key, 10)
  if (num >= 1 && num <= sectionCount) return num - 1
  const mapped = EXTENDED_KEY_MAP[key]
  if (mapped != null && mapped < sectionCount) return mapped
  return null
}

function resolveNavAction(
  key: string,
  activeIndex: number,
  sectionCount: number
): { type: 'scroll'; index: number } | { type: 'escape' } | null {
  switch (key) {
    case 'ArrowDown':
    case 'PageDown':
    case ' ':
      return { type: 'scroll', index: Math.min(activeIndex + 1, sectionCount - 1) }
    case 'ArrowUp':
    case 'PageUp':
      return { type: 'scroll', index: Math.max(activeIndex - 1, 0) }
    case 'Home':
      return { type: 'scroll', index: 0 }
    case 'End':
      return { type: 'scroll', index: sectionCount - 1 }
    case 'Escape':
      return { type: 'escape' }
    default: {
      const index = resolveKeyIndex(key, sectionCount)
      return index != null ? { type: 'scroll', index } : null
    }
  }
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
      const action = resolveNavAction(e.key, activeIndexRef.current, sections.length)
      if (!action) return
      e.preventDefault()
      if (action.type === 'escape') onEscape?.()
      else scrollToSection(action.index)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sections, scrollToSection, onEscape, activeIndexRef])
}

export function PresentationNav({
  sections,
  onEscape,
  scrollContainerRef,
  syncHash,
}: PresentationNavProps) {
  const { activeIndex, activeIndexRef, scrollToSection } = useActiveSection(
    sections,
    scrollContainerRef,
    syncHash
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
