import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mockParaglideMessages } from '@/test/__mocks__/mock-messages'

const captured = vi.hoisted(() => ({
  Component: (() => null) as React.ComponentType,
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType }) => {
    captured.Component = config.component
    return { component: config.component }
  },
  Link: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <a {...props}>{children}</a>
  ),
}))

vi.mock('@repo/ui', async () => await import('@/test/__mocks__/repo-ui'))

mockParaglideMessages()

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
  it('should render the page heading when component mounts', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('demo_store_title')
  })

  it('should render first name and last name inputs when component mounts', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByLabelText('demo_store_first_name')).toBeInTheDocument()
    expect(screen.getByLabelText('demo_store_last_name')).toBeInTheDocument()
  })

  it('should render the full name display when component mounts', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })
})
