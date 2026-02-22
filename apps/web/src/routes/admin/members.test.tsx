import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockParaglideMessages } from '@/test/__mocks__/mock-messages'

const captured = vi.hoisted(() => ({
  Component: (() => null) as React.ComponentType,
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType }) => {
    captured.Component = config.component
    return { component: config.component }
  },
  redirect: vi.fn(),
}))

vi.mock('@repo/ui', async () => await import('@/test/__mocks__/repo-ui'))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useActiveOrganization: vi.fn(() => ({ data: null })),
  },
  useSession: vi.fn(() => ({ data: null })),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/org-utils', () => ({
  roleLabel: (role: string) => `org_role_${role}`,
  roleBadgeVariant: (role: string) => {
    switch (role) {
      case 'owner':
        return 'default'
      case 'admin':
        return 'secondary'
      default:
        return 'outline'
    }
  },
}))

mockParaglideMessages()

// Import after mocks to trigger createFileRoute and capture the component
import './members'
import { authClient } from '@/lib/auth-client'

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function createMember(
  overrides: Partial<{
    id: string
    userId: string
    role: string
    createdAt: string
    user: { id: string; name: string | null; email: string; image: string | null }
  }> = {}
) {
  return {
    id: overrides.id ?? 'member-1',
    userId: overrides.userId ?? 'user-1',
    role: overrides.role ?? 'member',
    createdAt: overrides.createdAt ?? '2025-01-01T00:00:00Z',
    user: overrides.user ?? {
      id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
      image: null,
    },
  }
}

function createMembersResponse(
  members: ReturnType<typeof createMember>[] = [createMember()],
  pagination = { page: 1, limit: 20, total: members.length, totalPages: 1 }
) {
  return { data: members, pagination }
}

function createRolesResponse() {
  return [
    { id: 'r-owner', name: 'owner' },
    { id: 'r-admin', name: 'admin' },
    { id: 'r-member', name: 'member' },
  ]
}

function setupActiveOrg() {
  vi.mocked(authClient.useActiveOrganization).mockReturnValue({
    data: { id: 'org-1', name: 'Acme Corp', slug: 'acme-corp' },
  } as ReturnType<typeof authClient.useActiveOrganization>)
}

function setupFetch(
  membersResponse: ReturnType<typeof createMembersResponse> = createMembersResponse(),
  rolesResponse: ReturnType<typeof createRolesResponse> = createRolesResponse()
) {
  const mockFetch = vi.fn().mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/api/admin/members')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(membersResponse),
      })
    }
    if (typeof url === 'string' && url.includes('/api/roles')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(rolesResponse),
      })
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve(null) })
  })
  globalThis.fetch = mockFetch
  return mockFetch
}

