import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mock factories (extracted to keep vi.mock callback small)
// ---------------------------------------------------------------------------

function mockPassthrough({ children }: { children?: ReactNode }) {
  return <div>{children}</div>
}

function mockMenuItem({
  children,
  onClick,
  asChild,
}: {
  children?: ReactNode
  onClick?: (e: React.MouseEvent) => void
  asChild?: boolean
}) {
  if (asChild) return <>{children}</>
  return (
    <button type="button" data-testid="menu-item" onClick={onClick}>
      {children}
    </button>
  )
}

function mockTrigger({ children, asChild }: { children?: ReactNode; asChild?: boolean }) {
  if (asChild) return <>{children}</>
  return <div>{children}</div>
}

function mockSubTrigger({ children, disabled }: { children?: ReactNode; disabled?: boolean }) {
  return (
    <span aria-disabled={disabled || undefined} data-testid="sub-trigger">
      {children}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@repo/ui', () => ({
  Button: ({ children, ...props }: { children?: ReactNode }) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
  ContextMenu: mockPassthrough,
  ContextMenuContent: mockPassthrough,
  ContextMenuItem: mockMenuItem,
  ContextMenuSeparator: () => <hr />,
  ContextMenuSub: mockPassthrough,
  ContextMenuSubContent: mockPassthrough,
  ContextMenuSubTrigger: mockSubTrigger,
  ContextMenuTrigger: mockTrigger,
  Dialog: ({ children, open }: { children?: ReactNode; open?: boolean }) =>
    open ? <div role="dialog">{children}</div> : null,
  DialogContent: mockPassthrough,
  DialogDescription: mockPassthrough,
  DialogFooter: mockPassthrough,
  DialogHeader: mockPassthrough,
  DialogTitle: mockPassthrough,
  DropdownMenu: mockPassthrough,
  DropdownMenuContent: mockPassthrough,
  DropdownMenuItem: mockMenuItem,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuSub: mockPassthrough,
  DropdownMenuSubContent: mockPassthrough,
  DropdownMenuSubTrigger: mockSubTrigger,
  DropdownMenuTrigger: mockTrigger,
  Input: ({
    id,
    value,
    onChange,
    type,
    required,
  }: {
    id?: string
    value?: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    type?: string
    required?: boolean
  }) => <input id={id} value={value} onChange={onChange} type={type} required={required} />,
  Label: ({ children, htmlFor }: { children?: ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  Tooltip: mockPassthrough,
  TooltipContent: mockPassthrough,
  TooltipProvider: mockPassthrough,
  TooltipTrigger: ({ children }: { children?: ReactNode }) => <>{children}</>,
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    params,
  }: {
    children?: ReactNode
    to?: string
    params?: Record<string, string>
  }) => {
    const href = to && params ? to.replace(/\$(\w+)/g, (_, key) => params[key] ?? '') : to
    return <a href={href}>{children}</a>
  },
}))

