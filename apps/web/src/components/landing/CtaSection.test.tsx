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
  it('should render the section heading', () => {
    // Arrange & Act
    render(<CtaSection />)

    // Assert
    expect(screen.getByText('Ready to Start?')).toBeInTheDocument()
  })

  it('should render the subtitle', () => {
    // Arrange & Act
    render(<CtaSection />)

    // Assert
    expect(screen.getByText('Get started building your SaaS today')).toBeInTheDocument()
  })

  it('should render the CTA button', () => {
    // Arrange & Act
    render(<CtaSection />)

    // Assert
    const button = screen.getByText('Get Started')
    expect(button).toBeInTheDocument()
  })

  it('should link the CTA button to docs', () => {
    // Arrange & Act
    render(<CtaSection />)

    // Assert
    const link = screen.getByRole('link', { name: 'Get Started' })
    expect(link).toHaveAttribute('href', '/docs')
  })
})
