import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@repo/ui', async () => await import('@/test/__mocks__/repoUi'))

const captured = vi.hoisted(() => ({
  Component: (() => null) as React.ComponentType,
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType }) => {
    captured.Component = config.component
    return { component: config.component }
  },
  redirect: vi.fn(),
}))

vi.mock('@/lib/authClient', () => ({
  authClient: { getSession: vi.fn().mockResolvedValue({ data: null }) },
}))

vi.mock('@/components/landing/AiTeamSection', () => ({
  AiTeamSection: () => <section aria-label="AI Team" />,
}))

vi.mock('@/components/landing/CtaSection', () => ({
  CtaSection: () => <section aria-label="CTA" />,
}))

vi.mock('@/components/landing/DxSection', () => ({
  DxSection: () => <section aria-label="DX" />,
}))

vi.mock('@/components/landing/FeaturesSection', () => ({
  FeaturesSection: () => <section aria-label="Features" />,
}))

vi.mock('@/components/landing/HeroSection', () => ({
  HeroSection: () => <section aria-label="Hero" />,
}))

vi.mock('@/components/landing/StatsSection', () => ({
  StatsSection: () => <section aria-label="Stats" />,
}))

vi.mock('@/components/landing/TechStackSection', () => ({
  TechStackSection: () => <section aria-label="Tech Stack" />,
}))

import './index'

describe('LandingPage', () => {
  it('should render hero section when component mounts', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByRole('region', { name: 'Hero' })).toBeInTheDocument()
  })

  it('should render all landing page sections when component mounts', () => {
    // Arrange & Act
    render(<captured.Component />)

    // Assert
    expect(screen.getByRole('region', { name: 'Hero' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Features' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'AI Team' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'DX' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Tech Stack' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Stats' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'CTA' })).toBeInTheDocument()
  })
})
