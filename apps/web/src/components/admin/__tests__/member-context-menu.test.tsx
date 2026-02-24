import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

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

function mockSubTrigger({ children }: { children?: ReactNode }) {
  return <span>{children}</span>
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

const { mockMutate } = vi.hoisted(() => ({ mockMutate: vi.fn() }))
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({ data: undefined, isLoading: false, isError: false }),
  useMutation: vi.fn().mockReturnValue({ mutate: mockMutate, isPending: false }),
  useQueryClient: vi.fn().mockReturnValue({ invalidateQueries: vi.fn() }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { MemberContextMenu, type MemberForMenu, MemberKebabButton } from '../member-context-menu'

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
// Tests
// ---------------------------------------------------------------------------

describe('MemberContextMenu (#313)', () => {
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
})
