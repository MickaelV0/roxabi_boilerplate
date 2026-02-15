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
  Link: ({ children, to, ...props }: React.PropsWithChildren<{ to: string }>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@repo/ui', async () => await import('@/test/__mocks__/repo-ui'))

mockParaglideMessages()

import './index'

describe('DemoIndex', () => {
  it('should render the page heading when component mounts', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('demo_title')
  })

  it('should render all category headings when component mounts', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('demo_category_tanstack')).toBeInTheDocument()
    expect(screen.getByText('demo_category_forms')).toBeInTheDocument()
    expect(screen.getByText('demo_category_ssr')).toBeInTheDocument()
    expect(screen.getByText('demo_category_i18n')).toBeInTheDocument()
  })

  it('should render demo links with correct hrefs when component mounts', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    const storeLink = screen.getByRole('link', { name: /demo_store_title/ })
    expect(storeLink).toHaveAttribute('href', '/demo/store')

    const queryLink = screen.getByRole('link', { name: /demo_query_title/ })
    expect(queryLink).toHaveAttribute('href', '/demo/tanstack-query')

    const tableLink = screen.getByRole('link', { name: /demo_table_title/ })
    expect(tableLink).toHaveAttribute('href', '/demo/table')
  })

  it('should render demo descriptions when component mounts', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('demo_store_desc')).toBeInTheDocument()
    expect(screen.getByText('demo_query_desc')).toBeInTheDocument()
  })
})
