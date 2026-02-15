import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const captured = vi.hoisted(() => ({
  Component: (() => null) as React.ComponentType,
  beforeLoad: (() => undefined) as () => void,
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType; beforeLoad: () => void }) => {
    captured.Component = config.component
    captured.beforeLoad = config.beforeLoad
    return { component: config.component, beforeLoad: config.beforeLoad }
  },
  notFound: () => new Error('Not Found'),
  Outlet: () => <div data-testid="outlet" />,
}))

vi.stubEnv('VITE_ENABLE_DEMO', 'true')

import './demo'

describe('DemoLayout', () => {
  it('should render the Outlet when demo is enabled', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
  })

  it('should not throw in beforeLoad when VITE_ENABLE_DEMO is true', () => {
    // Arrange & Act & Assert
    expect(() => captured.beforeLoad()).not.toThrow()
  })

  it('should throw notFound in beforeLoad when VITE_ENABLE_DEMO is false', () => {
    // Arrange
    vi.stubEnv('VITE_ENABLE_DEMO', 'false')

    // Act & Assert
    expect(() => captured.beforeLoad()).toThrow()
  })
})
