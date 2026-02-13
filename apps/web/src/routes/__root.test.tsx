import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@repo/ui', () => ({
  Button: ({
    children,
    asChild,
  }: React.PropsWithChildren<{ asChild?: boolean; className?: string }>) =>
    asChild ? children : <button type="button">{children}</button>,
  Toaster: () => null,
}))

vi.mock('@/paraglide/messages', () => ({
  m: {
    not_found_title: () => 'Page not found',
    not_found_description: () => 'Sorry, the page you are looking for does not exist.',
    not_found_go_home: () => 'Go back home',
    error_title: () => 'Something went wrong',
    error_try_again: () => 'Try again',
    error_unexpected: () => 'An unexpected error occurred',
  },
}))

vi.mock('@/paraglide/runtime', () => ({
  getLocale: () => 'en',
}))

vi.mock('@tanstack/react-router', () => ({
  createRootRouteWithContext: () => () => (config: Record<string, unknown>) => config,
  HeadContent: () => null,
  Link: ({ children, to }: React.PropsWithChildren<{ to: string }>) => <a href={to}>{children}</a>,
  Scripts: () => null,
  useRouterState: () => '/',
}))

vi.mock('@tanstack/react-devtools', () => ({
  TanStackDevtools: () => null,
}))

vi.mock('@tanstack/react-router-devtools', () => ({
  TanStackRouterDevtoolsPanel: () => null,
}))

vi.mock('fumadocs-ui/provider/tanstack', () => ({
  RootProvider: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}))

vi.mock('react-error-boundary', () => ({
  ErrorBoundary: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}))

vi.mock('@/components/Header', () => ({
  Header: () => null,
}))

vi.mock('@/integrations/tanstack-query/devtools', () => ({
  TanStackQueryDevtools: null,
}))

vi.mock('@/lib/demo-store-devtools', () => ({
  demoStoreDevtools: null,
}))

import { ErrorFallback, NotFound } from './__root'

describe('NotFound', () => {
  it('renders the decorative 404 text', () => {
    // Arrange & Act
    render(<NotFound />)

    // Assert
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('renders the page title', () => {
    // Arrange & Act
    render(<NotFound />)

    // Assert
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
  })

  it('renders the description', () => {
    // Arrange & Act
    render(<NotFound />)

    // Assert
    expect(
      screen.getByText('Sorry, the page you are looking for does not exist.')
    ).toBeInTheDocument()
  })

  it('renders a link to go home', () => {
    // Arrange & Act
    render(<NotFound />)

    // Assert
    const link = screen.getByRole('link', { name: 'Go back home' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/')
  })

  it('hides the 404 text from assistive technology', () => {
    // Arrange & Act
    render(<NotFound />)

    // Assert
    const decorativeText = screen.getByText('404')
    expect(decorativeText).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('ErrorFallback', () => {
  it('renders the error title', () => {
    // Arrange
    const resetFn = vi.fn()

    // Act
    render(<ErrorFallback error={new Error('test')} resetErrorBoundary={resetFn} />)

    // Assert
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders the try again button', () => {
    // Arrange
    const resetFn = vi.fn()

    // Act
    render(<ErrorFallback error={new Error('test')} resetErrorBoundary={resetFn} />)

    // Assert
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('renders the error message from an Error instance', () => {
    // Arrange
    const resetFn = vi.fn()

    // Act
    render(<ErrorFallback error={new Error('Custom error message')} resetErrorBoundary={resetFn} />)

    // Assert
    expect(screen.getByText('Custom error message')).toBeInTheDocument()
  })

  it('renders a fallback message for non-Error values', () => {
    // Arrange
    const resetFn = vi.fn()

    // Act
    render(<ErrorFallback error="string error" resetErrorBoundary={resetFn} />)

    // Assert
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
  })
})
