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
}))

vi.mock('@repo/ui', () => ({
  AnimatedSection: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}))

vi.mock('@/components/landing/AiTeamSection', () => ({
  AiTeamSection: () => <section data-testid="ai-team-section" />,
}))

vi.mock('@/components/landing/CtaSection', () => ({
  CtaSection: () => <section data-testid="cta-section" />,
}))

vi.mock('@/components/landing/DxSection', () => ({
  DxSection: () => <section data-testid="dx-section" />,
}))

vi.mock('@/components/landing/FeaturesSection', () => ({
  FeaturesSection: () => <section data-testid="features-section" />,
}))

vi.mock('@/components/landing/HeroSection', () => ({
  HeroSection: () => <section data-testid="hero-section" />,
}))

vi.mock('@/components/landing/StatsSection', () => ({
  StatsSection: () => <section data-testid="stats-section" />,
}))

vi.mock('@/components/landing/TechStackSection', () => ({
  TechStackSection: () => <section data-testid="tech-stack-section" />,
}))

import './index'

describe('LandingPage', () => {
  it('should render without crashing', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByTestId('hero-section')).toBeInTheDocument()
  })

  it('should render all landing page sections', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByTestId('hero-section')).toBeInTheDocument()
    expect(screen.getByTestId('features-section')).toBeInTheDocument()
    expect(screen.getByTestId('ai-team-section')).toBeInTheDocument()
    expect(screen.getByTestId('dx-section')).toBeInTheDocument()
    expect(screen.getByTestId('tech-stack-section')).toBeInTheDocument()
    expect(screen.getByTestId('stats-section')).toBeInTheDocument()
    expect(screen.getByTestId('cta-section')).toBeInTheDocument()
  })
})
