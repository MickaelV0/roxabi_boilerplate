import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@repo/ui', () => ({
  Card: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardTitle: ({ children }: React.PropsWithChildren) => <h3>{children}</h3>,
  CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

vi.mock('@/paraglide/messages', () => ({
  m: {
    ai_title: () => 'AI Team',
    ai_subtitle: () => 'Your AI-powered development team',
    ai_dev_title: () => 'Development Agents',
    ai_dev_subtitle: () => 'Helping you build faster',
    ai_runtime_title: () => 'Runtime Agents',
    ai_runtime_subtitle: () => 'Intelligent runtime assistance',
    ai_agent_dev: () => 'Dev Agent',
    ai_agent_dev_role: () => 'Writes code',
    ai_agent_review: () => 'Review Agent',
    ai_agent_review_role: () => 'Reviews PRs',
    ai_agent_test: () => 'Test Agent',
    ai_agent_test_role: () => 'Writes tests',
    ai_agent_deploy: () => 'Deploy Agent',
    ai_agent_deploy_role: () => 'Handles deployment',
    ai_agent_product: () => 'Product Agent',
    ai_agent_product_role: () => 'Manages product',
    ai_agent_ops: () => 'Ops Agent',
    ai_agent_ops_role: () => 'Manages ops',
    ai_agent_frontend: () => 'Frontend Agent',
    ai_agent_frontend_role: () => 'Frontend tasks',
    ai_agent_backend: () => 'Backend Agent',
    ai_agent_backend_role: () => 'Backend tasks',
    ai_agent_domain: () => 'Domain Agent',
    ai_agent_domain_role: () => 'Domain logic',
    ai_agent_personas: () => 'Personas Agent',
    ai_agent_personas_role: () => 'User personas',
    ai_agent_integration: () => 'Integration Agent',
    ai_agent_integration_role: () => 'Integrations',
    ai_cli_note: () => 'CLI note text',
  },
}))

import { AiTeamSection } from './AiTeamSection'

describe('AiTeamSection', () => {
  it('should render the section heading', () => {
    // Arrange & Act
    render(<AiTeamSection />)

    // Assert
    expect(screen.getByText('AI Team')).toBeInTheDocument()
    expect(screen.getByText('Your AI-powered development team')).toBeInTheDocument()
  })

  it('should render development agents', () => {
    // Arrange & Act
    render(<AiTeamSection />)

    // Assert
    expect(screen.getByText('Dev Agent')).toBeInTheDocument()
    expect(screen.getByText('Review Agent')).toBeInTheDocument()
    expect(screen.getByText('Test Agent')).toBeInTheDocument()
    expect(screen.getByText('Frontend Agent')).toBeInTheDocument()
  })

  it('should render runtime agents', () => {
    // Arrange & Act
    render(<AiTeamSection />)

    // Assert
    expect(screen.getByText('Domain Agent')).toBeInTheDocument()
    expect(screen.getByText('Personas Agent')).toBeInTheDocument()
    expect(screen.getByText('Integration Agent')).toBeInTheDocument()
  })

  it('should render the development agents card title', () => {
    // Arrange & Act
    render(<AiTeamSection />)

    // Assert
    expect(screen.getByText('Development Agents')).toBeInTheDocument()
  })

  it('should render the runtime agents card title', () => {
    // Arrange & Act
    render(<AiTeamSection />)

    // Assert
    expect(screen.getByText('Runtime Agents')).toBeInTheDocument()
  })
})
