import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtoolsPanel: () => <div data-testid="devtools" />,
}))

describe('tanstack-query devtools', () => {
  it('should export TanStackQueryDevtools with the correct name', async () => {
    // Arrange & Act
    const { TanStackQueryDevtools } = await import('./devtools')

    // Assert
    expect(TanStackQueryDevtools.name).toBe('Tanstack Query')
  })

  it('should have a render property defined', async () => {
    // Arrange & Act
    const { TanStackQueryDevtools } = await import('./devtools')

    // Assert
    expect(TanStackQueryDevtools.render).toBeDefined()
  })

  it('should render the devtools panel', async () => {
    // Arrange
    const { TanStackQueryDevtools } = await import('./devtools')

    // Act
    render(TanStackQueryDevtools.render)

    // Assert
    expect(screen.getByTestId('devtools')).toBeInTheDocument()
  })
})
