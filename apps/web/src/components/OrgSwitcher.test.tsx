import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

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

vi.mock('@/paraglide/messages', () => ({
  m: new Proxy(
    {},
    {
      get:
        (_target, prop) =>
        (...args: unknown[]) => {
          if (args.length > 0 && typeof args[0] === 'object') {
            return `${String(prop)}(${JSON.stringify(args[0])})`
          }
          return String(prop)
        },
    }
  ),
}))

import { authClient } from '@/lib/auth-client'
import { OrgSwitcher } from './OrgSwitcher'

describe('OrgSwitcher', () => {
  it('should show create organization button when user has no orgs', () => {
    render(<OrgSwitcher />)

    expect(screen.getAllByText('org_create').length).toBeGreaterThanOrEqual(1)
  })

  it('should show org name in trigger when orgs exist', () => {
    vi.mocked(authClient.useListOrganizations).mockReturnValue({
      data: [
        { id: 'org-1', name: 'Acme Corp', slug: 'acme-corp' },
        { id: 'org-2', name: 'Beta Inc', slug: 'beta-inc' },
      ],
    } as ReturnType<typeof authClient.useListOrganizations>)
    vi.mocked(authClient.useActiveOrganization).mockReturnValue({
      data: { id: 'org-1', name: 'Acme Corp', slug: 'acme-corp' },
    } as ReturnType<typeof authClient.useActiveOrganization>)

    render(<OrgSwitcher />)

    expect(screen.getAllByText('Acme Corp').length).toBeGreaterThanOrEqual(1)
  })

  it('should show org list items when orgs exist', () => {
    vi.mocked(authClient.useListOrganizations).mockReturnValue({
      data: [
        { id: 'org-1', name: 'Acme Corp', slug: 'acme-corp' },
        { id: 'org-2', name: 'Beta Inc', slug: 'beta-inc' },
      ],
    } as ReturnType<typeof authClient.useListOrganizations>)
    vi.mocked(authClient.useActiveOrganization).mockReturnValue({
      data: { id: 'org-1', name: 'Acme Corp', slug: 'acme-corp' },
    } as ReturnType<typeof authClient.useActiveOrganization>)

    render(<OrgSwitcher />)

    const menuItems = screen.getAllByRole('menuitem')
    // 2 org items + 1 "Create organization" item
    expect(menuItems.length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('Acme Corp').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Beta Inc')).toBeInTheDocument()
  })
})
