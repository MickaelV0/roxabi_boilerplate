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

// Mock IntersectionObserver (passive -- keyboard tests don't need IO to fire)
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
  it('should render correct number of dots (8)', () => {
    // Arrange & Act
    render(<PresentationNav sections={sections} />)

    // Assert
    const dots = screen.getAllByRole('button')
    expect(dots).toHaveLength(8)
  })

  it('should have aria-label with section name on each dot', () => {
    // Arrange & Act
    render(<PresentationNav sections={sections} />)

    // Assert
    for (const section of sections) {
      expect(screen.getByLabelText(section.label)).toBeInTheDocument()
    }
  })

  it('should trigger scroll behavior when dot is clicked', () => {
    // Arrange
    const sectionEl = createSectionElement('setup')
    render(<PresentationNav sections={sections} />)

    // Act
    const setupDot = screen.getByLabelText('Setup')
    fireEvent.click(setupDot)

    // Assert
    expect(sectionEl.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth' })
    )
  })

  describe('keyboard navigation', () => {
    it('should scroll to next section when ArrowDown is pressed', () => {
      // Arrange
      const elements = createAllSectionElements()
      render(<PresentationNav sections={sections} />)

      // Act
      fireEvent.keyDown(document, { key: 'ArrowDown' })

      // Assert
      expect(elements[1]?.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    })

    it('should scroll to previous section when ArrowUp is pressed', () => {
      // Arrange
      const elements = createAllSectionElements()
      render(<PresentationNav sections={sections} />)

      // Act
      fireEvent.keyDown(document, { key: 'ArrowUp' })

      // Assert
      expect(elements[0]?.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    })

    it('should call onEscape callback when Escape is pressed', () => {
      // Arrange
      createAllSectionElements()
      render(<PresentationNav sections={sections} onEscape={mockOnEscape} />)

      // Act
      fireEvent.keyDown(document, { key: 'Escape' })

      // Assert
      expect(mockOnEscape).toHaveBeenCalledOnce()
    })

    it('should scroll to the correct section when number key is pressed', () => {
      // Arrange
      const elements = createAllSectionElements()
      render(<PresentationNav sections={sections} />)

      // Act
      fireEvent.keyDown(document, { key: '2' })

      // Assert
      expect(elements[1]?.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    })

    it('should scroll to first section when Home is pressed', () => {
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

    it('should scroll to last section when End is pressed', () => {
      // Arrange
      const elements = createAllSectionElements()
      render(<PresentationNav sections={sections} />)

      // Act
      fireEvent.keyDown(document, { key: 'End' })

      // Assert
      expect(elements[7]?.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    })

    it('should advance to next section when Space is pressed', () => {
      // Arrange
      const elements = createAllSectionElements()
      render(<PresentationNav sections={sections} />)

      // Act
      fireEvent.keyDown(document, { key: ' ' })

      // Assert
      expect(elements[1]?.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    })

    it('should advance to next section when PageDown is pressed', () => {
      // Arrange
      const elements = createAllSectionElements()
      render(<PresentationNav sections={sections} />)

      // Act
      fireEvent.keyDown(document, { key: 'PageDown' })

      // Assert
      expect(elements[1]?.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    })

    it('should scroll to previous section when PageUp is pressed', () => {
      // Arrange
      const elements = createAllSectionElements()
      render(<PresentationNav sections={sections} />)

      // Act
      fireEvent.keyDown(document, { key: 'PageUp' })

      // Assert
      expect(elements[0]?.scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    })
  })
})
