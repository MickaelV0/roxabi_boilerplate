import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Mock @repo/ui -- provide cn and useInView
const mockUseInView = vi.fn()
vi.mock('@repo/ui', () => ({
  cn: (...classes: Array<string | undefined | false>) => classes.filter(Boolean).join(' '),
  useInView: (...args: unknown[]) => mockUseInView(...args),
}))

// Mock shiki -- codeToHtml returns a resolved promise by default
const mockCodeToHtml = vi.fn()
vi.mock('@/lib/shiki', () => ({
  codeToHtml: (...args: unknown[]) => mockCodeToHtml(...args),
}))

import { CodeBlock } from './CodeBlock'

function setupMocks({
  inView = false,
  codeToHtmlResult,
}: {
  inView?: boolean
  codeToHtmlResult?: unknown
} = {}) {
  mockUseInView.mockClear()
  mockCodeToHtml.mockClear()
  mockUseInView.mockReturnValue({ ref: vi.fn(), inView })
  if (codeToHtmlResult === undefined) {
    mockCodeToHtml.mockReturnValue(new Promise(() => {}))
  } else if (codeToHtmlResult instanceof Error) {
    mockCodeToHtml.mockRejectedValue(codeToHtmlResult)
  } else {
    mockCodeToHtml.mockResolvedValue(codeToHtmlResult)
  }
}

describe('CodeBlock', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render children as plain code before Shiki loads', () => {
    // Arrange
    setupMocks()
    const code = 'console.log("hello")'

    // Act
    render(<CodeBlock>{code}</CodeBlock>)

    // Assert
    const codeElement = screen.getByText(code)
    expect(codeElement).toBeInTheDocument()
    expect(codeElement.tagName.toLowerCase()).toBe('code')
  })

  it('should render terminal header dots', () => {
    // Arrange & Act
    setupMocks()
    const { container } = render(<CodeBlock>echo hi</CodeBlock>)

    // Assert -- terminal dots are purely decorative divs with no semantic role;
    // CSS class selectors are the only reliable way to verify their presence.
    const dots = container.querySelectorAll('.rounded-full')
    expect(dots).toHaveLength(3)
    expect(dots[0]).toHaveClass('bg-red-500/60')
    expect(dots[1]).toHaveClass('bg-yellow-500/60')
    expect(dots[2]).toHaveClass('bg-green-500/60')
  })

  it('should render Shiki highlighted HTML when codeToHtml resolves', async () => {
    // Arrange -- Shiki only loads when inView is true
    const highlightedOutput = '<pre><code class="shiki">highlighted</code></pre>'
    setupMocks({ inView: true, codeToHtmlResult: highlightedOutput })

    // Act
    render(<CodeBlock>some code</CodeBlock>)

    // Assert -- Shiki output is injected via dangerouslySetInnerHTML, so we use
    // getByText to verify the rendered text content is present in the DOM.
    await vi.waitFor(() => {
      expect(screen.getByText('highlighted')).toBeInTheDocument()
    })
  })

  it('should call codeToHtml with dual themes', async () => {
    // Arrange -- Shiki only loads when inView is true
    setupMocks({ inView: true, codeToHtmlResult: '<pre>highlighted</pre>' })

    // Act
    render(<CodeBlock language="typescript">const x = 1</CodeBlock>)

    // Assert
    await vi.waitFor(() => {
      expect(mockCodeToHtml).toHaveBeenCalledWith('const x = 1', {
        lang: 'typescript',
        themes: {
          light: 'github-light',
          dark: 'github-dark',
        },
      })
    })
  })

  it('should apply typing animation class when typing is true and element is in view', async () => {
    // Arrange
    setupMocks({ inView: true })

    // Act
    render(<CodeBlock typing>echo hello</CodeBlock>)

    // Assert -- animate-typing-reveal is a custom animation class that must be
    // checked via className since it has no ARIA or visual equivalent in jsdom.
    const codeElement = screen.getByText('echo hello')
    const preElement = codeElement.closest('pre')
    expect(preElement?.className).toContain('animate-typing-reveal')
  })

  it('should not apply typing animation class when typing is false', () => {
    // Arrange
    setupMocks({ inView: true })

    // Act
    render(<CodeBlock>echo hello</CodeBlock>)

    // Assert -- animation class should not be present when typing prop is false
    const codeElement = screen.getByText('echo hello')
    const preElement = codeElement.closest('pre')
    expect(preElement?.className).not.toContain('animate-typing-reveal')
  })

  it('should not apply typing animation class when element is not in view', () => {
    // Arrange
    setupMocks({ inView: false })

    // Act
    render(<CodeBlock typing>echo hello</CodeBlock>)

    // Assert -- animation class should not be applied until the element enters view
    const codeElement = screen.getByText('echo hello')
    const preElement = codeElement.closest('pre')
    expect(preElement?.className).not.toContain('animate-typing-reveal')
  })

  it('should fall back to plain code when codeToHtml rejects', async () => {
    // Arrange -- Shiki only loads when inView is true
    setupMocks({ inView: true, codeToHtmlResult: new Error('Shiki failed') })

    // Act
    render(<CodeBlock>fallback code</CodeBlock>)

    // Assert -- the plain <code> fallback should remain
    await vi.waitFor(() => {
      const codeElement = screen.getByText('fallback code')
      expect(codeElement).toBeInTheDocument()
      expect(codeElement.tagName.toLowerCase()).toBe('code')
    })
  })

  it('should apply custom className to the wrapper', () => {
    // Arrange & Act
    setupMocks()
    const { container } = render(<CodeBlock className="custom-class">echo test</CodeBlock>)

    // Assert
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should default language to bash', () => {
    // Arrange -- Shiki only loads when inView is true
    setupMocks({ inView: true, codeToHtmlResult: '<pre>highlighted</pre>' })

    // Act
    render(<CodeBlock>ls -la</CodeBlock>)

    // Assert
    expect(mockCodeToHtml).toHaveBeenCalledWith('ls -la', expect.objectContaining({ lang: 'bash' }))
  })

  it('should remove typing animation class after timer completes', () => {
    // Arrange
    vi.useFakeTimers()
    setupMocks({ inView: true })
    const code = 'echo hello'

    // Act
    render(<CodeBlock typing>{code}</CodeBlock>)

    // Assert -- animation class is present before timer fires
    const codeElement = screen.getByText(code)
    const preElement = codeElement.closest('pre')
    expect(preElement?.className).toContain('animate-typing-reveal')

    // Act -- advance past the animation duration (1 line * 300ms = 300ms),
    // wrapped in act() because the timer triggers a React state update.
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Assert -- animation class removed after typing completes
    expect(preElement?.className).not.toContain('animate-typing-reveal')
  })
})
