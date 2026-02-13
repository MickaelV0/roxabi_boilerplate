import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@repo/ui', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
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

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
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
  { id: 'end-to-end', label: 'End to End' },
] as const

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
    const mockScrollIntoView = vi.fn()
    const sectionEl = document.createElement('section')
    sectionEl.id = 'setup'
    sectionEl.scrollIntoView = mockScrollIntoView
    document.body.appendChild(sectionEl)

    render(<PresentationNav sections={sections} />)

    // Act — click the "Setup" dot
    const setupDot = screen.getByLabelText('Setup')
    fireEvent.click(setupDot)

    // Assert
    expect(mockScrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'smooth' }))

    // Cleanup
    document.body.removeChild(sectionEl)
  })
})
