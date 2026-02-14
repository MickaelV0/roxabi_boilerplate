import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mockParaglideMessages } from '@/test/__mocks__/mock-messages'

mockParaglideMessages()

vi.mock('@/paraglide/runtime', () => ({
  getLocale: () => 'en',
  locales: ['en', 'fr'],
  setLocale: vi.fn(),
}))

vi.mock('@repo/ui', () => ({
  AnimatedSection: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  Badge: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
  Button: ({ children }: React.PropsWithChildren) => <button type="button">{children}</button>,
  Card: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
  DropdownMenu: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuItem: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
  PresentationNav: () => <nav aria-label="Presentation sections" />,
  StatCounter: ({ label }: { label: string }) => <div>{label}</div>,
  useInView: () => ({ ref: () => {}, inView: true }),
  useReducedMotion: () => false,
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

// Mock IntersectionObserver (passive — no callback needed for page render tests)
import { setupIntersectionObserverMock } from '@/test/mocks/intersection-observer'

setupIntersectionObserverMock('passive')

// Mock requestAnimationFrame
vi.stubGlobal(
  'requestAnimationFrame',
  vi.fn((cb: FrameRequestCallback) => {
    cb(performance.now())
    return 1
  })
)
vi.stubGlobal('cancelAnimationFrame', vi.fn())

// Mock TanStack Router hooks used by the page component
vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => () => ({}),
  useNavigate: () => vi.fn(),
  Link: ({ children }: React.PropsWithChildren) => children,
}))

// Import the page component — the default export from the route module
// The actual component is the function composed inside the route, which we
// extract here. If the route file exports the component separately (e.g.,
// as a named export), adjust the import accordingly.
import { ClaudeCodePresentation } from './claude-code'

const EXPECTED_SECTION_IDS = [
  'intro',
  'building-blocks',
  'specialization',
  'dev-process',
  'agent-teams',
  'end-to-end',
  'closing',
]

describe('ClaudeCodePresentation page', () => {
  it('renders all 6 sections with correct ids', () => {
    // Arrange & Act
    render(<ClaudeCodePresentation />)

    // Assert — each section id should be present in the document
    for (const sectionId of EXPECTED_SECTION_IDS) {
      const section = document.getElementById(sectionId)
      expect(section, `Section with id "${sectionId}" should exist`).toBeInTheDocument()
    }
  })

  it('renders key section headings', () => {
    // Arrange & Act
    render(<ClaudeCodePresentation />)

    // Assert — mock returns key names (e.g. "talk_intro_title")
    expect(screen.getByRole('heading', { name: /talk_intro_title/i })).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: /talk_blocks_title/i })).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: /talk_spec_title/i })).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: /talk_teams_title/i })).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: /talk_e2e_title/i })).toBeInTheDocument()
  })
})
