import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

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
  it('should render the hero title', () => {
    // Arrange & Act
    render(<HeroSection />)

    // Assert
    expect(screen.getByText('Build Your SaaS Faster')).toBeInTheDocument()
  })

  it('should render the hero subtitle', () => {
    // Arrange & Act
    render(<HeroSection />)

    // Assert
    expect(screen.getByText('A modern SaaS boilerplate')).toBeInTheDocument()
  })

  it('should render the badge', () => {
    // Arrange & Act
    render(<HeroSection />)

    // Assert
    expect(screen.getByText('Open Source')).toBeInTheDocument()
  })

  it('should render CTA buttons', () => {
    // Arrange & Act
    render(<HeroSection />)

    // Assert
    expect(screen.getByRole('link', { name: /get started/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view on github/i })).toBeInTheDocument()
  })

  it('should render GitHub link with correct href and rel attributes', () => {
    // Arrange & Act
    render(<HeroSection />)

    // Assert
    const githubLink = screen.getByRole('link', { name: /view on github/i })
    expect(githubLink).toHaveAttribute('href', 'https://github.com/test/repo')
    expect(githubLink).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(githubLink).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
    expect(githubLink).toHaveAttribute('target', '_blank')
  })

  it('should render stats', () => {
    // Arrange & Act
    render(<HeroSection />)

    // Assert
    expect(screen.getByText('5 min')).toBeInTheDocument()
    expect(screen.getByText('Setup time')).toBeInTheDocument()
    expect(screen.getByText('Zero')).toBeInTheDocument()
    expect(screen.getByText('Config needed')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('Production ready')).toBeInTheDocument()
  })
})
