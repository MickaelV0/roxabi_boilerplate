import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockParaglideMessages } from '@/test/__mocks__/mock-messages'

function getClosestAncestor(element: Element, selector: string): Element {
  const result = element.closest(selector)
  if (!result) throw new Error(`No ancestor matching "${selector}" found`)
  return result
}

function findOrThrow<T>(items: T[], predicate: (item: T) => boolean): T {
  const result = items.find(predicate)
  if (!result) throw new Error('No item matching the predicate was found')
  return result
}

const mockRefetch = vi.hoisted(() => vi.fn())
const mockUseOrganizations = vi.hoisted(() =>
  vi.fn(() => ({
    data: undefined as
      | Array<{
          id: string
          name: string
          slug: string
          logo: string | null
          createdAt: string
        }>
      | undefined,
    isLoading: false,
    error: null as Error | null,
    refetch: mockRefetch,
  }))
)

vi.mock('@repo/ui', () => ({
  Badge: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <span data-testid="badge" {...props}>
      {children}
    </span>
  ),
  Button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button {...props}>{children}</button>
  ),
  Dialog: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogClose: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogDescription: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
  DialogFooter: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenu: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
    asChild,
    ...props
  }: React.PropsWithChildren<{ onClick?: () => void; asChild?: boolean }>) => (
    <button type="button" role="menuitem" onClick={onClick} {...props}>
      {children}
    </button>
  ),
  DropdownMenuLabel: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
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
}))

