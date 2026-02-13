import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver (passive — keyboard tests don't need IO to fire)
class MockIntersectionObserver {
  observe: () => void = vi.fn()
  disconnect: () => void = vi.fn()
  unobserve: () => void = vi.fn()
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

import { PresentationNav } from './PresentationNav'

const sections = [
  { id: 'intro', label: 'Introduction' },
  { id: 'setup', label: 'Setup' },
  { id: 'building-blocks', label: 'Building Blocks' },
  { id: 'dev-process', label: 'Dev Process' },
  { id: 'agent-teams', label: 'Agent Teams' },
  { id: 'test-review', label: 'Test & Review' },
  { id: 'infra-workflow', label: 'Infrastructure' },
  { id: 'end-to-end', label: 'End to End' },
] as const

// Track DOM elements created by tests so we can clean them up reliably
let testSectionElements: HTMLElement[] = []

function createSectionElement(id: string): HTMLElement {
  const el = document.createElement('section')
  el.id = id
  el.scrollIntoView = vi.fn()
  document.body.appendChild(el)
  testSectionElements.push(el)
  return el
}

function createAllSectionElements(): HTMLElement[] {
  return sections.map((s) => createSectionElement(s.id))
}

const mockOnEscape = vi.fn()

afterEach(() => {
  for (const el of testSectionElements) {
    if (el.parentNode) {
      el.parentNode.removeChild(el)
    }
  }
  testSectionElements = []
  mockOnEscape.mockClear()
})

describe('PresentationNav', () => {
  it('renders correct number of dots (8)', () => {
    render(<PresentationNav sections={sections} />)

    const dots = screen.getAllByRole('button')
    expect(dots).toHaveLength(8)
  })

  it('each dot has aria-label with section name', () => {
    render(<PresentationNav sections={sections} />)

    for (const section of sections) {
      expect(screen.getByLabelText(section.label)).toBeInTheDocument()
    }
  })

  it('click on dot triggers scroll behavior', () => {
    const sectionEl = createSectionElement('setup')

    render(<PresentationNav sections={sections} />)

    const setupDot = screen.getByLabelText('Setup')
    fireEvent.click(setupDot)

    expect(sectionEl.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth' })
    )
  })

  describe('keyboard navigation', () => {
    it('ArrowDown scrolls to next section', () => {
      const elements = createAllSectionElements()
      render(<PresentationNav sections={sections} />)

      fireEvent.keyDown(document, { key: 'ArrowDown' })

      expect(elements[1]?.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    })

    it('ArrowUp scrolls to previous section', () => {
      const elements = createAllSectionElements()
      render(<PresentationNav sections={sections} />)

      fireEvent.keyDown(document, { key: 'ArrowUp' })

      expect(elements[0]?.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    })

    it('Escape calls onEscape callback', () => {
      createAllSectionElements()
      render(<PresentationNav sections={sections} onEscape={mockOnEscape} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(mockOnEscape).toHaveBeenCalledOnce()
    })

    it('number key scrolls to the correct section', () => {
      const elements = createAllSectionElements()
      render(<PresentationNav sections={sections} />)

      fireEvent.keyDown(document, { key: '2' })

      expect(elements[1]?.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    })

    it('Home scrolls to first section', () => {
      const elements = createAllSectionElements()
      render(<PresentationNav sections={sections} />)

      fireEvent.keyDown(document, { key: 'Home' })

      expect(elements[0]?.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    })

    it('End scrolls to last section', () => {
      const elements = createAllSectionElements()
      render(<PresentationNav sections={sections} />)

      fireEvent.keyDown(document, { key: 'End' })

      expect(elements[7]?.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    })
  })
})
