type OrgActionsProps = {
  orgId: string
  orgName: string
  isArchived: boolean
  onActionComplete: () => void
}

/**
 * OrgActions — action buttons and dialogs for organization detail page.
 *
 * Renders contextual action buttons: Delete (with impact preview), Restore.
 */
export function OrgActions({
  orgId: _orgId,
  orgName: _orgName,
  isArchived: _isArchived,
  onActionComplete: _onActionComplete,
}: OrgActionsProps) {
  // TODO: implement — action buttons:
  // - "Delete" → fetches impact preview first, shows dialog with:
  //   "This will archive {orgName}. {memberCount} direct members and
  //    {childMemberCount} members across {childOrgCount} child organizations
  //    will be affected. {childOrgCount} child organizations will become top-level."
  //   Confirm → soft-delete
  // - "Restore" (if archived) → confirmation dialog
  // All actions use mutations with invalidateQueries on success
  return <div>TODO: OrgActions</div>
}
