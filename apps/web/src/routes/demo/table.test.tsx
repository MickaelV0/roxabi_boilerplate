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

vi.mock('@/data/demo-table-data', () => ({
  makeData: () => [
    {
      id: 1,
      firstName: 'Ada',
      lastName: 'Lovelace',
      age: 36,
      visits: 100,
      progress: 50,
      status: 'single' as const,
    },
  ],
}))

import './table'

describe('TableDemo', () => {
  it('should render the page heading when component mounts', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('demo_table_heading')
  })

  it('should render the global search input when component mounts', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByLabelText('demo_table_search_all')).toBeInTheDocument()
  })

  it('should render table data when component mounts', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getByText('Lovelace')).toBeInTheDocument()
  })

  it('should render action buttons when component mounts', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('demo_table_force_rerender')).toBeInTheDocument()
    expect(screen.getByText('demo_table_refresh_data')).toBeInTheDocument()
  })

  it('should render row count when component mounts', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('demo_table_rows({"count":"1"})')).toBeInTheDocument()
  })
})
