import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mockParaglideMessages } from '@/test/__mocks__/mock-messages'

const captured = vi.hoisted(() => ({
  Component: (() => null) as React.ComponentType,
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType }) => {
    captured.Component = config.component
    return { component: config.component }
  },
  Link: ({
    children,
    to,
    ...props
  }: React.PropsWithChildren<{ to: string; className?: string }>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  redirect: vi.fn(),
}))

vi.mock('@repo/ui', () => ({
  Button: ({
    children,
    asChild,
    ...props
  }: React.PropsWithChildren<{ asChild?: boolean; [key: string]: unknown }>) => (
    <button {...props}>{children}</button>
  ),
  Card: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardTitle: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <h2 {...props}>{children}</h2>
  ),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    getSession: vi.fn(),
    useActiveOrganization: vi.fn(() => ({ data: null })),
  },
  useSession: vi.fn(() => ({
    data: { user: { name: 'Ada Lovelace' } },
  })),
}))

mockParaglideMessages()

// Import to trigger createFileRoute and capture the component
import './dashboard'
import { authClient, useSession } from '@/lib/auth-client'

describe('DashboardPage', () => {
  it('should render welcome message with user name', () => {
    // Arrange
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Ada Lovelace' } },
    } as ReturnType<typeof useSession>)
    const DashboardPage = captured.Component

    // Act
    render(<DashboardPage />)

    // Assert
    expect(screen.getByText('dashboard_welcome({"name":"Ada Lovelace"})')).toBeInTheDocument()
  })

  it('should render org context when active org exists', () => {
    // Arrange
    vi.mocked(authClient.useActiveOrganization).mockReturnValue({
      data: { id: 'org-1', name: 'Acme Corp', slug: 'acme-corp' },
    } as ReturnType<typeof authClient.useActiveOrganization>)
    const DashboardPage = captured.Component

    // Act
    render(<DashboardPage />)

    // Assert
    expect(screen.getByText('dashboard_org_context({"name":"Acme Corp"})')).toBeInTheDocument()
  })

  it('should render fallback when no active org', () => {
    // Arrange
    vi.mocked(authClient.useActiveOrganization).mockReturnValue({
      data: null,
    } as ReturnType<typeof authClient.useActiveOrganization>)
    const DashboardPage = captured.Component

    // Act
    render(<DashboardPage />)

    // Assert
    expect(screen.getByText('dashboard_no_org')).toBeInTheDocument()
  })

  it('should render quick action links', () => {
    // Arrange
    vi.mocked(authClient.useActiveOrganization).mockReturnValue({
      data: null,
    } as ReturnType<typeof authClient.useActiveOrganization>)
    const DashboardPage = captured.Component

    // Act
    render(<DashboardPage />)

    // Assert
    expect(screen.getByText('dashboard_quick_actions')).toBeInTheDocument()
    expect(screen.getByText('dashboard_org_settings')).toBeInTheDocument()
    expect(screen.getByText('dashboard_team_members')).toBeInTheDocument()
    expect(screen.getByText('dashboard_documentation')).toBeInTheDocument()

    // Check link targets
    const settingsLink = screen.getByText('dashboard_open_settings').closest('a')
    expect(settingsLink).toHaveAttribute('href', '/org/settings')

    const membersLink = screen.getByText('dashboard_view_members').closest('a')
    expect(membersLink).toHaveAttribute('href', '/org/members')
  })
})
