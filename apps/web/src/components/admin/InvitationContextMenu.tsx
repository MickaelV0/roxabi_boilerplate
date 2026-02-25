import {
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui'
import { MoreHorizontalIcon } from 'lucide-react'

export type InvitationForMenu = {
  id: string
  email: string
}

type InvitationMenuContentProps = {
  invitation: InvitationForMenu
  onRevoke: (invitation: InvitationForMenu) => void
  variant: 'context' | 'dropdown'
}

type InvitationContextMenuProps = {
  invitation: InvitationForMenu
  onRevoke: (invitation: InvitationForMenu) => void
  children: React.ReactNode
}

type InvitationKebabButtonProps = {
  invitation: InvitationForMenu
  onRevoke: (invitation: InvitationForMenu) => void
}

// ---------------------------------------------------------------------------
// InvitationMenuContent
// ---------------------------------------------------------------------------

function InvitationMenuContent({ invitation, onRevoke, variant }: InvitationMenuContentProps) {
  const MenuItem = variant === 'context' ? ContextMenuItem : DropdownMenuItem

  return (
    <MenuItem variant="destructive" onClick={() => onRevoke(invitation)}>
      Revoke invitation
    </MenuItem>
  )
}

// ---------------------------------------------------------------------------
// InvitationContextMenu
// ---------------------------------------------------------------------------

export function InvitationContextMenu({
  invitation,
  onRevoke,
  children,
}: InvitationContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <InvitationMenuContent invitation={invitation} onRevoke={onRevoke} variant="context" />
      </ContextMenuContent>
    </ContextMenu>
  )
}

// ---------------------------------------------------------------------------
// InvitationKebabButton
// ---------------------------------------------------------------------------

export function InvitationKebabButton({ invitation, onRevoke }: InvitationKebabButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="More actions">
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <InvitationMenuContent invitation={invitation} onRevoke={onRevoke} variant="dropdown" />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