function setupFetchError(errorMessage = 'Server error') {
  const mockFetch = vi.fn().mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/api/admin/members')) {
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: errorMessage }),
      })
    }
    if (typeof url === 'string' && url.includes('/api/roles')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(createRolesResponse()),
      })
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve(null) })
  })
  globalThis.fetch = mockFetch
  return mockFetch
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AdminMembersPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // Provide a safe default fetch that handles relative URLs in jsdom
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve(null),
    })
  })

  it('should show "no org" message when no active organization', () => {
    // Arrange
    vi.mocked(authClient.useActiveOrganization).mockReturnValue({
      data: null,
    } as unknown as ReturnType<typeof authClient.useActiveOrganization>)

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert
    expect(screen.getByText('org_members_title')).toBeInTheDocument()
    expect(screen.getByText('org_switcher_no_org')).toBeInTheDocument()
  })

  it('should render loading skeleton initially', async () => {
    // Arrange
    setupActiveOrg()
    // Use a never-resolving fetch to keep loading state
    globalThis.fetch = vi.fn().mockImplementation(() => new Promise(() => {}))

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should render member table after data loads', async () => {
    // Arrange
    setupActiveOrg()
    setupFetch(
      createMembersResponse([
        createMember({
          id: 'm-owner',
          role: 'owner',
          user: { id: 'u-1', name: 'Owner User', email: 'owner@acme.com', image: null },
        }),
        createMember({
          id: 'm-dev',
          role: 'member',
          user: { id: 'u-2', name: 'Dev User', email: 'dev@acme.com', image: null },
        }),
      ])
    )

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Owner User')).toBeInTheDocument()
    })
    expect(screen.getByText('owner@acme.com')).toBeInTheDocument()
    expect(screen.getByText('Dev User')).toBeInTheDocument()
    expect(screen.getByText('dev@acme.com')).toBeInTheDocument()
  })

  it('should show invite dialog trigger button', async () => {
    // Arrange
    setupActiveOrg()
    setupFetch()

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert
    await waitFor(() => {
      const inviteElements = screen.getAllByText('org_invite_title')
      expect(inviteElements.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('should show invite form fields inside dialog', async () => {
    // Arrange
    setupActiveOrg()
    setupFetch()

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert -- Dialog mock renders children immediately (always open)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('org_invite_email_placeholder')).toBeInTheDocument()
    })
    expect(screen.getByText('org_invite_email')).toBeInTheDocument()
    expect(screen.getByText('org_invite_role')).toBeInTheDocument()
  })

  it('should render role badge for owner rows', async () => {
    // Arrange
    setupActiveOrg()
    setupFetch(
      createMembersResponse([
        createMember({
          id: 'm-owner',
          role: 'owner',
          user: { id: 'u-1', name: 'Owner', email: 'owner@acme.com', image: null },
        }),
      ])
    )

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert -- owner role renders as Badge (span with data-variant), may also appear in invite dialog SelectItem
    await waitFor(() => {
      const ownerTexts = screen.getAllByText('org_role_owner')
      expect(ownerTexts.length).toBeGreaterThanOrEqual(1)
      // The Badge element should have data-variant="default"
      const badge = ownerTexts.find((el) => el.getAttribute('data-variant') === 'default')
      expect(badge).toBeDefined()
    })
  })

  it('should render role select for non-owner members when roles are available', async () => {
    // Arrange
    setupActiveOrg()
    setupFetch(
      createMembersResponse([
        createMember({
          id: 'm-dev',
          role: 'member',
          user: { id: 'u-2', name: 'Dev', email: 'dev@acme.com', image: null },
        }),
      ])
    )

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert -- non-owner should see SelectItem options for roles
    await waitFor(() => {
      const roleOptions = screen.getAllByText('org_role_member')
      expect(roleOptions.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('should not show remove button for owner rows', async () => {
    // Arrange
    setupActiveOrg()
    setupFetch(
      createMembersResponse([
        createMember({
          id: 'm-owner',
          role: 'owner',
          user: { id: 'u-1', name: 'Owner', email: 'owner@acme.com', image: null },
        }),
        createMember({
          id: 'm-dev',
          role: 'member',
          user: { id: 'u-2', name: 'Dev', email: 'dev@acme.com', image: null },
        }),
      ])
    )

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert -- only 1 remove button (for non-owner member)
    await waitFor(() => {
      expect(screen.getByText('Dev')).toBeInTheDocument()
    })
    const removeButtons = screen.getAllByText('org_members_remove')
    expect(removeButtons).toHaveLength(1)
  })

  it('should show confirmation dialog when remove is clicked', async () => {
    // Arrange
    setupActiveOrg()
    setupFetch(
      createMembersResponse([
        createMember({
          id: 'm-dev',
          role: 'member',
          user: { id: 'u-2', name: 'Dev', email: 'dev@acme.com', image: null },
        }),
      ])
    )

    // Act
    const Page = captured.Component
    render(<Page />)

    await waitFor(() => {
      expect(screen.getByText('Dev')).toBeInTheDocument()
    })

    // Find and click the remove button (text in the table row)
    const removeButton = screen.getByText('org_members_remove')
    fireEvent.click(removeButton)

    // Assert -- AlertDialog becomes visible (mock renders when open=true)
    await waitFor(() => {
      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
    })
    expect(screen.getByText('org_members_remove_confirm')).toBeInTheDocument()
  })

  it('should show error state when fetch fails', async () => {
    // Arrange
    setupActiveOrg()
    setupFetchError('Failed to load members')

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Failed to load members')).toBeInTheDocument()
    })
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('should show search input', async () => {
    // Arrange
    setupActiveOrg()
    setupFetch()

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert
    await waitFor(() => {
      expect(screen.getByPlaceholderText('org_members_search_placeholder')).toBeInTheDocument()
    })
  })

  it('should filter members by name when searching', async () => {
    // Arrange
    setupActiveOrg()
    setupFetch(
      createMembersResponse([
        createMember({
          id: 'm-alice',
          role: 'member',
          user: { id: 'u-1', name: 'Alice Smith', email: 'alice@acme.com', image: null },
        }),
        createMember({
          id: 'm-bob',
          role: 'member',
          user: { id: 'u-2', name: 'Bob Jones', email: 'bob@acme.com', image: null },
        }),
      ])
    )

    const Page = captured.Component
    render(<Page />)

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })

    // Act
    const searchInput = screen.getByPlaceholderText('org_members_search_placeholder')
    fireEvent.change(searchInput, { target: { value: 'Alice' } })

    // Assert
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument()
  })

  it('should filter members by email when searching', async () => {
    // Arrange
    setupActiveOrg()
    setupFetch(
      createMembersResponse([
        createMember({
          id: 'm-alice',
          role: 'member',
          user: { id: 'u-1', name: 'Alice Smith', email: 'alice@acme.com', image: null },
        }),
        createMember({
          id: 'm-bob',
          role: 'member',
          user: { id: 'u-2', name: 'Bob Jones', email: 'bob@acme.com', image: null },
        }),
      ])
    )

    const Page = captured.Component
    render(<Page />)

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })

    // Act
    const searchInput = screen.getByPlaceholderText('org_members_search_placeholder')
    fireEvent.change(searchInput, { target: { value: 'bob@' } })

    // Assert
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument()
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
  })

  it('should show no-results message when search has no matches', async () => {
    // Arrange
    setupActiveOrg()
    setupFetch(
      createMembersResponse([
        createMember({
          id: 'm-alice',
          role: 'member',
          user: { id: 'u-1', name: 'Alice Smith', email: 'alice@acme.com', image: null },
        }),
      ])
    )

    const Page = captured.Component
    render(<Page />)

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })

    // Act
    const searchInput = screen.getByPlaceholderText('org_members_search_placeholder')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

    // Assert
    expect(screen.getByText('org_members_no_results')).toBeInTheDocument()
  })

  it('should show empty state when org has no members', async () => {
    // Arrange
    setupActiveOrg()
    setupFetch(createMembersResponse([]))

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('org_members_empty')).toBeInTheDocument()
    })
  })

  it('should show member count in card description', async () => {
    // Arrange
    setupActiveOrg()
    setupFetch(
      createMembersResponse(
        [
          createMember({
            id: 'm-1',
            user: { id: 'u-1', name: 'Alice', email: 'alice@acme.com', image: null },
          }),
          createMember({
            id: 'm-2',
            user: { id: 'u-2', name: 'Bob', email: 'bob@acme.com', image: null },
          }),
        ],
        { page: 1, limit: 20, total: 2, totalPages: 1 }
      )
    )

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/2 members/)).toBeInTheDocument()
    })
  })

  it('should show column headers in the members table', async () => {
    // Arrange
    setupActiveOrg()
    setupFetch()

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert
    await waitFor(() => {
      expect(screen.getByText('org_members_name')).toBeInTheDocument()
    })
    expect(screen.getByText('org_members_email')).toBeInTheDocument()
    expect(screen.getByText('org_members_role')).toBeInTheDocument()
    expect(screen.getByText('org_members_joined')).toBeInTheDocument()
    expect(screen.getByText('org_members_actions')).toBeInTheDocument()
  })
})
