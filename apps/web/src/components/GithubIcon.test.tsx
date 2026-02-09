import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@repo/ui', () => ({
  Button: ({
    children,
    asChild,
    ...props
  }: React.PropsWithChildren<{ asChild?: boolean; variant?: string; size?: string }>) =>
    asChild ? children : <button {...props}>{children}</button>,
}))

vi.mock('@/paraglide/messages', () => ({
  m: {
    github_label: () => 'GitHub',
  },
}))

vi.mock('@/lib/config', () => ({
  GITHUB_REPO_URL: 'https://github.com/test/repo',
}))

import { GithubIcon } from './GithubIcon'

describe('GithubIcon', () => {
  it('renders a link to the GitHub repo', () => {
    render(<GithubIcon />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://github.com/test/repo')
  })

  it('opens in a new tab', () => {
    render(<GithubIcon />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('has an accessible label', () => {
    render(<GithubIcon />)

    const link = screen.getByLabelText('GitHub')
    expect(link).toBeInTheDocument()
  })
})
