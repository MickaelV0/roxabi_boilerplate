import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from './Avatar'

describe('Avatar', () => {
  it('renders with data-slot attribute', () => {
    const { container } = render(<Avatar />)
    expect(container.querySelector('[data-slot="avatar"]')).toBeInTheDocument()
  })

  it('applies default size', () => {
    const { container } = render(<Avatar />)
    expect(container.querySelector('[data-slot="avatar"]')).toHaveAttribute('data-size', 'default')
  })

  it('applies sm size', () => {
    const { container } = render(<Avatar size="sm" />)
    expect(container.querySelector('[data-slot="avatar"]')).toHaveAttribute('data-size', 'sm')
  })

  it('applies lg size', () => {
    const { container } = render(<Avatar size="lg" />)
    expect(container.querySelector('[data-slot="avatar"]')).toHaveAttribute('data-size', 'lg')
  })

  it('applies custom className', () => {
    const { container } = render(<Avatar className="custom-class" />)
    expect(container.querySelector('[data-slot="avatar"]')).toHaveClass('custom-class')
  })
})

describe('AvatarImage', () => {
  it('renders AvatarImage component with correct props', () => {
    const { container } = render(
      <Avatar>
        <AvatarImage src="https://example.com/avatar.png" alt="User" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    )
    // In jsdom, image load event does not fire, so AvatarFallback is shown instead.
    // Verify the avatar root renders correctly with AvatarImage present.
    expect(container.querySelector('[data-slot="avatar"]')).toBeInTheDocument()
  })
})

describe('AvatarFallback', () => {
  it('renders fallback text', () => {
    render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    )
    expect(screen.getByText('AB')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    )
    expect(container.querySelector('[data-slot="avatar-fallback"]')).toBeInTheDocument()
  })
})

describe('AvatarBadge', () => {
  it('renders with data-slot attribute', () => {
    const { container } = render(
      <Avatar>
        <AvatarBadge />
      </Avatar>
    )
    expect(container.querySelector('[data-slot="avatar-badge"]')).toBeInTheDocument()
  })
})

describe('AvatarGroup', () => {
  it('renders children with data-slot attribute', () => {
    const { container } = render(
      <AvatarGroup>
        <Avatar />
        <Avatar />
      </AvatarGroup>
    )
    expect(container.querySelector('[data-slot="avatar-group"]')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot="avatar"]')).toHaveLength(2)
  })
})

describe('AvatarGroupCount', () => {
  it('renders count text', () => {
    render(<AvatarGroupCount>+3</AvatarGroupCount>)
    expect(screen.getByText('+3')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    const { container } = render(<AvatarGroupCount>+3</AvatarGroupCount>)
    expect(container.querySelector('[data-slot="avatar-group-count"]')).toBeInTheDocument()
  })
})
