import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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

vi.mock('@/paraglide/runtime', () => ({
  getLocale: () => 'en',
}))

mockParaglideMessages()

// Import after mocks to trigger createFileRoute and capture the component
import './members'
import { toast } from 'sonner'
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
    if (typeof url === 'string' && url.includes('/api/admin/invitations')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      })
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve(null) })
  })
  globalThis.fetch = mockFetch
  return mockFetch
}

function setupFetchError(errorMessage = 'Server error') {
  const mockFetch = vi.fn().mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/api/admin/invitations')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      })
    }
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

/**
 * Extended fetch mock that handles POST (invite) and PATCH (role change) requests
 * in addition to the standard GET endpoints.
 */
function setupFetchWithMutations({
  members = [createMember()],
  roles = createRolesResponse(),
  inviteResult = { ok: true, body: { success: true } },
  updateRoleResult = { ok: true, body: { success: true } },
}: {
  members?: ReturnType<typeof createMember>[]
  roles?: ReturnType<typeof createRolesResponse>
  inviteResult?: { ok: boolean; body: unknown }
  updateRoleResult?: { ok: boolean; body: unknown }
} = {}) {
  const mockFetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET'

    // POST /api/admin/members/invite
    if (typeof url === 'string' && url.includes('/api/admin/members/invite') && method === 'POST') {
      return Promise.resolve({
        ok: inviteResult.ok,
        json: () => Promise.resolve(inviteResult.body),
      })
    }

    // PATCH /api/admin/members/:id (role change)
    if (typeof url === 'string' && url.includes('/api/admin/members/') && method === 'PATCH') {
      return Promise.resolve({
        ok: updateRoleResult.ok,
        json: () => Promise.resolve(updateRoleResult.body),
      })
    }

    // GET /api/admin/members
    if (typeof url === 'string' && url.includes('/api/admin/members')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            createMembersResponse(members, {
              page: 1,
              limit: 20,
              total: members.length,
              totalPages: 1,
            })
          ),
      })
    }

    // GET /api/roles
    if (typeof url === 'string' && url.includes('/api/roles')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(roles),
      })
    }

    // GET /api/admin/invitations
    if (typeof url === 'string' && url.includes('/api/admin/invitations')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
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
    expect(screen.getByText('admin_error_retry')).toBeInTheDocument()
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

    // Assert — uses i18n key: admin_members_count({"count":2})
    await waitFor(() => {
      expect(screen.getByText(/admin_members_count/)).toBeInTheDocument()
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

// ---------------------------------------------------------------------------
// InviteDialog — form submission flow (Warning 18)
// ---------------------------------------------------------------------------

describe('InviteDialog', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve(null),
    })
  })

  it('should disable submit button when email is empty', async () => {
    // Arrange
    setupActiveOrg()
    setupFetchWithMutations()

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert — the submit button text is org_invite_send, disabled when no email
    await waitFor(() => {
      expect(screen.getByText('org_invite_send')).toBeInTheDocument()
    })
    const submitButton = screen.getByText('org_invite_send')
    expect(submitButton).toBeDisabled()
  })

  it('should enable submit button when email is provided', async () => {
    // Arrange
    setupActiveOrg()
    setupFetchWithMutations()

    const Page = captured.Component
    render(<Page />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('org_invite_email_placeholder')).toBeInTheDocument()
    })

    // Act
    const emailInput = screen.getByPlaceholderText('org_invite_email_placeholder')
    fireEvent.change(emailInput, { target: { value: 'new@acme.com' } })

    // Assert
    const submitButton = screen.getByText('org_invite_send')
    expect(submitButton).not.toBeDisabled()
  })

  it('should call invite API with email and roleId on form submit', async () => {
    // Arrange
    setupActiveOrg()
    const mockFetch = setupFetchWithMutations()

    const Page = captured.Component
    render(<Page />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('org_invite_email_placeholder')).toBeInTheDocument()
    })

    // Act
    const emailInput = screen.getByPlaceholderText('org_invite_email_placeholder')
    fireEvent.change(emailInput, { target: { value: 'newuser@acme.com' } })

    const submitButton = screen.getByText('org_invite_send')
    fireEvent.click(submitButton)

    // Assert
    await waitFor(() => {
      const inviteCalls = mockFetch.mock.calls.filter(
        ([url, init]: [string, RequestInit | undefined]) =>
          typeof url === 'string' &&
          url.includes('/api/admin/members/invite') &&
          init?.method === 'POST'
      )
      expect(inviteCalls).toHaveLength(1)
      const body = JSON.parse(inviteCalls[0][1].body as string)
      expect(body.email).toBe('newuser@acme.com')
      expect(body.roleId).toBeTruthy()
    })
  })

  it('should show success toast after successful invite', async () => {
    // Arrange
    setupActiveOrg()
    setupFetchWithMutations()

    const Page = captured.Component
    render(<Page />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('org_invite_email_placeholder')).toBeInTheDocument()
    })

    // Act
    const emailInput = screen.getByPlaceholderText('org_invite_email_placeholder')
    fireEvent.change(emailInput, { target: { value: 'new@acme.com' } })

    const submitButton = screen.getByText('org_invite_send')
    fireEvent.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
        expect.stringContaining('org_toast_invited')
      )
    })
  })

  it('should clear email field after successful invite', async () => {
    // Arrange
    setupActiveOrg()
    setupFetchWithMutations()

    const Page = captured.Component
    render(<Page />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('org_invite_email_placeholder')).toBeInTheDocument()
    })

    // Act
    const emailInput = screen.getByPlaceholderText('org_invite_email_placeholder')
    fireEvent.change(emailInput, { target: { value: 'new@acme.com' } })

    const submitButton = screen.getByText('org_invite_send')
    fireEvent.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(emailInput).toHaveValue('')
    })
  })

  it('should show error toast when invite API returns duplicate email error', async () => {
    // Arrange
    setupActiveOrg()
    setupFetchWithMutations({
      inviteResult: {
        ok: false,
        body: { message: 'Email already exists in this organization' },
      },
    })

    const Page = captured.Component
    render(<Page />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('org_invite_email_placeholder')).toBeInTheDocument()
    })

    // Act
    const emailInput = screen.getByPlaceholderText('org_invite_email_placeholder')
    fireEvent.change(emailInput, { target: { value: 'existing@acme.com' } })

    const submitButton = screen.getByText('org_invite_send')
    fireEvent.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        'Email already exists in this organization'
      )
    })
  })

  it('should show error toast when invite API returns pending invitation error', async () => {
    // Arrange
    setupActiveOrg()
    setupFetchWithMutations({
      inviteResult: {
        ok: false,
        body: { message: 'An invitation is already pending for this email' },
      },
    })

    const Page = captured.Component
    render(<Page />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('org_invite_email_placeholder')).toBeInTheDocument()
    })

    // Act
    const emailInput = screen.getByPlaceholderText('org_invite_email_placeholder')
    fireEvent.change(emailInput, { target: { value: 'pending@acme.com' } })

    const submitButton = screen.getByText('org_invite_send')
    fireEvent.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        'An invitation is already pending for this email'
      )
    })
  })

  it('should not call invite API when email is empty', async () => {
    // Arrange
    setupActiveOrg()
    const mockFetch = setupFetchWithMutations()

    const Page = captured.Component
    render(<Page />)

    await waitFor(() => {
      expect(screen.getByText('org_invite_send')).toBeInTheDocument()
    })

    // Assert — button is disabled, no POST request should be made
    const submitButton = screen.getByText('org_invite_send')
    expect(submitButton).toBeDisabled()

    const inviteCalls = mockFetch.mock.calls.filter(
      ([url, init]: [string, RequestInit | undefined]) =>
        typeof url === 'string' &&
        url.includes('/api/admin/members/invite') &&
        init?.method === 'POST'
    )
    expect(inviteCalls).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// RoleSelect — role change flow (Warning 19)
// ---------------------------------------------------------------------------

describe('RoleSelect', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve(null),
    })
  })

  it('should render role select with options for non-owner members', async () => {
    // Arrange
    setupActiveOrg()
    setupFetchWithMutations({
      members: [
        createMember({
          id: 'm-dev',
          role: 'member',
          user: { id: 'u-2', name: 'Dev', email: 'dev@acme.com', image: null },
        }),
      ],
    })

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert — role select should show option elements for each role
    await waitFor(() => {
      const adminOptions = screen.getAllByText('org_role_admin')
      expect(adminOptions.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('should render badge instead of select for owner members', async () => {
    // Arrange
    setupActiveOrg()
    setupFetchWithMutations({
      members: [
        createMember({
          id: 'm-owner',
          role: 'owner',
          user: { id: 'u-1', name: 'Owner', email: 'owner@acme.com', image: null },
        }),
      ],
    })

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert — owner role renders as Badge (span with data-variant)
    await waitFor(() => {
      const ownerTexts = screen.getAllByText('org_role_owner')
      const badge = ownerTexts.find((el) => el.getAttribute('data-variant') === 'default')
      expect(badge).toBeDefined()
    })
  })

  it('should call update role API when a new role is selected', async () => {
    // Arrange
    setupActiveOrg()
    const mockFetch = setupFetchWithMutations({
      members: [
        createMember({
          id: 'm-dev',
          role: 'member',
          user: { id: 'u-2', name: 'Dev', email: 'dev@acme.com', image: null },
        }),
      ],
    })

    const Page = captured.Component
    render(<Page />)

    await waitFor(() => {
      expect(screen.getByText('Dev')).toBeInTheDocument()
    })

    // Act — click the admin option in the RoleSelect for the non-owner member
    // Scope to the member's table row to avoid hitting InviteDialog's Select
    const devRow = screen.getByText('Dev').closest('tr')!
    const adminOption = within(devRow)
      .getAllByRole('option')
      .find((el) => el.textContent === 'org_role_admin')
    expect(adminOption).toBeTruthy()
    fireEvent.click(adminOption!)

    // Assert — PATCH request sent with correct member ID and role ID
    await waitFor(() => {
      const patchCalls = mockFetch.mock.calls.filter(
        ([url, init]: [string, RequestInit | undefined]) =>
          typeof url === 'string' &&
          url.includes('/api/admin/members/m-dev') &&
          init?.method === 'PATCH'
      )
      expect(patchCalls).toHaveLength(1)
      const body = JSON.parse(patchCalls[0][1].body as string)
      expect(body.roleId).toBe('r-admin')
    })
  })

  it('should show success toast after successful role update', async () => {
    // Arrange
    setupActiveOrg()
    setupFetchWithMutations({
      members: [
        createMember({
          id: 'm-dev',
          role: 'member',
          user: { id: 'u-2', name: 'Dev', email: 'dev@acme.com', image: null },
        }),
      ],
    })

    const Page = captured.Component
    render(<Page />)

    await waitFor(() => {
      expect(screen.getByText('Dev')).toBeInTheDocument()
    })

    // Act — scope to member row to avoid InviteDialog's Select
    const devRow = screen.getByText('Dev').closest('tr')!
    const adminOption = within(devRow)
      .getAllByRole('option')
      .find((el) => el.textContent === 'org_role_admin')
    fireEvent.click(adminOption!)

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith('org_toast_role_updated')
    })
  })

  it('should show error toast when role update fails', async () => {
    // Arrange
    setupActiveOrg()
    setupFetchWithMutations({
      members: [
        createMember({
          id: 'm-dev',
          role: 'member',
          user: { id: 'u-2', name: 'Dev', email: 'dev@acme.com', image: null },
        }),
      ],
      updateRoleResult: {
        ok: false,
        body: { message: 'Cannot change role of this member' },
      },
    })

    const Page = captured.Component
    render(<Page />)

    await waitFor(() => {
      expect(screen.getByText('Dev')).toBeInTheDocument()
    })

    // Act — scope to member row to avoid InviteDialog's Select
    const devRow = screen.getByText('Dev').closest('tr')!
    const adminOption = within(devRow)
      .getAllByRole('option')
      .find((el) => el.textContent === 'org_role_admin')
    fireEvent.click(adminOption!)

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Cannot change role of this member')
    })
  })

  it('should refetch members after successful role update', async () => {
    // Arrange
    setupActiveOrg()
    const mockFetch = setupFetchWithMutations({
      members: [
        createMember({
          id: 'm-dev',
          role: 'member',
          user: { id: 'u-2', name: 'Dev', email: 'dev@acme.com', image: null },
        }),
      ],
    })

    const Page = captured.Component
    render(<Page />)

    await waitFor(() => {
      expect(screen.getByText('Dev')).toBeInTheDocument()
    })

    // Count initial GET /api/admin/members calls
    const initialMemberFetches = mockFetch.mock.calls.filter(
      ([url, init]: [string, RequestInit | undefined]) =>
        typeof url === 'string' &&
        url.includes('/api/admin/members') &&
        !url.includes('/invite') &&
        (!init?.method || init.method === 'GET')
    ).length

    // Act — scope to member row to avoid InviteDialog's Select
    const devRow = screen.getByText('Dev').closest('tr')!
    const adminOption = within(devRow)
      .getAllByRole('option')
      .find((el) => el.textContent === 'org_role_admin')
    fireEvent.click(adminOption!)

    // Assert — should trigger a refetch (additional GET call)
    await waitFor(() => {
      const totalMemberFetches = mockFetch.mock.calls.filter(
        ([url, init]: [string, RequestInit | undefined]) =>
          typeof url === 'string' &&
          url.includes('/api/admin/members') &&
          !url.includes('/invite') &&
          (!init?.method || init.method === 'GET')
      ).length
      expect(totalMemberFetches).toBeGreaterThan(initialMemberFetches)
    })
  })
})
