import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const captured = vi.hoisted(() => ({
  Component: (() => null) as React.ComponentType,
}))

vi.mock('@repo/ui', async () => await import('@/test/__mocks__/repo-ui'))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType }) => {
    captured.Component = config.component
    return { component: config.component }
  },
  Link: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <a {...props}>{children}</a>
  ),
}))

vi.mock('@/paraglide/messages', () => ({
  m: new Proxy(
    {},
    {
      get:
        (_target, prop) =>
        (...args: unknown[]) => {
          if (args.length > 0 && typeof args[0] === 'object')
            return `${String(prop)}(${JSON.stringify(args[0])})`
          return String(prop)
        },
    }
  ),
}))

vi.mock('lucide-react', () => ({
  ChevronLeft: () => <svg data-testid="chevron-left-icon" />,
  Globe: () => <svg data-testid="globe-icon" />,
}))

vi.mock('../components/LocaleSwitcher', () => ({
  LocaleSwitcher: () => <div data-testid="locale-switcher" />,
}))

import './demo.i18n'

describe('I18nDemo', () => {
  it('should render the page heading when component mounts', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('demo_i18n_heading')
  })

  it('should render the globe icon when component mounts', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    // Using getByTestId because lucide-react icons are mocked as plain SVGs
    // without semantic roles or accessible names
    expect(screen.getByTestId('globe-icon')).toBeInTheDocument()
  })

  it('should render the locale switcher when component mounts', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    // Using getByTestId because LocaleSwitcher is a mocked component
    // without semantic role
    expect(screen.getByTestId('locale-switcher')).toBeInTheDocument()
  })

  it('should render translated message with username parameter when component mounts', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('example_message({"username":"TanStack Router"})')).toBeInTheDocument()
  })

  it('should render the learn more link when component mounts', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('learn_router')).toBeInTheDocument()
  })
})
