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
  it('renders trigger', () => {
    renderTooltip()
    expect(screen.getByText('Hover me')).toBeInTheDocument()
  })

  it('has data-slot on trigger', () => {
    renderTooltip()
    expect(screen.getByText('Hover me')).toHaveAttribute('data-slot', 'tooltip-trigger')
  })

  it('does not show content by default', () => {
    renderTooltip()
    expect(screen.queryByText('Tooltip text')).not.toBeInTheDocument()
  })

  it('shows content when open is true (controlled)', () => {
    renderTooltip({ open: true })
    // Radix renders tooltip text in both visible content and an sr-only span
    const elements = screen.getAllByText('Tooltip text')
    expect(elements.length).toBeGreaterThanOrEqual(1)
    expect(elements[0]).toBeInTheDocument()
  })

  it('has data-slot on content when visible', () => {
    renderTooltip({ open: true })
    const content = document.querySelector('[data-slot="tooltip-content"]')
    expect(content).toBeInTheDocument()
  })

  it('applies custom className to content', () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Hover</TooltipTrigger>
          <TooltipContent className="custom-class">Tip</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    const content = document.querySelector('[data-slot="tooltip-content"]')
    expect(content).toHaveClass('custom-class')
  })
})
