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
    dx_title: () => 'Developer Experience',
    dx_subtitle: () => 'Built for developers',
    dx_tdd_title: () => 'TDD',
    dx_tdd_desc: () => 'Test-driven development',
    dx_quality_title: () => 'Quality',
    dx_quality_desc: () => 'High quality standards',
    dx_docs_title: () => 'Documentation',
    dx_docs_desc: () => 'Comprehensive docs',
    dx_tooling_title: () => 'Tooling',
    dx_tooling_desc: () => 'Modern tooling',
  },
}))

import { DxSection } from './DxSection'

describe('DxSection', () => {
  it('should render the section heading', () => {
    // Arrange & Act
    render(<DxSection />)

    // Assert
    expect(screen.getByText('Developer Experience')).toBeInTheDocument()
  })

  it('should render the subtitle', () => {
    // Arrange & Act
    render(<DxSection />)

    // Assert
    expect(screen.getByText('Built for developers')).toBeInTheDocument()
  })

  it('should render all four DX feature cards', () => {
    // Arrange & Act
    render(<DxSection />)

    // Assert
    expect(screen.getByText('TDD')).toBeInTheDocument()
    expect(screen.getByText('Quality')).toBeInTheDocument()
    expect(screen.getByText('Documentation')).toBeInTheDocument()
    expect(screen.getByText('Tooling')).toBeInTheDocument()
  })

  it('should render feature descriptions', () => {
    // Arrange & Act
    render(<DxSection />)

    // Assert
    expect(screen.getByText('Test-driven development')).toBeInTheDocument()
    expect(screen.getByText('High quality standards')).toBeInTheDocument()
    expect(screen.getByText('Comprehensive docs')).toBeInTheDocument()
    expect(screen.getByText('Modern tooling')).toBeInTheDocument()
  })
})
