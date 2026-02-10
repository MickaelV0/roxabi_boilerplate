import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui'

// TODO: import authClient from '@/lib/auth-client'
// TODO: import useSession or similar hook to get current user's orgs
// TODO: import Paraglide messages
// TODO: import icons (ChevronDown, Plus, Check) from lucide-react

/**
 * OrgSwitcher — dropdown in the Header for switching between organizations.
 *
 * Shows:
 * - List of user's orgs with name and role badge
 * - Active org highlighted
 * - "Create organization" option at the bottom
 *
 * @example
 * ```tsx
 * // In Header.tsx
 * <OrgSwitcher />
 * ```
 */
export function OrgSwitcher() {
  // TODO: fetch user's organizations from auth session
  // TODO: track active organization
  // TODO: implement org switching via authClient.organization.setActive()
  // TODO: implement "Create organization" dialog

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          {/* TODO: show active org name + chevron icon */}
          Organization
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* TODO: map over user's organizations */}
        <DropdownMenuItem>
          {/* TODO: org name + role badge + active indicator */}
          Placeholder Org
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          {/* TODO: Plus icon + "Create organization" */}
          Create organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
