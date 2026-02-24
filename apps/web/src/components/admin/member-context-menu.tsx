// TODO: implement — MemberContextMenu component (#313)
//
// Dual-trigger menu: ContextMenu (right-click on TableRow) + DropdownMenu (kebab button).
// Shared <MemberMenuContent> renders:
//   - "Change role" submenu (fetch org roles via GET /api/admin/organizations/:orgId/roles)
//   - "Edit profile" item (opens dialog with Name + Email fields)
//   - "View user" item (navigates to /admin/users/:userId)
//
// Props:
//   member: { id: string; userId: string; name: string; email: string; role: string; roleId: string | null }
//   orgId: string
//   currentUserId: string
//   onActionComplete: () => void
//
// Edge cases:
//   - Self-role-change disabled with tooltip
//   - Last owner demotion → error toast from 400
//   - No RBAC roles → disabled submenu with tooltip
//   - Email conflict on profile edit → inline error in dialog
//   - Roles fetch failure → disabled submenu with error state

export type MemberForMenu = {
  id: string
  userId: string
  name: string
  email: string
  role: string
  roleId: string | null
}

type MemberContextMenuProps = {
  member: MemberForMenu
  orgId: string
  currentUserId: string
  onActionComplete: () => void
  children: React.ReactNode
}

export function MemberContextMenu(_props: MemberContextMenuProps) {
  // TODO: implement
  return null
}

export type MemberKebabButtonProps = {
  member: MemberForMenu
  orgId: string
  currentUserId: string
  onActionComplete: () => void
}

export function MemberKebabButton(_props: MemberKebabButtonProps) {
  // TODO: implement
  return null
}
