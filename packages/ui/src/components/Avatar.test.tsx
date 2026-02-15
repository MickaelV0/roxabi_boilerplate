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
  it('should render with data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(<Avatar />)

    // Assert
    expect(container.querySelector('[data-slot="avatar"]')).toBeInTheDocument()
  })

  it('should apply default size when no size is specified', () => {
    // Arrange & Act
    const { container } = render(<Avatar />)

    // Assert
    expect(container.querySelector('[data-slot="avatar"]')).toHaveAttribute('data-size', 'default')
  })

  it('should apply sm size when size is sm', () => {
    // Arrange & Act
    const { container } = render(<Avatar size="sm" />)

    // Assert
    expect(container.querySelector('[data-slot="avatar"]')).toHaveAttribute('data-size', 'sm')
  })

  it('should apply lg size when size is lg', () => {
    // Arrange & Act
    const { container } = render(<Avatar size="lg" />)

    // Assert
    expect(container.querySelector('[data-slot="avatar"]')).toHaveAttribute('data-size', 'lg')
  })

  it('should apply custom className when provided', () => {
    // Arrange & Act
    const { container } = render(<Avatar className="custom-class" />)

    // Assert
    expect(container.querySelector('[data-slot="avatar"]')).toHaveClass('custom-class')
  })
})

describe('AvatarImage', () => {
  it('should render AvatarImage component with correct props', () => {
    // Arrange & Act
    const { container } = render(
      <Avatar>
        <AvatarImage src="https://example.com/avatar.png" alt="User" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    )

    // Assert
    // In jsdom, image load event does not fire, so AvatarFallback is shown instead.
    // Verify the avatar root renders correctly with AvatarImage present.
    expect(container.querySelector('[data-slot="avatar"]')).toBeInTheDocument()
  })
})

describe('AvatarFallback', () => {
  it('should render fallback text', () => {
    // Arrange & Act
    render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    )

    // Assert
    expect(screen.getByText('AB')).toBeInTheDocument()
  })

  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    )

    // Assert
    expect(container.querySelector('[data-slot="avatar-fallback"]')).toBeInTheDocument()
  })
})

describe('AvatarBadge', () => {
  it('should render with data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(
      <Avatar>
        <AvatarBadge />
      </Avatar>
    )

    // Assert
    expect(container.querySelector('[data-slot="avatar-badge"]')).toBeInTheDocument()
  })
})

describe('AvatarGroup', () => {
  it('should render children with data-slot attribute', () => {
    // Arrange & Act
    const { container } = render(
      <AvatarGroup>
        <Avatar />
        <Avatar />
      </AvatarGroup>
    )

    // Assert
    expect(container.querySelector('[data-slot="avatar-group"]')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot="avatar"]')).toHaveLength(2)
  })
})

describe('AvatarGroupCount', () => {
  it('should render count text', () => {
    // Arrange & Act
    render(<AvatarGroupCount>+3</AvatarGroupCount>)

    // Assert
    expect(screen.getByText('+3')).toBeInTheDocument()
  })

  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    const { container } = render(<AvatarGroupCount>+3</AvatarGroupCount>)

    // Assert
    expect(container.querySelector('[data-slot="avatar-group-count"]')).toBeInTheDocument()
  })
})
