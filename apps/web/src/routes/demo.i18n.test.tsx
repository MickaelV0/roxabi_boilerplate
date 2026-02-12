import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const captured = vi.hoisted(() => ({
  Component: (() => null) as React.ComponentType,
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType }) => {
    captured.Component = config.component
    return { component: config.component }
  },
}))

vi.mock('@repo/ui', () => ({
  Card: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div {...props}>{children}</div>
  ),
  CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardTitle: ({ children }: React.PropsWithChildren) => <h3>{children}</h3>,
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
  Globe: () => <svg data-testid="globe-icon" />,
}))

vi.mock('../components/LocaleSwitcher', () => ({
  LocaleSwitcher: () => <div data-testid="locale-switcher" />,
}))

import './demo.i18n'

describe('I18nDemo', () => {
  it('should render the page heading', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('Internationalization')).toBeInTheDocument()
  })

  it('should render the globe icon', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByTestId('globe-icon')).toBeInTheDocument()
  })

  it('should render the locale switcher', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByTestId('locale-switcher')).toBeInTheDocument()
  })

  it('should render translated message with username parameter', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('example_message({"username":"TanStack Router"})')).toBeInTheDocument()
  })

  it('should render the learn more link', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('learn_router')).toBeInTheDocument()
  })
})
