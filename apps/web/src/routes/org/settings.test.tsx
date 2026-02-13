import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  useNavigate: () => vi.fn(),
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
  CardDescription: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
  CardHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  CardTitle: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <h2 {...props}>{children}</h2>
  ),
  Dialog: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogClose: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogDescription: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
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
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useActiveOrganization: vi.fn(() => ({ data: null })),
    organization: { update: vi.fn(), delete: vi.fn() },
  },
  useSession: vi.fn(() => ({ data: null })),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

mockParaglideMessages()

// Import after mocks to trigger createFileRoute and capture the component
import { toast } from 'sonner'
import { authClient, useSession } from '@/lib/auth-client'
import './settings'

function setupActiveOrg() {
  vi.mocked(authClient.useActiveOrganization).mockReturnValue({
    data: { id: 'org-1', name: 'Acme Corp', slug: 'acme-corp' },
  } as ReturnType<typeof authClient.useActiveOrganization>)
}

function setupOwnerMember() {
  vi.mocked(useSession).mockReturnValue({
    data: { permissions: ['organizations:read', 'organizations:write', 'organizations:delete'] },
  } as unknown as ReturnType<typeof useSession>)
}

function setupMemberRole() {
  vi.mocked(useSession).mockReturnValue({
    data: { permissions: ['organizations:read'] },
  } as unknown as ReturnType<typeof useSession>)
}

describe('OrgSettingsPage', () => {
  it('should show no-org message when no active organization', () => {
    // Arrange
    const OrgSettings = captured.Component

    // Act
    render(<OrgSettings />)

    // Assert
    expect(screen.getByText('org_settings_title')).toBeInTheDocument()
    expect(screen.getByText('org_switcher_no_org')).toBeInTheDocument()
  })

  it('should render org name and slug inputs when org is active', () => {
    // Arrange
    setupActiveOrg()
    setupOwnerMember()
    const OrgSettings = captured.Component

    // Act
    render(<OrgSettings />)

    // Assert
    expect(screen.getByLabelText('org_name')).toBeInTheDocument()
    expect(screen.getByLabelText('org_name')).toHaveValue('Acme Corp')
    expect(screen.getByLabelText('org_slug')).toBeInTheDocument()
    expect(screen.getByLabelText('org_slug')).toHaveValue('acme-corp')
  })

  it('should show read-only message for non-owner members', () => {
    // Arrange
    setupActiveOrg()
    setupMemberRole()
    const OrgSettings = captured.Component

    // Act
    render(<OrgSettings />)

    // Assert
    expect(screen.getByText('org_settings_read_only')).toBeInTheDocument()
  })

  it('should disable inputs for non-owner members', () => {
    // Arrange
    setupActiveOrg()
    setupMemberRole()
    const OrgSettings = captured.Component

    // Act
    render(<OrgSettings />)

    // Assert
    expect(screen.getByLabelText('org_name')).toBeDisabled()
    expect(screen.getByLabelText('org_slug')).toBeDisabled()
  })

  it('should show save button only for owners', () => {
    // Arrange
    setupActiveOrg()
    setupOwnerMember()
    const OrgSettings = captured.Component

    // Act
    render(<OrgSettings />)

    // Assert
    expect(screen.getByRole('button', { name: 'org_settings_save' })).toBeInTheDocument()
  })

  it('should not show save button for non-owner members', () => {
    // Arrange
    setupActiveOrg()
    setupMemberRole()
    const OrgSettings = captured.Component

    // Act
    render(<OrgSettings />)

    // Assert
    expect(screen.queryByRole('button', { name: 'org_settings_save' })).not.toBeInTheDocument()
  })

  it('should show danger zone only for owners', () => {
    // Arrange
    setupActiveOrg()
    setupOwnerMember()
    const OrgSettings = captured.Component

    // Act
    render(<OrgSettings />)

    // Assert
    expect(screen.getByText('org_settings_danger')).toBeInTheDocument()
    expect(screen.getByText('org_settings_danger_desc')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'org_delete' }).length).toBeGreaterThanOrEqual(1)
  })

  it('should not show danger zone for non-owner members', () => {
    // Arrange
    setupActiveOrg()
    setupMemberRole()
    const OrgSettings = captured.Component

    // Act
    render(<OrgSettings />)

    // Assert
    expect(screen.queryByText('org_settings_danger')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'org_delete' })).not.toBeInTheDocument()
  })

  it('should call organization.update on form submit', async () => {
    // Arrange
    setupActiveOrg()
    setupOwnerMember()
    vi.mocked(authClient.organization.update).mockResolvedValue({ error: null } as never)
    const OrgSettings = captured.Component

    render(<OrgSettings />)

    const nameInput = screen.getByLabelText('org_name')
    const slugInput = screen.getByLabelText('org_slug')

    // Act
    fireEvent.change(nameInput, { target: { value: 'New Name' } })
    fireEvent.change(slugInput, { target: { value: 'new-slug' } })
    const form = nameInput.closest('form')
    if (!form) throw new Error('form not found')
    fireEvent.submit(form)

    // Assert
    await waitFor(() => {
      expect(authClient.organization.update).toHaveBeenCalledWith({
        data: { name: 'New Name', slug: 'new-slug' },
      })
    })
  })

  it('should show success toast after successful update', async () => {
    // Arrange
    setupActiveOrg()
    setupOwnerMember()
    vi.mocked(authClient.organization.update).mockResolvedValue({ error: null } as never)
    const OrgSettings = captured.Component

    render(<OrgSettings />)

    // Act
    const form = screen.getByLabelText('org_name').closest('form')
    if (!form) throw new Error('form not found')
    fireEvent.submit(form)

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith('org_toast_updated')
    })
  })

  it('should show error toast when update returns an error', async () => {
    // Arrange
    setupActiveOrg()
    setupOwnerMember()
    vi.mocked(authClient.organization.update).mockResolvedValue({
      error: { message: 'Slug already taken' },
    } as never)
    const OrgSettings = captured.Component

    render(<OrgSettings />)

    // Act
    const form = screen.getByLabelText('org_name').closest('form')
    if (!form) throw new Error('form not found')
    fireEvent.submit(form)

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Slug already taken')
    })
  })

  it('should show generic error toast when update throws', async () => {
    // Arrange
    setupActiveOrg()
    setupOwnerMember()
    vi.mocked(authClient.organization.update).mockRejectedValue(new Error('network'))
    const OrgSettings = captured.Component

    render(<OrgSettings />)

    // Act
    const form = screen.getByLabelText('org_name').closest('form')
    if (!form) throw new Error('form not found')
    fireEvent.submit(form)

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('auth_toast_error')
    })
  })
})
