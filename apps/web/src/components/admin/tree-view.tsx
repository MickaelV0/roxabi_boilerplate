type TreeNode = {
  id: string
  name: string
  slug: string | null
  memberCount: number
  status: string
  parentOrganizationId: string | null
  children: TreeNode[]
}

type TreeViewProps = {
  nodes: TreeNode[]
  onNodeClick: (orgId: string) => void
}

/**
 * TreeView — collapsible tree view for organization hierarchy.
 *
 * Assembles flat org list into tree client-side. Shows expandable/collapsible nodes
 * with org name, slug, member count, and status. Orphaned orgs (parent deleted)
 * render at top level with "(parent archived)" badge. Max 3 levels of nesting.
 */
export function TreeView({ nodes: _nodes, onNodeClick: _onNodeClick }: TreeViewProps) {
  // TODO: implement — recursive tree with:
  // - Expandable/collapsible nodes (chevron icon)
  // - Indentation for depth levels
  // - Member count badge
  // - Status badge
  // - "(parent archived)" indicator for orphaned nodes
  // - Click handler navigates to org detail
  return <div>TODO: TreeView</div>
}

/**
 * Build tree structure from flat org list.
 * Orgs with missing/deleted parents become top-level with orphan flag.
 */
export function buildTree(_orgs: Omit<TreeNode, 'children'>[]): TreeNode[] {
  // TODO: implement — assemble parent/child relationships from parentOrganizationId
  return []
}
