import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@repo/ui', () => ({
  Button: ({ children, asChild }: React.PropsWithChildren<{ asChild?: boolean; size?: string }>) =>
    asChild ? children : <button type="button">{children}</button>,
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

vi.mock('@/paraglide/messages', () => ({
  m: {
    cta_title: () => 'Ready to Start?',
    cta_subtitle: () => 'Get started building your SaaS today',
    cta_button: () => 'Get Started',
  },
}))

import { CtaSection } from './CtaSection'

describe('CtaSection', () => {
  it('renders the section heading', () => {
    render(<CtaSection />)

    expect(screen.getByText('Ready to Start?')).toBeInTheDocument()
  })

  it('renders the subtitle', () => {
    render(<CtaSection />)

    expect(screen.getByText('Get started building your SaaS today')).toBeInTheDocument()
  })

  it('renders the CTA button', () => {
    render(<CtaSection />)

    const button = screen.getByText('Get Started')
    expect(button).toBeInTheDocument()
  })

  it('links the CTA button to docs', () => {
    render(<CtaSection />)

    const link = screen.getByText('Get Started').closest('a')
    expect(link).toHaveAttribute('href', '/docs')
  })
})
