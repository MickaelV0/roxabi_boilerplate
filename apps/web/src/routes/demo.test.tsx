import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mockClientEnv = vi.hoisted(() => ({
  VITE_ENABLE_DEMO: 'true' as string | undefined,
  VITE_GITHUB_REPO_URL: undefined as string | undefined,
}))

vi.mock('@/lib/env.shared.js', () => ({
  clientEnv: mockClientEnv,
}))

afterEach(() => {
  mockClientEnv.VITE_ENABLE_DEMO = 'true'
  mockClientEnv.VITE_GITHUB_REPO_URL = undefined
})

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
    mockClientEnv.VITE_ENABLE_DEMO = 'false'

    // Act & Assert
    expect(() => captured.beforeLoad()).toThrow()
  })
})
