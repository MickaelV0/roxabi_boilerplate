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

vi.mock('@repo/ui', async () => await import('@/test/__mocks__/repo-ui'))

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [], refetch: vi.fn() }),
  useMutation: () => ({ mutate: vi.fn() }),
}))

import './tanstack-query'

describe('TanStackQueryDemo', () => {
  it('should render the page heading', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('TanStack Query')).toBeInTheDocument()
  })

  it('should render the Todos card title', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('Todos')).toBeInTheDocument()
  })

  it('should render the todo input and add button', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByPlaceholderText('Enter a new todo...')).toBeInTheDocument()
    expect(screen.getByText('Add todo')).toBeInTheDocument()
  })

  it('should render the add button as disabled when input is empty', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByRole('button', { name: 'Add todo' })).toBeDisabled()
  })
})
