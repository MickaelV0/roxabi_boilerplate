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

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [], refetch: vi.fn() }),
  useMutation: () => ({ mutate: vi.fn() }),
}))

import './tanstack-query'

describe('TanStackQueryDemo', () => {
  it('should render the page heading when component mounts', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('demo_query_heading')
  })

  it('should render the Todos card title when component mounts', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('demo_query_todos')).toBeInTheDocument()
  })

  it('should render the todo input and add button when component mounts', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByPlaceholderText('demo_query_placeholder')).toBeInTheDocument()
    expect(screen.getByText('demo_query_add')).toBeInTheDocument()
  })

  it('should render the add button as disabled when input is empty', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByRole('button', { name: 'demo_query_add' })).toBeDisabled()
  })
})
