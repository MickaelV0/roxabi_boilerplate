type UserActionsProps = {
  userId: string
  userName: string
  isBanned: boolean
  isArchived: boolean
  onActionComplete: () => void
}

/**
 * UserActions — action buttons and dialogs for user detail page.
 *
 * Renders contextual action buttons: Edit, Ban/Unban, Delete/Restore.
 * Each destructive action shows a confirmation dialog.
 */
export function UserActions({
  userId: _userId,
  userName: _userName,
  isBanned: _isBanned,
  isArchived: _isArchived,
  onActionComplete: _onActionComplete,
}: UserActionsProps) {
  // TODO: implement — action buttons:
  // - "Edit" → inline edit mode for name, email, role
  // - "Ban" (if not banned) → dialog with reason (5-500 chars) + optional expiry date
  // - "Unban" (if banned) → confirmation dialog
  // - "Delete" (if not archived) → confirmation dialog with user name
  // - "Restore" (if archived) → confirmation dialog
  // All actions use mutations with invalidateQueries on success
  return <div>TODO: UserActions</div>
}
