import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './Tooltip'

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

function renderTooltip({ open }: { open?: boolean } = {}) {
  return render(
    <TooltipProvider>
      <Tooltip open={open}>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent>Tooltip text</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

describe('Tooltip', () => {
  it('should render trigger', () => {
    // Arrange & Act
    renderTooltip()

    // Assert
    expect(screen.getByText('Hover me')).toBeInTheDocument()
  })

  it('should have data-slot on trigger when rendered', () => {
    // Arrange & Act
    renderTooltip()

    // Assert
    expect(screen.getByText('Hover me')).toHaveAttribute('data-slot', 'tooltip-trigger')
  })

  it('should not show content by default', () => {
    // Arrange & Act
    renderTooltip()

    // Assert
    expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument()
  })

  it('should show content when open is true (controlled)', () => {
    // Arrange & Act
    renderTooltip({ open: true })

    // Assert — Radix renders tooltip text in both visible content and an sr-only span
    const elements = screen.getAllByText('Tooltip text')
    expect(elements.length).toBeGreaterThanOrEqual(1)
    expect(elements[0]).toBeInTheDocument()
  })

  it('should have data-slot on content when visible', () => {
    // Arrange & Act
    renderTooltip({ open: true })

    // Assert
    const content = document.querySelector('[data-slot="tooltip-content"]')
    expect(content).toBeInTheDocument()
  })

  it('should apply custom className to content when provided', () => {
    // Arrange & Act
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Hover</TooltipTrigger>
          <TooltipContent className="custom-class">Tip</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )

    // Assert
    const content = document.querySelector('[data-slot="tooltip-content"]')
    expect(content).toHaveClass('custom-class')
  })

  it('should render arrow by default', () => {
    // Arrange & Act
    renderTooltip({ open: true })

    // Assert — TooltipPrimitive.Arrow does not expose a data attribute;
    // CSS class assertion is the only way to verify the arrow is present
    expect(document.querySelector('.fill-foreground')).toBeInTheDocument()
  })

  it('should hide arrow when hideArrow is true', () => {
    // Arrange & Act
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Hover</TooltipTrigger>
          <TooltipContent hideArrow>Tip</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )

    // Assert
    expect(document.querySelector('.fill-foreground')).not.toBeInTheDocument()
  })
})