const { mockMutate, mutationCalls } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
  mutationCalls: [] as Array<Record<string, unknown>>,
}))
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({ data: undefined, isLoading: false, isError: false }),
  useMutation: vi.fn().mockImplementation((options: Record<string, unknown>) => {
    mutationCalls.push(options)
    return { mutate: mockMutate, isPending: false }
  }),
  useQueryClient: vi.fn().mockReturnValue({ invalidateQueries: vi.fn() }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { MemberContextMenu, type MemberForMenu, MemberKebabButton } from '../MemberContextMenu'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function createMember(overrides: Partial<MemberForMenu> = {}): MemberForMenu {
  return {
    id: 'm-1',
    userId: 'u-1',
    name: 'Alice Admin',
    email: 'alice@example.com',
    role: 'member',
    roleId: 'r-member',
    ...overrides,
  }
}

const defaultProps = {
  orgId: 'org-1',
  currentUserId: 'current-user',
  onActionComplete: vi.fn(),
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the captured useMutation options by index (call order).
 * Index 0 = useChangeRoleMutation, Index 1 = useEditProfileMutation
 * (based on render order in MemberMenuContent).
 */
function getMutationOptions(index: number) {
  return mutationCalls[index] as {
    onSuccess?: () => void
    onError?: (err: unknown) => void
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MemberContextMenu (#313)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mutationCalls.length = 0
  })
  it('should render a kebab menu button for each member row', () => {
    const member = createMember()
    render(<MemberKebabButton member={member} {...defaultProps} />)
    // The kebab button renders a MoreHorizontalIcon SVG inside a button
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('should render context menu with all three menu items', () => {
    const member = createMember()
    render(
      <MemberContextMenu member={member} {...defaultProps}>
        <div data-testid="member-row">Member Row</div>
      </MemberContextMenu>
    )
    expect(screen.getByText(/Change role/i)).toBeInTheDocument()
    expect(screen.getByText(/Edit profile/i)).toBeInTheDocument()
    expect(screen.getByText(/View user/i)).toBeInTheDocument()
  })

  it('should show role submenu items when roles are loaded', async () => {
    const { useQuery } = await import('@tanstack/react-query')
    vi.mocked(useQuery).mockReturnValue({
      data: {
        data: [
          { id: 'r-owner', name: 'Owner', slug: 'owner' },
          { id: 'r-admin', name: 'Admin', slug: 'admin' },
          { id: 'r-member', name: 'Member', slug: 'member' },
        ],
      },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useQuery>)

    const member = createMember({ roleId: 'r-member' })
    render(
      <MemberContextMenu member={member} {...defaultProps}>
        <div data-testid="member-row">Member Row</div>
      </MemberContextMenu>
    )

    await waitFor(() => {
      expect(screen.getByText('Owner')).toBeInTheDocument()
      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('Member')).toBeInTheDocument()
    })
  })

  it('should open edit profile dialog with Name and Email fields', async () => {
    const member = createMember({ name: 'Alice Admin', email: 'alice@example.com' })
    render(
      <MemberContextMenu member={member} {...defaultProps}>
        <div data-testid="member-row">Member Row</div>
      </MemberContextMenu>
    )

    fireEvent.click(screen.getByText(/Edit profile/i))

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/name/i)).toHaveValue('Alice Admin')
    expect(screen.getByLabelText(/email/i)).toHaveValue('alice@example.com')
  })

  it('should contain a link to /admin/users/:userId for "View user"', () => {
    const member = createMember({ userId: 'u-42' })
    render(
      <MemberContextMenu member={member} {...defaultProps}>
        <div data-testid="member-row">Member Row</div>
      </MemberContextMenu>
    )

    const viewUser = screen.getByText(/View user/i)
    expect(viewUser).toBeInTheDocument()
    expect(viewUser.closest('a')).toHaveAttribute(
      'href',
      expect.stringContaining('/admin/users/u-42')
    )
  })

  // -------------------------------------------------------------------------
  // B3: Role-change mutation tests
  // -------------------------------------------------------------------------

  it('should call mutate with correct roleId when clicking a role submenu item', async () => {
    // Arrange
    const { useQuery } = await import('@tanstack/react-query')
    vi.mocked(useQuery).mockReturnValue({
      data: {
        data: [
          { id: 'r-owner', name: 'Owner', slug: 'owner' },
          { id: 'r-admin', name: 'Admin', slug: 'admin' },
          { id: 'r-member', name: 'Member', slug: 'member' },
        ],
      },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useQuery>)

    const member = createMember({ roleId: 'r-member' })
    render(
      <MemberContextMenu member={member} {...defaultProps}>
        <div>Member Row</div>
      </MemberContextMenu>
    )

    // Act — click a non-current role
    fireEvent.click(screen.getByText('Owner'))

    // Assert (W10: mockMutate is asserted here)
    expect(mockMutate).toHaveBeenCalledWith('r-owner')
  })

  it('should show toast success and call onActionComplete after role change', async () => {
    // Arrange
    const { toast } = await import('sonner')
    const onActionComplete = vi.fn()
    const member = createMember()
    render(
      <MemberContextMenu
        member={member}
        orgId="org-1"
        currentUserId="current-user"
        onActionComplete={onActionComplete}
      >
        <div>Member Row</div>
      </MemberContextMenu>
    )

    // Act — invoke the onSuccess callback of the change-role mutation (index 0)
    const changeRoleOptions = getMutationOptions(0)
    changeRoleOptions.onSuccess?.()

    // Assert
    expect(toast.success).toHaveBeenCalledWith('Role updated successfully')
    expect(onActionComplete).toHaveBeenCalled()
  })

  it('should show toast error when role change mutation fails', async () => {
    // Arrange
    const { toast } = await import('sonner')
    const member = createMember()
    render(
      <MemberContextMenu member={member} {...defaultProps}>
        <div>Member Row</div>
      </MemberContextMenu>
    )

    // Act — invoke the onError callback of the change-role mutation (index 0)
    const changeRoleOptions = getMutationOptions(0)
    changeRoleOptions.onError?.(new Error('Cannot change role: this is the last owner'))

    // Assert
    expect(toast.error).toHaveBeenCalledWith('Cannot change role: this is the last owner')
  })

  // -------------------------------------------------------------------------
  // B4: Self-action prevention test
  // -------------------------------------------------------------------------

  it('should disable Change role submenu when member is current user', () => {
    // Arrange — currentUserId matches member.userId
    const member = createMember({ userId: 'self-user' })
    render(
      <MemberContextMenu
        member={member}
        orgId="org-1"
        currentUserId="self-user"
        onActionComplete={vi.fn()}
      >
        <div>Member Row</div>
      </MemberContextMenu>
    )

    // Assert — the SubTrigger for "Change role" is aria-disabled
    const changeRoleTrigger = screen
      .getByText(/Change role/i)
      .closest('[data-testid="sub-trigger"]')
    expect(changeRoleTrigger).toHaveAttribute('aria-disabled', 'true')

    // Assert — tooltip text is present
    expect(screen.getByText('Cannot change your own role')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // W12: Edit profile error handling tests
  // -------------------------------------------------------------------------

  it('should show inline error when edit profile mutation fails with 409', async () => {
    // Arrange
    const { toast } = await import('sonner')
    const member = createMember()
    render(
      <MemberContextMenu member={member} {...defaultProps}>
        <div>Member Row</div>
      </MemberContextMenu>
    )

    // Open the edit dialog
    fireEvent.click(screen.getByText(/Edit profile/i))
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    })

    // Act — invoke the onError callback of the edit-profile mutation (index 1)
    // with a 409-style error message containing "email already exists"
    const editProfileOptions = getMutationOptions(1)
    editProfileOptions.onError?.(new Error('A user with this email already exists'))

    // Assert — inline error displayed, NOT toast.error
    await waitFor(() => {
      expect(screen.getByText('A user with this email already exists')).toBeInTheDocument()
    })
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('should show toast error when edit profile mutation fails with non-409 error', async () => {
    // Arrange
    const { toast } = await import('sonner')
    const member = createMember()
    render(
      <MemberContextMenu member={member} {...defaultProps}>
        <div>Member Row</div>
      </MemberContextMenu>
    )

    // Open the edit dialog
    fireEvent.click(screen.getByText(/Edit profile/i))
    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    })

    // Act — invoke the onError callback of the edit-profile mutation (index 1)
    // with a non-409 error (e.g. 500)
    const editProfileOptions = getMutationOptions(1)
    editProfileOptions.onError?.(new Error('Failed to update profile'))

    // Assert — toast.error used, no inline error
    expect(toast.error).toHaveBeenCalledWith('Failed to update profile')
  })
})
