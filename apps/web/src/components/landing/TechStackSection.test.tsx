import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@repo/ui', () => ({
  Badge: ({ children }: React.PropsWithChildren<{ variant?: string; className?: string }>) => (
    <span>{children}</span>
  ),
}))

vi.mock('@/paraglide/messages', () => ({
  m: {
    tech_title: () => 'Tech Stack',
    tech_frontend: () => 'Frontend',
    tech_backend: () => 'Backend',
    tech_tooling: () => 'Tooling',
  },
}))

import { TechStackSection } from './TechStackSection'

describe('TechStackSection', () => {
  it('renders the section title', () => {
    render(<TechStackSection />)

    expect(screen.getByText('Tech Stack')).toBeInTheDocument()
  })

  it('renders the tech group labels', () => {
    render(<TechStackSection />)

    expect(screen.getByText('Frontend')).toBeInTheDocument()
    expect(screen.getByText('Backend')).toBeInTheDocument()
    expect(screen.getByText('Tooling')).toBeInTheDocument()
  })

  it('renders frontend technologies', () => {
    render(<TechStackSection />)

    expect(screen.getByText('React 19')).toBeInTheDocument()
    expect(screen.getByText('TanStack Start')).toBeInTheDocument()
    expect(screen.getByText('Tailwind CSS 4')).toBeInTheDocument()
    expect(screen.getByText('Radix UI')).toBeInTheDocument()
  })

  it('renders backend technologies', () => {
    render(<TechStackSection />)

    expect(screen.getByText('NestJS')).toBeInTheDocument()
    expect(screen.getByText('Fastify')).toBeInTheDocument()
    expect(screen.getByText('Drizzle ORM')).toBeInTheDocument()
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
  })

  it('renders tooling technologies', () => {
    render(<TechStackSection />)

    expect(screen.getByText('Bun')).toBeInTheDocument()
    expect(screen.getByText('TurboRepo')).toBeInTheDocument()
    expect(screen.getByText('Biome')).toBeInTheDocument()
    expect(screen.getByText('Vitest')).toBeInTheDocument()
    expect(screen.getByText('Playwright')).toBeInTheDocument()
  })
})
