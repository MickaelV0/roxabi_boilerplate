import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockParaglideMessages } from '@/test/__mocks__/mock-messages'

const captured = vi.hoisted(() => ({
  Component: (() => null) as React.ComponentType,
}))

const mockUseOrganizations = vi.hoisted(() =>
  vi.fn(() => ({
    data: [] as Array<{
      id: string
      name: string
      slug: string
      logo: string | null
      createdAt: string
    }>,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }))
)

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
  useNavigate: () => vi.fn(),
}))

vi.mock('@repo/ui', async () => await import('@/test/__mocks__/repo-ui'))

const mockSetActive = vi.fn().mockResolvedValue({})

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    getSession: vi.fn(),
    useActiveOrganization: vi.fn(() => ({ data: null })),
    organization: {
      setActive: (...args: unknown[]) => mockSetActive(...args),
    },
  },
  useSession: vi.fn(() => ({
    data: { user: { name: 'Ada Lovelace' } },
  })),
}))

vi.mock('@/lib/use-organizations', () => ({
  useOrganizations: mockUseOrganizations,
}))

vi.mock('@/lib/api', () => ({
  fetchUserProfile: vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({}),
  }),
  fetchOrganizations: vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve([]),
  }),
}))

mockParaglideMessages()

// Import to trigger createFileRoute and capture the component
import './dashboard'
import { authClient, useSession } from '@/lib/auth-client'

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render welcome message with user name', () => {
    // Arrange
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Ada Lovelace' } },
    } as ReturnType<typeof useSession>)
    mockUseOrganizations.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    const DashboardPage = captured.Component

    // Act
    render(<DashboardPage />)

    // Assert
    expect(screen.getByText('dashboard_welcome({"name":"Ada Lovelace"})')).toBeInTheDocument()
  })

  it('should render org context when active org exists', () => {
    // Arrange
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Ada Lovelace' } },
    } as ReturnType<typeof useSession>)
    vi.mocked(authClient.useActiveOrganization).mockReturnValue({
      data: { id: 'org-1', name: 'Acme Corp', slug: 'acme-corp' },
    } as ReturnType<typeof authClient.useActiveOrganization>)
    mockUseOrganizations.mockReturnValue({
      data: [
        { id: 'org-1', name: 'Acme Corp', slug: 'acme-corp', logo: null, createdAt: '2024-01-01' },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    const DashboardPage = captured.Component

    // Act
    render(<DashboardPage />)

    // Assert
    expect(screen.getByText('dashboard_org_context({"name":"Acme Corp"})')).toBeInTheDocument()
  })

  it('should render fallback when no active org', () => {
    // Arrange
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Ada Lovelace' } },
    } as ReturnType<typeof useSession>)
    vi.mocked(authClient.useActiveOrganization).mockReturnValue({
      data: null,
    } as ReturnType<typeof authClient.useActiveOrganization>)
    mockUseOrganizations.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    const DashboardPage = captured.Component

    // Act
    render(<DashboardPage />)

    // Assert
    expect(screen.getByText('dashboard_no_org')).toBeInTheDocument()
  })

  it('should render quick action links', () => {
    // Arrange
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Ada Lovelace' } },
    } as ReturnType<typeof useSession>)
    vi.mocked(authClient.useActiveOrganization).mockReturnValue({
      data: null,
    } as ReturnType<typeof authClient.useActiveOrganization>)
    mockUseOrganizations.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
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

  it('should show loading skeleton when orgs are loading', () => {
    // Arrange
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Ada Lovelace' } },
    } as ReturnType<typeof useSession>)
    mockUseOrganizations.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })
    const DashboardPage = captured.Component

    // Act
    render(<DashboardPage />)

    // Assert -- skeleton should be shown, not the welcome message
    expect(screen.queryByText('dashboard_welcome({"name":"Ada Lovelace"})')).not.toBeInTheDocument()
    // The loading skeleton has pulse divs
    const pulseElements = document.querySelectorAll('.animate-pulse')
    expect(pulseElements.length).toBeGreaterThan(0)
  })

  it('should auto-select first org when no active org', async () => {
    // Arrange
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Ada Lovelace' } },
    } as ReturnType<typeof useSession>)
    vi.mocked(authClient.useActiveOrganization).mockReturnValue({
      data: null,
    } as ReturnType<typeof authClient.useActiveOrganization>)
    mockUseOrganizations.mockReturnValue({
      data: [
        { id: 'org-1', name: 'Acme Corp', slug: 'acme-corp', logo: null, createdAt: '2024-01-01' },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    const DashboardPage = captured.Component

    // Act
    render(<DashboardPage />)

    // Assert -- setActive should be called with the first org
    await waitFor(() => {
      expect(mockSetActive).toHaveBeenCalledWith({ organizationId: 'org-1' })
    })
  })
})
