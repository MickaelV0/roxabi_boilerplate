import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/paraglide/messages', () => ({
  m: {
    footer_copyright: ({ year }: { year: string }) => `Copyright ${year} Roxabi`,
    github_label: () => 'GitHub',
  },
}))

vi.mock('@/lib/config', () => ({
  GITHUB_REPO_URL: 'https://github.com/test/repo',
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

  it('renders the GitHub link', () => {
    render(<Footer />)

    const link = screen.getByText('GitHub')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://github.com/test/repo')
  })

  it('opens the GitHub link in a new tab', () => {
    render(<Footer />)

    const link = screen.getByText('GitHub')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
