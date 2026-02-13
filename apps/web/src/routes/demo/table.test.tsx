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
  it('should render the page heading', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('demo_table_heading')).toBeInTheDocument()
  })

  it('should render the global search input', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByLabelText('demo_table_search_all')).toBeInTheDocument()
  })

  it('should render table data', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getByText('Lovelace')).toBeInTheDocument()
  })

  it('should render action buttons', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('demo_table_force_rerender')).toBeInTheDocument()
    expect(screen.getByText('demo_table_refresh_data')).toBeInTheDocument()
  })

  it('should render row count', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('demo_table_rows({"count":"1"})')).toBeInTheDocument()
  })
})
