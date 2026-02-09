import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@repo/ui', () => ({
  Card: ({ children, className, ...props }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardTitle: ({ children }: React.PropsWithChildren) => <h3>{children}</h3>,
  CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

vi.mock('@/paraglide/messages', () => ({
  m: {
    features_title: () => 'Features',
    features_subtitle: () => 'Everything you need',
    feature_fullstack_title: () => 'Full Stack',
    feature_fullstack_desc: () => 'Full stack framework',
    feature_auth_title: () => 'Authentication',
    feature_auth_desc: () => 'Built-in auth',
    feature_multitenant_title: () => 'Multi-tenant',
    feature_multitenant_desc: () => 'Multi-tenant support',
    feature_rbac_title: () => 'RBAC',
    feature_rbac_desc: () => 'Role-based access',
    feature_typesafe_title: () => 'Type-safe',
    feature_typesafe_desc: () => 'End-to-end type safety',
    feature_monorepo_title: () => 'Monorepo',
    feature_monorepo_desc: () => 'Monorepo structure',
    feature_i18n_title: () => 'i18n',
    feature_i18n_desc: () => 'Internationalization',
    feature_ai_title: () => 'AI',
    feature_ai_desc: () => 'AI integration',
  },
}))

import { FeaturesSection } from './FeaturesSection'

describe('FeaturesSection', () => {
  it('renders the section heading', () => {
    render(<FeaturesSection />)

    expect(screen.getByText('Features')).toBeInTheDocument()
  })

  it('renders the subtitle', () => {
    render(<FeaturesSection />)

    expect(screen.getByText('Everything you need')).toBeInTheDocument()
  })

  it('renders all eight feature cards', () => {
    render(<FeaturesSection />)

    expect(screen.getByText('Full Stack')).toBeInTheDocument()
    expect(screen.getByText('Authentication')).toBeInTheDocument()
    expect(screen.getByText('Multi-tenant')).toBeInTheDocument()
    expect(screen.getByText('RBAC')).toBeInTheDocument()
    expect(screen.getByText('Type-safe')).toBeInTheDocument()
    expect(screen.getByText('Monorepo')).toBeInTheDocument()
    expect(screen.getByText('i18n')).toBeInTheDocument()
    expect(screen.getByText('AI')).toBeInTheDocument()
  })

  it('renders feature descriptions', () => {
    render(<FeaturesSection />)

    expect(screen.getByText('Full stack framework')).toBeInTheDocument()
    expect(screen.getByText('Built-in auth')).toBeInTheDocument()
    expect(screen.getByText('AI integration')).toBeInTheDocument()
  })

  it('renders within a section element', () => {
    const { container } = render(<FeaturesSection />)

    const section = container.querySelector('section')
    expect(section).toBeInTheDocument()
  })
})
