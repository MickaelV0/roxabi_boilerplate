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
    // Remove 'params' from props so it's not spread onto the <a>
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  },
}))

import { Footer } from './Footer'

describe('Footer', () => {
  it('renders the footer element', () => {
    render(<Footer />)

    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
  })

  it('displays the copyright text with current year', () => {
    render(<Footer />)

    const year = new Date().getFullYear().toString()
    expect(screen.getByText(`Copyright ${year} Roxabi`)).toBeInTheDocument()
  })

  it('renders the changelog link', () => {
    render(<Footer />)

    const link = screen.getByRole('link', { name: 'Changelog' })
    expect(link).toHaveAttribute('href', '/docs/changelog')
  })

  it('renders the GitHub link', () => {
    render(<Footer />)

    const link = screen.getByRole('link', { name: 'GitHub' })
    expect(link).toHaveAttribute('href', 'https://github.com/test/repo')
  })

  it('opens the GitHub link in a new tab', () => {
    render(<Footer />)

    const link = screen.getByRole('link', { name: 'GitHub' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
