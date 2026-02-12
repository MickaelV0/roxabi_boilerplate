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
  Input: (props: Record<string, unknown>) => <input {...props} />,
}))

vi.mock('@/lib/demo-store', () => ({
  store: { setState: vi.fn(), state: { firstName: 'John', lastName: 'Doe' } },
  fullName: { state: 'John Doe' },
}))

vi.mock('@tanstack/react-store', () => ({
  useStore: (_store: unknown, selector?: (s: unknown) => unknown) => {
    if (selector) return selector({ firstName: 'John', lastName: 'Doe' })
    return 'John Doe'
  },
}))

import './store'

describe('DemoStore', () => {
  it('should render the page heading', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('Store')).toBeInTheDocument()
  })

  it('should render first name and last name inputs', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByLabelText('First name')).toBeInTheDocument()
    expect(screen.getByLabelText('Last name')).toBeInTheDocument()
  })

  it('should render the full name display', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })
})
