import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './HoverCard'

describe('HoverCard', () => {
  it('renders trigger', () => {
    render(
      <HoverCard>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent>Card content</HoverCardContent>
      </HoverCard>
    )
    expect(screen.getByText('Hover me')).toBeInTheDocument()
  })

  it('has data-slot on trigger', () => {
    render(
      <HoverCard>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent>Card content</HoverCardContent>
      </HoverCard>
    )
    expect(screen.getByText('Hover me')).toHaveAttribute('data-slot', 'hover-card-trigger')
  })

  it('does not show content by default', () => {
    render(
      <HoverCard>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent>Card content</HoverCardContent>
      </HoverCard>
    )
    expect(screen.queryByText('Card content')).not.toBeInTheDocument()
  })

  it('shows content when open is true (controlled)', () => {
    render(
      <HoverCard open>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent>Card content</HoverCardContent>
      </HoverCard>
    )
    expect(screen.getByText('Card content')).toBeVisible()
  })

  it('applies custom className to content', () => {
    render(
      <HoverCard open>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent className="custom-class">Card content</HoverCardContent>
      </HoverCard>
    )
    const content = document.querySelector('[data-slot="hover-card-content"]')
    expect(content).toHaveClass('custom-class')
  })
})
