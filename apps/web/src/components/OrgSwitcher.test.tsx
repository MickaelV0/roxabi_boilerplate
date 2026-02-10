import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mockParaglideMessages } from '@/test/mock-messages'

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

vi.mock('@repo/ui', () => ({
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
    ...props
  }: React.PropsWithChildren<{ onClick?: () => void }>) => (
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
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useListOrganizations: vi.fn(() => ({ data: null })),
    useActiveOrganization: vi.fn(() => ({ data: null })),
    organization: {
      setActive: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

mockParaglideMessages()

import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { OrgSwitcher } from './OrgSwitcher'

function setupWithOrgs() {
  vi.mocked(authClient.useListOrganizations).mockReturnValue({
    data: [
      { id: 'org-1', name: 'Acme Corp', slug: 'acme-corp' },
      { id: 'org-2', name: 'Beta Inc', slug: 'beta-inc' },
    ],
  } as ReturnType<typeof authClient.useListOrganizations>)
  vi.mocked(authClient.useActiveOrganization).mockReturnValue({
    data: { id: 'org-1', name: 'Acme Corp', slug: 'acme-corp' },
  } as ReturnType<typeof authClient.useActiveOrganization>)
}

describe('OrgSwitcher', () => {
  it('should show create organization button when user has no orgs', () => {
    render(<OrgSwitcher />)

    expect(screen.getAllByText('org_create').length).toBeGreaterThanOrEqual(1)
  })

  it('should show org name in trigger when orgs exist', () => {
    setupWithOrgs()

    render(<OrgSwitcher />)

    expect(screen.getAllByText('Acme Corp').length).toBeGreaterThanOrEqual(1)
  })

  it('should show org list items when orgs exist', () => {
    setupWithOrgs()

    render(<OrgSwitcher />)

    const menuItems = screen.getAllByRole('menuitem')
    // 2 org items + 1 "Create organization" item
    expect(menuItems.length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('Acme Corp').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Beta Inc')).toBeInTheDocument()
  })

  it('should show check icon next to active org', () => {
    setupWithOrgs()

    render(<OrgSwitcher />)

    // The Check icon should be rendered for the active org
    expect(screen.getByTestId('check-icon')).toBeInTheDocument()
  })

  it('should call setActive when clicking a non-active org', async () => {
    // Arrange
    setupWithOrgs()
    vi.mocked(authClient.organization.setActive).mockResolvedValue({} as never)

    render(<OrgSwitcher />)

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
    setupWithOrgs()
    vi.mocked(authClient.organization.setActive).mockResolvedValue({} as never)

    render(<OrgSwitcher />)

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
    setupWithOrgs()
    vi.mocked(authClient.organization.setActive).mockClear()

    render(<OrgSwitcher />)

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
    setupWithOrgs()
    vi.mocked(authClient.organization.setActive).mockRejectedValue(new Error('fail'))

    render(<OrgSwitcher />)

    // Act
    const betaItem = getClosestAncestor(screen.getByText('Beta Inc'), 'button')
    fireEvent.click(betaItem)

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('auth_toast_error')
    })
  })
})

describe('CreateOrgDialogContent', () => {
  it('should render form fields with labels', () => {
    // Arrange - render with no orgs so the create dialog is shown
    vi.mocked(authClient.useListOrganizations).mockReturnValue({
      data: null,
    } as ReturnType<typeof authClient.useListOrganizations>)

    // Act
    render(<OrgSwitcher />)

    // Assert
    expect(screen.getByText('org_create_title')).toBeInTheDocument()
    expect(screen.getByText('org_create_desc')).toBeInTheDocument()
    expect(screen.getByLabelText('org_name')).toBeInTheDocument()
    expect(screen.getByLabelText('org_slug')).toBeInTheDocument()
  })

  it('should call organization.create with name and slug on form submit', async () => {
    // Arrange
    vi.mocked(authClient.useListOrganizations).mockReturnValue({
      data: null,
    } as ReturnType<typeof authClient.useListOrganizations>)
    vi.mocked(authClient.organization.create).mockResolvedValue({ error: null } as never)

    render(<OrgSwitcher />)

    const nameInput = screen.getByLabelText('org_name')
    const slugInput = screen.getByLabelText('org_slug')

    // Act
    fireEvent.change(nameInput, { target: { value: 'New Org' } })
    fireEvent.change(slugInput, { target: { value: 'new-org' } })
    fireEvent.submit(getClosestAncestor(nameInput, 'form'))

    // Assert
    await waitFor(() => {
      expect(authClient.organization.create).toHaveBeenCalledWith({
        name: 'New Org',
        slug: 'new-org',
      })
    })
  })

  it('should show success toast on successful org creation', async () => {
    // Arrange
    vi.mocked(authClient.useListOrganizations).mockReturnValue({
      data: null,
    } as ReturnType<typeof authClient.useListOrganizations>)
    vi.mocked(authClient.organization.create).mockResolvedValue({ error: null } as never)

    render(<OrgSwitcher />)

    const nameInput = screen.getByLabelText('org_name')
    const slugInput = screen.getByLabelText('org_slug')

    // Act
    fireEvent.change(nameInput, { target: { value: 'New Org' } })
    fireEvent.change(slugInput, { target: { value: 'new-org' } })
    fireEvent.submit(getClosestAncestor(nameInput, 'form'))

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith('org_toast_created')
    })
  })

  it('should show error toast when create returns an error', async () => {
    // Arrange
    vi.mocked(authClient.useListOrganizations).mockReturnValue({
      data: null,
    } as ReturnType<typeof authClient.useListOrganizations>)
    vi.mocked(authClient.organization.create).mockResolvedValue({
      error: { message: 'Slug taken' },
    } as never)

    render(<OrgSwitcher />)

    const nameInput = screen.getByLabelText('org_name')
    const slugInput = screen.getByLabelText('org_slug')

    // Act
    fireEvent.change(nameInput, { target: { value: 'New Org' } })
    fireEvent.change(slugInput, { target: { value: 'new-org' } })
    fireEvent.submit(getClosestAncestor(nameInput, 'form'))

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Slug taken')
    })
  })

  it('should show generic error toast when create throws', async () => {
    // Arrange
    vi.mocked(authClient.useListOrganizations).mockReturnValue({
      data: null,
    } as ReturnType<typeof authClient.useListOrganizations>)
    vi.mocked(authClient.organization.create).mockRejectedValue(new Error('network'))

    render(<OrgSwitcher />)

    const nameInput = screen.getByLabelText('org_name')
    const slugInput = screen.getByLabelText('org_slug')

    // Act
    fireEvent.change(nameInput, { target: { value: 'New Org' } })
    fireEvent.change(slugInput, { target: { value: 'new-org' } })
    fireEvent.submit(getClosestAncestor(nameInput, 'form'))

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('auth_toast_error')
    })
  })
})
