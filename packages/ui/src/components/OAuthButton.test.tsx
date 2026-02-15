import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OAuthButton } from './OAuthButton'

describe('OAuthButton', () => {
  it('should render with provider data attribute', () => {
    // Arrange & Act
    render(<OAuthButton provider="google" />)

    // Assert
    expect(screen.getByRole('button')).toHaveAttribute('data-provider', 'google')
  })

  it('should render default label for google', () => {
    // Arrange & Act
    render(<OAuthButton provider="google" />)

    // Assert
    expect(screen.getByRole('button')).toHaveTextContent('Sign in with Google')
  })

  it('should render default label for github', () => {
    // Arrange & Act
    render(<OAuthButton provider="github" />)

    // Assert
    expect(screen.getByRole('button')).toHaveTextContent('Sign in with GitHub')
  })

  it('should render custom children as label', () => {
    // Arrange & Act
    render(<OAuthButton provider="google">Sign up with Google</OAuthButton>)

    // Assert
    expect(screen.getByRole('button')).toHaveTextContent('Sign up with Google')
  })

  it('should call onClick when clicked', () => {
    // Arrange
    const handleClick = vi.fn()
    render(<OAuthButton provider="github" onClick={handleClick} />)

    // Act
    fireEvent.click(screen.getByRole('button'))

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when loading is true', () => {
    // Arrange & Act
    render(<OAuthButton provider="google" loading />)

    // Assert
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should be disabled when disabled prop is set', () => {
    // Arrange & Act
    render(<OAuthButton provider="google" disabled />)

    // Assert
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should have data-slot attribute when rendered', () => {
    // Arrange & Act
    render(<OAuthButton provider="google" />)

    // Assert
    expect(screen.getByRole('button')).toHaveAttribute('data-slot', 'oauth-button')
  })

  it('should render provider icon SVG', () => {
    // Arrange & Act
    const { container } = render(<OAuthButton provider="google" />)

    // Assert
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('should show spinner when loading', () => {
    // Arrange & Act
    const { container } = render(<OAuthButton provider="google" loading />)

    // Assert -- OAuthButton uses Loader2 with animate-spin class;
    // no data attribute is exposed for loading state on the icon
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeTruthy()
  })

  it('should not call onClick when disabled', () => {
    // Arrange
    const handleClick = vi.fn()
    render(<OAuthButton provider="google" onClick={handleClick} disabled />)

    // Act
    fireEvent.click(screen.getByRole('button'))

    // Assert
    expect(handleClick).not.toHaveBeenCalled()
  })
})
