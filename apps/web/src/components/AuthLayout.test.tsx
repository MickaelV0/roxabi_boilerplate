import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@repo/ui', () => ({
  Card: ({ children, ...props }: React.PropsWithChildren<{ className?: string }>) => (
    <div {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: React.PropsWithChildren<{ className?: string }>) => (
    <div {...props}>{children}</div>
  ),
  CardDescription: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
  CardHeader: ({ children, ...props }: React.PropsWithChildren<{ className?: string }>) => (
    <div {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: React.PropsWithChildren<{ className?: string }>) => (
    <h2 {...props}>{children}</h2>
  ),
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    ...props
  }: React.PropsWithChildren<{ to: string; className?: string }>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

import { AuthLayout } from './AuthLayout'

describe('AuthLayout', () => {
  it('should render the title', () => {
    // Arrange & Act
    render(<AuthLayout title="Sign In">content</AuthLayout>)

    // Assert
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('should render description when provided', () => {
    // Arrange & Act
    render(
      <AuthLayout title="Sign In" description="Welcome back">
        content
      </AuthLayout>
    )

    // Assert
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
  })

  it('should not render description when not provided', () => {
    // Arrange & Act
    render(<AuthLayout title="Sign In">content</AuthLayout>)

    // Assert
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument()
  })

  it('should render children', () => {
    // Arrange & Act
    render(
      <AuthLayout title="Sign In">
        <button type="button">Submit</button>
      </AuthLayout>
    )

    // Assert
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
  })

  it('should render without branding link', () => {
    // Arrange & Act
    render(<AuthLayout title="Sign In">content</AuthLayout>)

    // Assert — Logo link was removed; the layout no longer renders an anchor
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
