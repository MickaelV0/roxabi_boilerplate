import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtoolsPanel: () => <div data-testid="devtools" />,
}))

describe('tanstack-query devtools', () => {
  it('should export TanStackQueryDevtools with the correct name', async () => {
    const { TanStackQueryDevtools } = await import('./devtools')

    expect(TanStackQueryDevtools.name).toBe('Tanstack Query')
  })

  it('should have a render property defined', async () => {
    const { TanStackQueryDevtools } = await import('./devtools')

    expect(TanStackQueryDevtools.render).toBeDefined()
  })

  it('should render the devtools panel', async () => {
    const { TanStackQueryDevtools } = await import('./devtools')

    render(TanStackQueryDevtools.render)

    expect(screen.getByTestId('devtools')).toBeInTheDocument()
  })
})
