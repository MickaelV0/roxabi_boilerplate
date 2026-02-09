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

import { FeatureCard } from './FeatureCard'

describe('FeatureCard', () => {
  it('renders the title', () => {
    render(
      <FeatureCard
        icon={<span data-testid="icon">icon</span>}
        title="Test Title"
        description="Test description"
      />
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(
      <FeatureCard icon={<span>icon</span>} title="Title" description="A detailed description" />
    )

    expect(screen.getByText('A detailed description')).toBeInTheDocument()
  })

  it('renders the icon', () => {
    render(
      <FeatureCard
        icon={<span data-testid="feature-icon">star</span>}
        title="Title"
        description="Desc"
      />
    )

    expect(screen.getByTestId('feature-icon')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <FeatureCard
        icon={<span>icon</span>}
        title="Title"
        description="Desc"
        className="my-custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('my-custom-class')
  })

  it('passes through additional div props', () => {
    render(
      <FeatureCard
        icon={<span>icon</span>}
        title="Title"
        description="Desc"
        data-testid="feature-card"
      />
    )

    expect(screen.getByTestId('feature-card')).toBeInTheDocument()
  })
})
