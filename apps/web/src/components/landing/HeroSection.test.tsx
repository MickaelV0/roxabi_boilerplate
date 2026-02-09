import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@repo/ui', () => ({
  Badge: ({ children }: React.PropsWithChildren<{ variant?: string; className?: string }>) => (
    <span>{children}</span>
  ),
  Button: ({
    children,
    asChild,
  }: React.PropsWithChildren<{ asChild?: boolean; variant?: string; size?: string }>) =>
    asChild ? children : <button type="button">{children}</button>,
}))

vi.mock('@/paraglide/messages', () => ({
  m: {
    hero_badge: () => 'Open Source',
    hero_title: () => 'Build Your SaaS Faster',
    hero_subtitle: () => 'A modern SaaS boilerplate',
    hero_cta_start: () => 'Get Started',
    hero_cta_github: () => 'View on GitHub',
    stat_setup: () => '5 min',
    stat_setup_label: () => 'Setup time',
    stat_config: () => 'Zero',
    stat_config_label: () => 'Config needed',
    stat_production: () => '100%',
    stat_production_label: () => 'Production ready',
  },
}))

vi.mock('@/lib/config', () => ({
  GITHUB_REPO_URL: 'https://github.com/test/repo',
}))

import { HeroSection } from './HeroSection'

describe('HeroSection', () => {
  it('renders the hero title', () => {
    render(<HeroSection />)

    expect(screen.getByText('Build Your SaaS Faster')).toBeInTheDocument()
  })

  it('renders the hero subtitle', () => {
    render(<HeroSection />)

    expect(screen.getByText('A modern SaaS boilerplate')).toBeInTheDocument()
  })

  it('renders the badge', () => {
    render(<HeroSection />)

    expect(screen.getByText('Open Source')).toBeInTheDocument()
  })

  it('renders CTA buttons', () => {
    render(<HeroSection />)

    expect(screen.getByText('Get Started')).toBeInTheDocument()
    expect(screen.getByText('View on GitHub')).toBeInTheDocument()
  })

  it('renders stats', () => {
    render(<HeroSection />)

    expect(screen.getByText('5 min')).toBeInTheDocument()
    expect(screen.getByText('Setup time')).toBeInTheDocument()
    expect(screen.getByText('Zero')).toBeInTheDocument()
    expect(screen.getByText('Config needed')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('Production ready')).toBeInTheDocument()
  })
})
