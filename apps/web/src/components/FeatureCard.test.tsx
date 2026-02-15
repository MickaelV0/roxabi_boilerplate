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
  it('should render the title', () => {
    // Arrange & Act
    render(
      <FeatureCard
        icon={<span data-testid="icon">icon</span>}
        title="Test Title"
        description="Test description"
      />
    )

    // Assert
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('should render the description', () => {
    // Arrange & Act
    render(
      <FeatureCard icon={<span>icon</span>} title="Title" description="A detailed description" />
    )

    // Assert
    expect(screen.getByText('A detailed description')).toBeInTheDocument()
  })

  it('should render the icon', () => {
    // Arrange & Act
    render(
      <FeatureCard
        icon={<span data-testid="feature-icon">star</span>}
        title="Title"
        description="Desc"
      />
    )

    // Assert
    expect(screen.getByTestId('feature-icon')).toBeInTheDocument()
  })

  it('should pass through custom className', () => {
    // Arrange & Act
    // className passthrough is a prop contract, not a styling detail --
    // className is the only way to verify this on a wrapper div with no semantic role.
    const { container } = render(
      <FeatureCard
        icon={<span>icon</span>}
        title="Title"
        description="Desc"
        className="my-custom-class"
      />
    )

    // Assert
    expect(container.firstChild).toHaveClass('my-custom-class')
  })

  it('should pass through additional div props', () => {
    // Arrange & Act
    render(
      <FeatureCard
        icon={<span>icon</span>}
        title="Title"
        description="Desc"
        data-testid="feature-card"
      />
    )

    // Assert
    expect(screen.getByTestId('feature-card')).toBeInTheDocument()
  })
})
