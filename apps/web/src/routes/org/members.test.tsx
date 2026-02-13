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
  redirect: vi.fn(),
}))

vi.mock('@repo/ui', () => ({
  Badge: ({ children, variant, ...props }: React.PropsWithChildren<{ variant?: string }>) => (
    <span data-variant={variant} {...props}>
      {children}
    </span>
  ),
  Button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button {...props}>{children}</button>
  ),
  Card: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardTitle: ({ children }: React.PropsWithChildren) => <h3>{children}</h3>,
  Dialog: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogClose: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogFooter: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  Input: (props: Record<string, unknown>) => <input {...props} />,
  Label: ({
    children,
    htmlFor,
    ...props
  }: React.PropsWithChildren<{ htmlFor?: string; [key: string]: unknown }>) => (
    <label htmlFor={htmlFor} {...props}>
      {children}
    </label>
  ),
  Select: ({
    children,
  }: React.PropsWithChildren<{ value?: string; onValueChange?: (v: string) => void }>) => (
    <div>{children}</div>
  ),
  SelectContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectItem: ({ children, value }: React.PropsWithChildren<{ value: string }>) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  SelectValue: () => <span />,
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useActiveOrganization: vi.fn(() => ({ data: null })),
    organization: {
      inviteMember: vi.fn(),
      removeMember: vi.fn(),
      updateMemberRole: vi.fn(),
      cancelInvitation: vi.fn(),
    },
  },
  useSession: vi.fn(() => ({ data: null })),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

mockParaglideMessages()

// Import after mocks to trigger createFileRoute and capture the component
import './members'
import { authClient, useSession } from '@/lib/auth-client'

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function createMember(
  overrides: Partial<{
    id: string
    role: string
    createdAt: string
    user: { name: string; email: string }
  }> = {}
) {
  return {
    id: overrides.id ?? 'member-1',
    role: overrides.role ?? 'member',
    createdAt: overrides.createdAt ?? '2025-01-01T00:00:00Z',
    user: overrides.user ?? { name: 'Alice', email: 'alice@example.com' },
  }
}

function createInvitation(
  overrides: Partial<{
    id: string
    email: string
    role: string
    status: string
  }> = {}
) {
  return {
    id: overrides.id ?? 'inv-1',
    email: overrides.email ?? 'bob@example.com',
    role: overrides.role ?? 'member',
    status: overrides.status ?? 'pending',
  }
}

function permissionsForRole(role: string): string[] {
  switch (role) {
    case 'owner':
    case 'admin':
      return ['members:read', 'members:write', 'members:delete']
    default:
      return ['members:read']
  }
}

function setupOrg({
  members = [createMember()],
  invitations = [] as ReturnType<typeof createInvitation>[],
  activeMemberRole = 'owner',
}: {
  members?: ReturnType<typeof createMember>[]
  invitations?: ReturnType<typeof createInvitation>[]
  activeMemberRole?: string
} = {}) {
  vi.mocked(authClient.useActiveOrganization).mockReturnValue({
    data: {
      id: 'org-1',
      name: 'Acme Corp',
      slug: 'acme-corp',
      members,
      invitations,
    },
  } as unknown as ReturnType<typeof authClient.useActiveOrganization>)

  vi.mocked(useSession).mockReturnValue({
    data: { permissions: permissionsForRole(activeMemberRole) },
  } as unknown as ReturnType<typeof useSession>)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OrgMembersPage', () => {
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

  it('should render members table when org has members', () => {
    // Arrange
    setupOrg({
      members: [
        createMember({
          id: 'm-owner',
          role: 'owner',
          user: { name: 'Owner', email: 'owner@acme.com' },
        }),
        createMember({ id: 'm-dev', role: 'member', user: { name: 'Dev', email: 'dev@acme.com' } }),
      ],
    })

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert
    expect(screen.getByText('org_members_active')).toBeInTheDocument()
    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('owner@acme.com')).toBeInTheDocument()
    expect(screen.getByText('Dev')).toBeInTheDocument()
    expect(screen.getByText('dev@acme.com')).toBeInTheDocument()
  })

  it('should show invite button for owners', () => {
    // Arrange
    setupOrg({ activeMemberRole: 'owner' })

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert — appears in trigger button and dialog title
    const inviteElements = screen.getAllByText('org_invite_title')
    expect(inviteElements.length).toBeGreaterThanOrEqual(1)
  })

  it('should show invite button for admins', () => {
    // Arrange
    setupOrg({ activeMemberRole: 'admin' })

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert — appears in trigger button and dialog title
    const inviteElements = screen.getAllByText('org_invite_title')
    expect(inviteElements.length).toBeGreaterThanOrEqual(1)
  })

  it('should not show invite button for regular members', () => {
    // Arrange
    setupOrg({ activeMemberRole: 'member' })

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert
    // The invite title appears inside the dialog trigger — it should not render at all
    const inviteButtons = screen.queryAllByText('org_invite_title')
    expect(inviteButtons.length).toBe(0)
  })

  it('should not show remove button for the owner row', () => {
    // Arrange
    setupOrg({
      members: [
        createMember({
          id: 'm-owner',
          role: 'owner',
          user: { name: 'Owner', email: 'owner@acme.com' },
        }),
        createMember({ id: 'm-dev', role: 'member', user: { name: 'Dev', email: 'dev@acme.com' } }),
      ],
      activeMemberRole: 'owner',
    })

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert — only 1 remove button (for the non-owner member), not 2
    const removeButtons = screen.getAllByText('org_members_remove')
    expect(removeButtons).toHaveLength(1)
  })

  it('should show pending invitations section', () => {
    // Arrange
    setupOrg({
      invitations: [
        createInvitation({
          id: 'inv-1',
          email: 'bob@example.com',
          role: 'member',
          status: 'pending',
        }),
      ],
    })

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert
    expect(screen.getByText('org_invitations_title')).toBeInTheDocument()
    expect(screen.getByText('bob@example.com')).toBeInTheDocument()
  })

  it('should show empty invitations message when no pending invitations', () => {
    // Arrange
    setupOrg({ invitations: [] })

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert
    expect(screen.getByText('org_invitations_empty')).toBeInTheDocument()
  })

  it('should render role badges correctly for owner', () => {
    // Arrange — a regular member viewing (no canManage), so owner role renders as Badge
    setupOrg({
      members: [
        createMember({
          id: 'm-owner',
          role: 'owner',
          user: { name: 'Owner', email: 'owner@acme.com' },
        }),
      ],
      activeMemberRole: 'member',
    })

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert
    const badge = screen.getByText('org_role_owner')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveAttribute('data-variant', 'default')
  })

  it('should render role badges correctly for admin', () => {
    // Arrange — a regular member viewing, so admin role renders as Badge
    setupOrg({
      members: [
        createMember({
          id: 'm-admin',
          role: 'admin',
          user: { name: 'Admin', email: 'admin@acme.com' },
        }),
      ],
      activeMemberRole: 'member',
    })

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert
    const badge = screen.getByText('org_role_admin')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveAttribute('data-variant', 'secondary')
  })

  it('should render role badges correctly for member', () => {
    // Arrange — a regular member viewing, so member role renders as Badge
    setupOrg({
      members: [
        createMember({
          id: 'm-member',
          role: 'member',
          user: { name: 'Member', email: 'member@acme.com' },
        }),
      ],
      activeMemberRole: 'member',
    })

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert
    const badge = screen.getByText('org_role_member')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveAttribute('data-variant', 'outline')
  })

  it('should show actions column header when user can manage', () => {
    // Arrange
    setupOrg({ activeMemberRole: 'owner' })

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert
    expect(screen.getAllByText('org_members_actions').length).toBeGreaterThanOrEqual(1)
  })

  it('should not show actions column when user is a regular member', () => {
    // Arrange
    setupOrg({ activeMemberRole: 'member' })

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert
    expect(screen.queryByText('org_members_actions')).not.toBeInTheDocument()
  })

  it('should show empty members message when org has no members', () => {
    // Arrange
    setupOrg({ members: [] })

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert
    expect(screen.getByText('org_members_empty')).toBeInTheDocument()
  })

  it('should render role select (not badge) for non-owner members when user can manage', () => {
    // Arrange — owner viewing a regular member should see a Select, not a Badge
    setupOrg({
      members: [
        createMember({ id: 'm-dev', role: 'member', user: { name: 'Dev', email: 'dev@acme.com' } }),
      ],
      activeMemberRole: 'owner',
    })

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert — should see SelectItem options for admin and member
    const adminOptions = screen.getAllByText('org_role_admin')
    expect(adminOptions.length).toBeGreaterThanOrEqual(1)
    const memberOptions = screen.getAllByText('org_role_member')
    expect(memberOptions.length).toBeGreaterThanOrEqual(1)
  })

  it('should filter invitations to only show pending ones', () => {
    // Arrange — provide a mix of pending and non-pending invitations
    setupOrg({
      invitations: [
        createInvitation({ id: 'inv-1', email: 'pending@acme.com', status: 'pending' }),
        createInvitation({ id: 'inv-2', email: 'accepted@acme.com', status: 'accepted' }),
      ],
    })

    // Act
    const Page = captured.Component
    render(<Page />)

    // Assert — only the pending invitation should be visible
    expect(screen.getByText('pending@acme.com')).toBeInTheDocument()
    expect(screen.queryByText('accepted@acme.com')).not.toBeInTheDocument()
  })
})
