import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './HoverCard'

describe('HoverCard', () => {
  it('should render trigger', () => {
    // Arrange & Act
    render(
      <HoverCard>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent>Card content</HoverCardContent>
      </HoverCard>
    )

    // Assert
    expect(screen.getByText('Hover me')).toBeInTheDocument()
  })

  it('should have data-slot on trigger when rendered', () => {
    // Arrange & Act
    render(
      <HoverCard>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent>Card content</HoverCardContent>
      </HoverCard>
    )

    // Assert
    expect(screen.getByText('Hover me')).toHaveAttribute('data-slot', 'hover-card-trigger')
  })

  it('should not show content by default', () => {
    // Arrange & Act
    render(
      <HoverCard>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent>Card content</HoverCardContent>
      </HoverCard>
    )

    // Assert
    expect(screen.queryByText('Card content')).not.toBeInTheDocument()
  })

  it('should show content when open is true (controlled)', () => {
    // Arrange & Act
    render(
      <HoverCard open>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent>Card content</HoverCardContent>
      </HoverCard>
    )

    // Assert
    expect(screen.getByText('Card content')).toBeVisible()
  })

  it('should apply custom className to content when provided', () => {
    // Arrange & Act
    render(
      <HoverCard open>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent className="custom-class">Card content</HoverCardContent>
      </HoverCard>
    )

    // Assert
    const content = document.querySelector('[data-slot="hover-card-content"]')
    expect(content).toHaveClass('custom-class')
  })
})
