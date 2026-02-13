import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@repo/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

// Mock TanStack Router — capture navigate calls
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

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
import { setupIntersectionObserverMock } from '@/test/mocks/intersection-observer'

setupIntersectionObserverMock('passive')

import { PresentationNav } from './PresentationNav'

const sections = [
  { id: 'intro', label: 'Introduction' },
  { id: 'setup', label: 'Setup' },
  { id: 'building-blocks', label: 'Building Blocks' },
  { id: 'dev-process', label: 'Dev Process' },
  { id: 'agent-teams', label: 'Agent Teams' },
  { id: 'test-review', label: 'Test & Review' },
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

afterEach(() => {
  // Clean up all DOM elements added during tests
  for (const el of testSectionElements) {
    if (el.parentNode) {
      el.parentNode.removeChild(el)
    }
  }
  testSectionElements = []
  mockNavigate.mockClear()
})

describe('PresentationNav', () => {
  it('renders correct number of dots (7)', () => {
    // Arrange & Act
    render(<PresentationNav sections={sections} />)

    // Assert — one dot per section
    const dots = screen.getAllByRole('button')
    expect(dots).toHaveLength(7)
  })

  it('each dot has aria-label with section name', () => {
    // Arrange & Act
    render(<PresentationNav sections={sections} />)

    // Assert
    for (const section of sections) {
      expect(screen.getByLabelText(section.label)).toBeInTheDocument()
    }
  })

  it('click on dot triggers scroll behavior', () => {
    // Arrange
    const sectionEl = createSectionElement('setup')

    render(<PresentationNav sections={sections} />)

    // Act — click the "Setup" dot
    const setupDot = screen.getByLabelText('Setup')
    fireEvent.click(setupDot)

    // Assert
    expect(sectionEl.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth' })
    )
  })

  describe('keyboard navigation', () => {
    it('ArrowDown scrolls to next section', () => {
      // Arrange
      const elements = createAllSectionElements()
      render(<PresentationNav sections={sections} />)

      // Act — activeIndex starts at 0, ArrowDown should scroll to index 1
      fireEvent.keyDown(document, { key: 'ArrowDown' })

      // Assert
      expect(elements[1]?.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    })

    it('ArrowUp scrolls to previous section', () => {
      // Arrange
      const elements = createAllSectionElements()
      render(<PresentationNav sections={sections} />)

      // Act — activeIndex starts at 0, ArrowUp should clamp to 0
      fireEvent.keyDown(document, { key: 'ArrowUp' })

      // Assert — scrolls to index 0 (clamped)
      expect(elements[0]?.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    })

    it('Escape calls navigate to go back', () => {
      // Arrange
      createAllSectionElements()
      render(<PresentationNav sections={sections} />)

      // Act
      fireEvent.keyDown(document, { key: 'Escape' })

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/' })
    })

    it('number key scrolls to the correct section', () => {
      // Arrange
      const elements = createAllSectionElements()
      render(<PresentationNav sections={sections} />)

      // Act — press '2' to go to section index 1 (Setup)
      fireEvent.keyDown(document, { key: '2' })

      // Assert
      expect(elements[1]?.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    })

    it('Home scrolls to first section', () => {
      // Arrange
      const elements = createAllSectionElements()
      render(<PresentationNav sections={sections} />)

      // Act
      fireEvent.keyDown(document, { key: 'Home' })

      // Assert
      expect(elements[0]?.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    })

    it('End scrolls to last section', () => {
      // Arrange
      const elements = createAllSectionElements()
      render(<PresentationNav sections={sections} />)

      // Act
      fireEvent.keyDown(document, { key: 'End' })

      // Assert
      expect(elements[6]?.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    })
  })
})
