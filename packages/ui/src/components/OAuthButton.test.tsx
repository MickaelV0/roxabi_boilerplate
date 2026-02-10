import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OAuthButton } from './OAuthButton'

describe('OAuthButton', () => {
  it('renders with provider data attribute', () => {
    render(<OAuthButton provider="google" />)
    expect(screen.getByRole('button')).toHaveAttribute('data-provider', 'google')
  })

  it('renders default label for google', () => {
    render(<OAuthButton provider="google" />)
    expect(screen.getByRole('button')).toHaveTextContent('Sign in with Google')
  })

  it('renders default label for github', () => {
    render(<OAuthButton provider="github" />)
    expect(screen.getByRole('button')).toHaveTextContent('Sign in with GitHub')
  })

  it('renders custom children as label', () => {
    render(<OAuthButton provider="google">Sign up with Google</OAuthButton>)
    expect(screen.getByRole('button')).toHaveTextContent('Sign up with Google')
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<OAuthButton provider="github" onClick={handleClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when loading', () => {
    render(<OAuthButton provider="google" loading />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is disabled when disabled prop is set', () => {
    render(<OAuthButton provider="google" disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('has data-slot attribute', () => {
    render(<OAuthButton provider="google" />)
    expect(screen.getByRole('button')).toHaveAttribute('data-slot', 'oauth-button')
  })
})
