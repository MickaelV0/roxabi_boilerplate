import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/devtools-event-client', () => ({
  EventClient: class EventClient {
    on() {
      return () => {}
    }
    emit() {}
  },
}))

describe('demo-store-devtools', () => {
  it('should export an object with the correct name', async () => {
    const mod = await import('./demo-store-devtools')

    expect(mod.demoStoreDevtools.name).toBe('TanStack Store')
  })

  it('should have a render property defined', async () => {
    const mod = await import('./demo-store-devtools')

    expect(mod.demoStoreDevtools.render).toBeDefined()
  })

  it('should render DevtoolPanel with initial state values', async () => {
    const mod = await import('./demo-store-devtools')

    render(mod.demoStoreDevtools.render)

    expect(screen.getByText('First Name')).toBeInTheDocument()
    expect(screen.getByText('Last Name')).toBeInTheDocument()
    expect(screen.getByText('Full Name')).toBeInTheDocument()
    expect(screen.getByText('Jane')).toBeInTheDocument()
    expect(screen.getByText('Smith')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })
})
