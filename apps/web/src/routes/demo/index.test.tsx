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
  Link: ({ children, to, ...props }: React.PropsWithChildren<{ to: string }>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@repo/ui', async () => await import('@/test/__mocks__/repo-ui'))

import './index'

describe('DemoIndex', () => {
  it('should render the page heading', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('Demos')).toBeInTheDocument()
  })

  it('should render all category headings', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('TanStack')).toBeInTheDocument()
    expect(screen.getByText('Forms')).toBeInTheDocument()
    expect(screen.getByText('SSR & Server')).toBeInTheDocument()
    expect(screen.getByText('i18n')).toBeInTheDocument()
  })

  it('should render demo links with correct hrefs', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert — link accessible names include description text, so use regex
    const storeLink = screen.getByRole('link', { name: /Store/ })
    expect(storeLink).toHaveAttribute('href', '/demo/store')

    const queryLink = screen.getByRole('link', { name: /Query/ })
    expect(queryLink).toHaveAttribute('href', '/demo/tanstack-query')

    const tableLink = screen.getByRole('link', { name: /Table/ })
    expect(tableLink).toHaveAttribute('href', '/demo/table')
  })

  it('should render demo descriptions', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByText('TanStack Store with reactive state management')).toBeInTheDocument()
    expect(screen.getByText('TanStack Query with CRUD operations')).toBeInTheDocument()
  })
})
