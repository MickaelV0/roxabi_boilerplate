import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/paraglide/messages', () => ({
  m: {
    footer_changelog: () => 'Changelog',
    footer_copyright: ({ year }: { year: string }) => `Copyright ${year} Roxabi`,
    github_label: () => 'GitHub',
  },
}))

vi.mock('@/lib/config', () => ({
  GITHUB_REPO_URL: 'https://github.com/test/repo',
}))

vi.mock('@/lib/consent/useConsent', () => ({
  useConsent: () => ({
    openSettings: vi.fn(),
  }),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    params,
    children,
    ...props
  }: {
    to: string
    params?: Record<string, string>
    children: ReactNode
    [key: string]: unknown
  }) => {
    let href = to
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        href = href.replace(`$${key === '_splat' ? '' : key}`, value)
      }
    }
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  },
}))

import { Footer } from './Footer'

describe('Footer', () => {
  it('should render the footer element', () => {
    // Arrange & Act
    render(<Footer />)

    // Assert
    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
  })

  it('should display the copyright text with current year', () => {
    // Arrange
    const year = new Date().getFullYear().toString()

    // Act
    render(<Footer />)

    // Assert
    expect(screen.getByText(`Copyright ${year} Roxabi`)).toBeInTheDocument()
  })

  it('should render the changelog link', () => {
    // Arrange & Act
    render(<Footer />)

    // Assert
    const link = screen.getByRole('link', { name: 'Changelog' })
    expect(link).toHaveAttribute('href', '/docs/changelog')
  })

  it('should render the GitHub link', () => {
    // Arrange & Act
    render(<Footer />)

    // Assert
    const link = screen.getByRole('link', { name: 'GitHub' })
    expect(link).toHaveAttribute('href', 'https://github.com/test/repo')
  })

  it('should open the GitHub link in a new tab', () => {
    // Arrange & Act
    render(<Footer />)

    // Assert
    const link = screen.getByRole('link', { name: 'GitHub' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
