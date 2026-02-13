import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock @repo/ui — provide cn and useInView
const mockUseInView = vi.fn()
vi.mock('@repo/ui', () => ({
  cn: (...classes: Array<string | undefined | false>) => classes.filter(Boolean).join(' '),
  useInView: (...args: unknown[]) => mockUseInView(...args),
}))

// Mock shiki — codeToHtml returns a resolved promise by default
const mockCodeToHtml = vi.fn()
vi.mock('shiki', () => ({
  codeToHtml: (...args: unknown[]) => mockCodeToHtml(...args),
}))

import { CodeBlock } from './CodeBlock'

describe('CodeBlock', () => {
  beforeEach(() => {
    // Default: not in view, shiki never resolves (stays pending)
    mockUseInView.mockReturnValue({ ref: vi.fn(), inView: false })
    mockCodeToHtml.mockReturnValue(new Promise(() => {}))
  })

  it('should render children as plain code before Shiki loads', () => {
    // Arrange
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
    const { container } = render(<CodeBlock>echo hi</CodeBlock>)

    // Assert
    const dots = container.querySelectorAll('.rounded-full')
    expect(dots).toHaveLength(3)
    expect(dots[0]).toHaveClass('bg-red-500/60')
    expect(dots[1]).toHaveClass('bg-yellow-500/60')
    expect(dots[2]).toHaveClass('bg-green-500/60')
  })

  it('should render Shiki highlighted HTML when codeToHtml resolves', async () => {
    // Arrange
    const highlightedOutput = '<pre><code class="shiki">highlighted</code></pre>'
    mockCodeToHtml.mockResolvedValue(highlightedOutput)

    // Act
    const { container } = render(<CodeBlock>some code</CodeBlock>)

    // Assert
    await vi.waitFor(() => {
      const highlightedDiv = container.querySelector('[class*="font-mono"]')
      expect(highlightedDiv?.innerHTML).toBe(highlightedOutput)
    })
  })

  it('should call codeToHtml with dual themes', async () => {
    // Arrange
    mockCodeToHtml.mockResolvedValue('<pre>highlighted</pre>')

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
    mockUseInView.mockReturnValue({ ref: vi.fn(), inView: true })
    // Keep shiki pending so we test the plain <pre> fallback path
    mockCodeToHtml.mockReturnValue(new Promise(() => {}))

    // Act
    const { container } = render(<CodeBlock typing>echo hello</CodeBlock>)

    // Assert
    const preElement = container.querySelector('pre')
    expect(preElement?.className).toContain('animate-typing-reveal')
  })

  it('should not apply typing animation class when typing is false', () => {
    // Arrange
    mockUseInView.mockReturnValue({ ref: vi.fn(), inView: true })
    mockCodeToHtml.mockReturnValue(new Promise(() => {}))

    // Act
    const { container } = render(<CodeBlock>echo hello</CodeBlock>)

    // Assert
    const preElement = container.querySelector('pre')
    expect(preElement?.className).not.toContain('animate-typing-reveal')
  })

  it('should not apply typing animation class when element is not in view', () => {
    // Arrange
    mockUseInView.mockReturnValue({ ref: vi.fn(), inView: false })
    mockCodeToHtml.mockReturnValue(new Promise(() => {}))

    // Act
    const { container } = render(<CodeBlock typing>echo hello</CodeBlock>)

    // Assert
    const preElement = container.querySelector('pre')
    expect(preElement?.className).not.toContain('animate-typing-reveal')
  })

  it('should fall back to plain code when codeToHtml rejects', async () => {
    // Arrange
    mockCodeToHtml.mockRejectedValue(new Error('Shiki failed'))

    // Act
    render(<CodeBlock>fallback code</CodeBlock>)

    // Assert — the plain <code> fallback should remain
    await vi.waitFor(() => {
      const codeElement = screen.getByText('fallback code')
      expect(codeElement).toBeInTheDocument()
      expect(codeElement.tagName.toLowerCase()).toBe('code')
    })
  })

  it('should apply custom className to the wrapper', () => {
    // Arrange & Act
    const { container } = render(<CodeBlock className="custom-class">echo test</CodeBlock>)

    // Assert
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should default language to bash', () => {
    // Arrange
    mockCodeToHtml.mockResolvedValue('<pre>highlighted</pre>')

    // Act
    render(<CodeBlock>ls -la</CodeBlock>)

    // Assert
    expect(mockCodeToHtml).toHaveBeenCalledWith('ls -la', expect.objectContaining({ lang: 'bash' }))
  })
})
