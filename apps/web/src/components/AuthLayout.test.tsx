import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@repo/ui', () => ({
  Card: ({ children, ...props }: React.PropsWithChildren<{ className?: string }>) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
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
    render(<AuthLayout title="Sign In">content</AuthLayout>)

    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('should render description when provided', () => {
    render(
      <AuthLayout title="Sign In" description="Welcome back">
        content
      </AuthLayout>
    )

    expect(screen.getByText('Welcome back')).toBeInTheDocument()
  })

  it('should not render description when not provided', () => {
    render(<AuthLayout title="Sign In">content</AuthLayout>)

    // The card should exist but no <p> description element
    const card = screen.getByTestId('card')
    const paragraphs = card.querySelectorAll('p')
    expect(paragraphs).toHaveLength(0)
  })

  it('should render children', () => {
    render(
      <AuthLayout title="Sign In">
        <button type="button">Submit</button>
      </AuthLayout>
    )

    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
  })

  it('should render branding link to home', () => {
    render(<AuthLayout title="Sign In">content</AuthLayout>)

    const brandingLink = screen.getByRole('link', { name: 'Roxabi' })
    expect(brandingLink).toHaveAttribute('href', '/')
  })
})
