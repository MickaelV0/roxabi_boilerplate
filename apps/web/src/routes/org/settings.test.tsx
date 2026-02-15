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
  useBlocker: () => ({ status: 'idle', proceed: vi.fn(), reset: vi.fn() }),
}))

vi.mock('@repo/ui', async () => await import('@/test/__mocks__/repo-ui'))

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
import { slugify } from './settings'

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

    // Make form dirty first
    const nameInput = screen.getByLabelText('org_name')
    fireEvent.change(nameInput, { target: { value: 'Changed Name' } })

    // Act
    const form = nameInput.closest('form')
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

    // Make form dirty first
    const nameInput = screen.getByLabelText('org_name')
    fireEvent.change(nameInput, { target: { value: 'Changed' } })

    // Act
    const form = nameInput.closest('form')
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

    // Make form dirty first
    const nameInput = screen.getByLabelText('org_name')
    fireEvent.change(nameInput, { target: { value: 'Changed' } })

    // Act
    const form = nameInput.closest('form')
    if (!form) throw new Error('form not found')
    fireEvent.submit(form)

    // Assert
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('auth_toast_error')
    })
  })

  it('should disable save button when form is not dirty (I8)', () => {
    // Arrange
    setupActiveOrg()
    setupOwnerMember()
    const OrgSettings = captured.Component

    // Act
    render(<OrgSettings />)

    // Assert — save button should be disabled when values match the active org
    const saveButton = screen.getByRole('button', { name: 'org_settings_save' })
    expect(saveButton).toBeDisabled()
  })

  it('should enable save button when form is dirty (I8)', () => {
    // Arrange
    setupActiveOrg()
    setupOwnerMember()
    const OrgSettings = captured.Component

    render(<OrgSettings />)

    // Act
    fireEvent.change(screen.getByLabelText('org_name'), { target: { value: 'Changed Name' } })

    // Assert
    const saveButton = screen.getByRole('button', { name: 'org_settings_save' })
    expect(saveButton).not.toBeDisabled()
  })

  it('should show type-to-confirm input in delete dialog (P2)', () => {
    // Arrange
    setupActiveOrg()
    setupOwnerMember()
    const OrgSettings = captured.Component

    // Act
    render(<OrgSettings />)

    // Assert — delete dialog content is rendered (mock renders all children)
    // The type-to-confirm prompt includes the org name parameter
    expect(screen.getByText('org_delete_type_confirm({"name":"Acme Corp"})')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('org_delete_type_placeholder')).toBeInTheDocument()
  })

  it('should show generate slug button for owners (P11)', () => {
    // Arrange
    setupActiveOrg()
    setupOwnerMember()
    const OrgSettings = captured.Component

    // Act
    render(<OrgSettings />)

    // Assert
    expect(screen.getByRole('button', { name: 'org_slug_generate' })).toBeInTheDocument()
  })

  it('should not show generate slug button for non-owner members (P11)', () => {
    // Arrange
    setupActiveOrg()
    setupMemberRole()
    const OrgSettings = captured.Component

    // Act
    render(<OrgSettings />)

    // Assert
    expect(screen.queryByRole('button', { name: 'org_slug_generate' })).not.toBeInTheDocument()
  })

  it('should generate slug from name when button is clicked (P11)', () => {
    // Arrange
    setupActiveOrg()
    setupOwnerMember()
    const OrgSettings = captured.Component

    render(<OrgSettings />)

    // Change the name
    fireEvent.change(screen.getByLabelText('org_name'), { target: { value: 'My New Org' } })

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'org_slug_generate' }))

    // Assert
    expect(screen.getByLabelText('org_slug')).toHaveValue('my-new-org')
  })
})

describe('slugify', () => {
  it('should convert text to lowercase slug', () => {
    expect(slugify('My New Org')).toBe('my-new-org')
  })

  it('should strip leading dashes', () => {
    expect(slugify('--leading')).toBe('leading')
  })

  it('should strip trailing dashes', () => {
    expect(slugify('trailing--')).toBe('trailing')
  })

  it('should collapse consecutive dashes', () => {
    expect(slugify('hello   world')).toBe('hello-world')
  })

  it('should remove non-ASCII characters', () => {
    expect(slugify('cafe resume')).toBe('cafe-resume')
  })

  it('should return empty string for empty input', () => {
    expect(slugify('')).toBe('')
  })

  it('should return input unchanged when already a valid slug', () => {
    expect(slugify('already-valid')).toBe('already-valid')
  })

  it('should replace underscores with dashes', () => {
    expect(slugify('hello_world')).toBe('hello-world')
  })
})
