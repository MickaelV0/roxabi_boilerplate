import { render, screen } from '@testing-library/react'
import type { FC } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Hoist mock fns so they are available inside vi.mock factories
const { mockUseTheme, mockInitialize, mockRender } = vi.hoisted(() => ({
  mockUseTheme: vi.fn(),
  mockInitialize: vi.fn(),
  mockRender: vi.fn(),
}))

vi.mock('next-themes', () => ({
  useTheme: () => mockUseTheme(),
}))

vi.mock('mermaid', () => ({
  default: {
    initialize: mockInitialize,
    render: mockRender,
  },
}))

vi.mock('dompurify', () => ({
  default: {
    sanitize: (input: string) => input,
  },
}))

function setupMocks({
  resolvedTheme = 'light',
  renderResult,
  renderError,
}: {
  resolvedTheme?: string
  renderResult?: { svg: string }
  renderError?: Error
} = {}) {
  mockUseTheme.mockReset()
  mockInitialize.mockReset()
  mockRender.mockReset()

  mockUseTheme.mockReturnValue({ resolvedTheme })

  if (renderError) {
    mockRender.mockRejectedValue(renderError)
  } else if (renderResult) {
    mockRender.mockResolvedValue(renderResult)
  } else {
    // Default: never-resolving promise to keep loading state
    mockRender.mockReturnValue(new Promise(() => {}))
  }
}

describe('Mermaid', () => {
  // Re-import component for each test to reset module-level state
  // (lastInitializedTheme) and prevent stale async operations from leaking
  let Mermaid: FC<{ chart: string }>

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('./mermaid')
    Mermaid = mod.Mermaid
  })

  it('should show "Loading diagram..." while async render is in flight', () => {
    // Arrange
    setupMocks()

    // Act
    render(<Mermaid chart="graph TD; A-->B" />)

    // Assert
    expect(screen.getByText('Loading diagram...')).toBeInTheDocument()
  })

  it('should render SVG content when mermaid resolves successfully', async () => {
    // Arrange
    const svgOutput = '<svg><text>Hello Mermaid</text></svg>'
    setupMocks({ renderResult: { svg: svgOutput } })

    // Act
    render(<Mermaid chart="graph TD; A-->B" />)

    // Assert -- wait for the async mermaid.render to resolve and update state
    await vi.waitFor(() => {
      expect(screen.getByText('Hello Mermaid')).toBeInTheDocument()
    })
  })

  it('should render error role="alert" div with error message on failure', async () => {
    // Arrange
    setupMocks({ renderError: new Error('Parse error in Mermaid syntax') })

    // Act
    render(<Mermaid chart="invalid chart syntax" />)

    // Assert
    await vi.waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveTextContent('Parse error in Mermaid syntax')
    })
  })

  it('should not call mermaid.render when chart prop is empty', async () => {
    // Arrange
    setupMocks()

    // Act
    render(<Mermaid chart="" />)

    // Assert -- loading text is shown since svg is empty, but mermaid.render
    // should never have been called because the useEffect short-circuits
    expect(screen.getByText('Loading diagram...')).toBeInTheDocument()
    expect(mockRender).not.toHaveBeenCalled()
  })

  it('should initialize mermaid with dark theme when resolvedTheme is dark', async () => {
    // Arrange
    const svgOutput = '<svg><text>Dark chart</text></svg>'
    setupMocks({ resolvedTheme: 'dark', renderResult: { svg: svgOutput } })

    // Act
    render(<Mermaid chart="graph TD; A-->B" />)

    // Assert
    await vi.waitFor(() => {
      expect(mockInitialize).toHaveBeenCalledWith(expect.objectContaining({ theme: 'dark' }))
    })
  })

  it('should initialize mermaid with default theme when resolvedTheme is light', async () => {
    // Arrange
    const svgOutput = '<svg><text>Light chart</text></svg>'
    setupMocks({ resolvedTheme: 'light', renderResult: { svg: svgOutput } })

    // Act
    render(<Mermaid chart="graph TD; A-->B" />)

    // Assert
    await vi.waitFor(() => {
      expect(mockInitialize).toHaveBeenCalledWith(expect.objectContaining({ theme: 'default' }))
    })
  })
})