vi.mock('lucide-react', () => ({
  Check: () => <span data-testid="check-icon" />,
  ChevronDown: () => <span data-testid="chevron-down-icon" />,
  Plus: () => <span data-testid="plus-icon" />,
  Settings: () => <span data-testid="settings-icon" />,
  Users: () => <span data-testid="users-icon" />,
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    ...props
  }: React.PropsWithChildren<{ to: string; className?: string }>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(() => ({ data: { user: { id: 'user-1' } } })),
  authClient: {
    useActiveOrganization: vi.fn(() => ({ data: null })),
    organization: {
      setActive: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/use-organizations', () => ({
  useOrganizations: mockUseOrganizations,
}))

vi.mock('@/lib/org-utils', () => ({
  roleLabel: (role: string) => `org_role_${role}`,
  roleBadgeVariant: (role: string) => {
    if (role === 'owner') return 'default'
    if (role === 'admin') return 'secondary'
    return 'outline'
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const mockUseCanAccess = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/lib/route-permissions', () => ({
  useCanAccess: mockUseCanAccess,
}))

mockParaglideMessages()

import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { OrgSwitcher } from './OrgSwitcher'

function buildOrgState(
  overrides: Partial<ReturnType<typeof mockUseOrganizations>> = {}
): ReturnType<typeof mockUseOrganizations> {
  return {
    data: null,
    isLoading: false,
    error: null,
    refetch: mockRefetch,
    ...overrides,
  } as ReturnType<typeof mockUseOrganizations>
}

const orgsFixture = [
  { id: 'org-1', name: 'Acme Corp', slug: 'acme-corp', logo: null, createdAt: '2024-01-01' },
  { id: 'org-2', name: 'Beta Inc', slug: 'beta-inc', logo: null, createdAt: '2024-01-01' },
]

function setupWithOrgs({ includeMembers = false }: { includeMembers?: boolean } = {}) {
  vi.mocked(authClient.useActiveOrganization).mockReturnValue({
    data: {
      id: 'org-1',
      name: 'Acme Corp',
      slug: 'acme-corp',
      ...(includeMembers ? { members: [{ userId: 'user-1', role: 'admin', id: 'member-1' }] } : {}),
    },
  } as ReturnType<typeof authClient.useActiveOrganization>)
  return buildOrgState({ data: orgsFixture })
}

describe('OrgSwitcher', () => {
  beforeEach(() => {
    mockUseCanAccess.mockReturnValue(false)
  })

  it('should render nothing while loading', () => {
    const { container } = render(
      <OrgSwitcher orgState={buildOrgState({ data: undefined, isLoading: true })} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('should show create organization button when user has no orgs', () => {
    render(<OrgSwitcher orgState={buildOrgState({ data: [] })} />)

    expect(screen.getAllByText('org_create').length).toBeGreaterThanOrEqual(1)
  })

  it('should show org name in trigger when orgs exist', () => {
    const orgState = setupWithOrgs()

    render(<OrgSwitcher orgState={orgState} />)

    expect(screen.getAllByText('Acme Corp').length).toBeGreaterThanOrEqual(1)
  })

  it('should show org list items when orgs exist', () => {
    const orgState = setupWithOrgs()

    render(<OrgSwitcher orgState={orgState} />)

    const menuItems = screen.getAllByRole('menuitem')
    // 2 org items + org settings + members + "Create organization" item
    expect(menuItems.length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('Acme Corp').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Beta Inc')).toBeInTheDocument()
  })

  it('should show check icon next to active org', () => {
    const orgState = setupWithOrgs()

    render(<OrgSwitcher orgState={orgState} />)

    // The Check icon should be rendered for the active org
    expect(screen.getByTestId('check-icon')).toBeInTheDocument()
  })

  it('should show role badge when active org includes members data', () => {
    // Arrange
    const orgState = setupWithOrgs({ includeMembers: true })

    // Act
    render(<OrgSwitcher orgState={orgState} />)

    // Assert
    const badge = screen.getByTestId('badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('org_role_admin')
  })

  it('should call setActive when clicking a non-active org', async () => {
    // Arrange
    const orgState = setupWithOrgs()
    vi.mocked(authClient.organization.setActive).mockResolvedValue({} as never)

    render(<OrgSwitcher orgState={orgState} />)

    // Act - click the non-active org (Beta Inc)
    const betaItem = getClosestAncestor(screen.getByText('Beta Inc'), 'button')
    fireEvent.click(betaItem)

    // Assert
    await waitFor(() => {
      expect(authClient.organization.setActive).toHaveBeenCalledWith({
        organizationId: 'org-2',
      })
    })
  })

  it('should show success toast after switching org', async () => {
    // Arrange
    const orgState = setupWithOrgs()
    vi.mocked(authClient.organization.setActive).mockResolvedValue({} as never)

    render(<OrgSwitcher orgState={orgState} />)

    // Act
    const betaItem = getClosestAncestor(screen.getByText('Beta Inc'), 'button')
    fireEvent.click(betaItem)

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
        'org_toast_switched({"name":"Beta Inc"})'
      )
    })
  })

  it('should not call setActive when clicking the active org', () => {
    // Arrange
    const orgState = setupWithOrgs()
    vi.mocked(authClient.organization.setActive).mockClear()

    render(<OrgSwitcher orgState={orgState} />)

    // Act - click the active org (Acme Corp) via its menuitem
    const menuItems = screen.getAllByRole('menuitem')
    const acmeItem = findOrThrow(
      menuItems,
      (item) => item.textContent?.includes('Acme Corp') ?? false
    )
    fireEvent.click(acmeItem)

    // Assert
    expect(authClient.organization.setActive).not.toHaveBeenCalled()
  })

  it('should show error toast when switching org fails', async () => {
    // Arrange
    const orgState = setupWithOrgs()
    vi.mocked(authClient.organization.setActive).mockRejectedValue(new Error('fail'))

    render(<OrgSwitcher orgState={orgState} />)

    // Act
    const betaItem = getClosestAncestor(screen.getByText('Beta Inc'), 'button')
    fireEvent.click(betaItem)

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('auth_toast_error')
    })
  })

  it('should show org settings and members links when useCanAccess returns true', () => {
    // Arrange — useCanAccess returns true for admin routes
    mockUseCanAccess.mockReturnValue(true)
    const orgState = setupWithOrgs({ includeMembers: true })

    // Act
    render(<OrgSwitcher orgState={orgState} />)

    // Assert
    expect(screen.getByText('user_menu_org_settings')).toBeInTheDocument()
    expect(screen.getByText('user_menu_org_members')).toBeInTheDocument()
  })

  it('should hide org settings and members links when useCanAccess returns false', () => {
    // Arrange — useCanAccess returns false (default)
    mockUseCanAccess.mockReturnValue(false)
    const orgState = setupWithOrgs()

    // Act
    render(<OrgSwitcher orgState={orgState} />)

    // Assert
    expect(screen.queryByText('user_menu_org_settings')).not.toBeInTheDocument()
    expect(screen.queryByText('user_menu_org_members')).not.toBeInTheDocument()
  })
})

describe('CreateOrgDialogContent', () => {
  const noOrgsState = buildOrgState({ data: [] })

  it('should render form fields with labels', () => {
    render(<OrgSwitcher orgState={noOrgsState} />)

    expect(screen.getByText('org_create_title')).toBeInTheDocument()
    expect(screen.getByText('org_create_desc')).toBeInTheDocument()
    expect(screen.getByLabelText('org_name')).toBeInTheDocument()
    expect(screen.getByLabelText('org_slug')).toBeInTheDocument()
  })

  it('should call organization.create with name and slug on form submit', async () => {
    vi.mocked(authClient.organization.create).mockResolvedValue({ error: null } as never)

    render(<OrgSwitcher orgState={noOrgsState} />)

    const nameInput = screen.getByLabelText('org_name')
    const slugInput = screen.getByLabelText('org_slug')

    fireEvent.change(nameInput, { target: { value: 'New Org' } })
    fireEvent.change(slugInput, { target: { value: 'new-org' } })
    fireEvent.submit(getClosestAncestor(nameInput, 'form'))

    await waitFor(() => {
      expect(authClient.organization.create).toHaveBeenCalledWith({
        name: 'New Org',
        slug: 'new-org',
      })
    })
  })

  it('should show success toast on successful org creation', async () => {
    vi.mocked(authClient.organization.create).mockResolvedValue({ error: null } as never)

    render(<OrgSwitcher orgState={noOrgsState} />)

    const nameInput = screen.getByLabelText('org_name')
    const slugInput = screen.getByLabelText('org_slug')

    fireEvent.change(nameInput, { target: { value: 'New Org' } })
    fireEvent.change(slugInput, { target: { value: 'new-org' } })
    fireEvent.submit(getClosestAncestor(nameInput, 'form'))

    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith('org_toast_created')
    })
  })

  it('should show error toast when create returns an error', async () => {
    vi.mocked(authClient.organization.create).mockResolvedValue({
      error: { message: 'Slug taken' },
    } as never)

    render(<OrgSwitcher orgState={noOrgsState} />)

    const nameInput = screen.getByLabelText('org_name')
    const slugInput = screen.getByLabelText('org_slug')

    fireEvent.change(nameInput, { target: { value: 'New Org' } })
    fireEvent.change(slugInput, { target: { value: 'new-org' } })
    fireEvent.submit(getClosestAncestor(nameInput, 'form'))

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Slug taken')
    })
  })

  it('should show generic error toast when create throws', async () => {
    vi.mocked(authClient.organization.create).mockRejectedValue(new Error('network'))

    render(<OrgSwitcher orgState={noOrgsState} />)

    const nameInput = screen.getByLabelText('org_name')
    const slugInput = screen.getByLabelText('org_slug')

    fireEvent.change(nameInput, { target: { value: 'New Org' } })
    fireEvent.change(slugInput, { target: { value: 'new-org' } })
    fireEvent.submit(getClosestAncestor(nameInput, 'form'))

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('auth_toast_error')
    })
  })
})
