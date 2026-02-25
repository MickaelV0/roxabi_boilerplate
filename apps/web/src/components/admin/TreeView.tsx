import { Badge, cn } from '@repo/ui'
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type TreeNode = {
  id: string
  name: string
  slug: string | null
  parentOrganizationId: string | null
  memberCount?: number
  deletedAt?: string | null
}

type TreeViewProps = {
  nodes: TreeNode[]
  onSelect: (id: string) => void
  selectedId?: string
}

type InternalTreeNode = TreeNode & {
  children: InternalTreeNode[]
  isOrphan: boolean
}

/**
 * Build tree structure from flat org list.
 * Orgs with missing/deleted parents become top-level with orphan flag.
 */
export function buildTree(orgs: TreeNode[]): InternalTreeNode[] {
  const nodeMap = new Map<string, InternalTreeNode>()
  const idSet = new Set(orgs.map((o) => o.id))

  for (const org of orgs) {
    nodeMap.set(org.id, { ...org, children: [], isOrphan: false })
  }

  const roots: InternalTreeNode[] = []

  for (const node of nodeMap.values()) {
    if (node.parentOrganizationId && idSet.has(node.parentOrganizationId)) {
      const parent = nodeMap.get(node.parentOrganizationId)
      if (parent) {
        parent.children.push(node)
      }
    } else if (node.parentOrganizationId && !idSet.has(node.parentOrganizationId)) {
      node.isOrphan = true
      roots.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

type TreeNodeRowProps = {
  node: InternalTreeNode
  depth: number
  expanded: Set<string>
  selectedId?: string
  onToggle: (id: string) => void
  onSelect: (id: string) => void
}

function ExpandToggle({
  isExpanded,
  onClick,
}: {
  isExpanded: boolean
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      type="button"
      className="shrink-0 rounded p-0.5 hover:bg-muted"
      onClick={onClick}
      aria-label={isExpanded ? 'Collapse' : 'Expand'}
    >
      {isExpanded ? (
        <ChevronDownIcon className="size-3.5 text-muted-foreground" />
      ) : (
        <ChevronRightIcon className="size-3.5 text-muted-foreground" />
      )}
    </button>
  )
}

function TreeNodeRow({ node, depth, expanded, selectedId, onToggle, onSelect }: TreeNodeRowProps) {
  const isExpanded = expanded.has(node.id)
  const hasChildren = node.children.length > 0
  const isSelected = selectedId === node.id

  return (
    // biome-ignore lint/a11y/useFocusableInteractive: inner button is the focusable element for this treeitem
    <div role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
          'cursor-pointer text-left hover:bg-muted/50',
          isSelected && 'bg-muted font-medium text-foreground'
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => onSelect(node.id)}
        aria-current={isSelected ? 'true' : undefined}
      >
        {hasChildren ? (
          <ExpandToggle
            isExpanded={isExpanded}
            onClick={(e) => {
              e.stopPropagation()
              onToggle(node.id)
            }}
          />
        ) : (
          <span className="w-[22px] shrink-0" />
        )}

        <span className="truncate">{node.name}</span>

        {node.slug && <span className="shrink-0 text-xs text-muted-foreground">/{node.slug}</span>}

        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          {node.memberCount != null && (
            <Badge variant="outline" className="text-[10px]">
              {node.memberCount} {node.memberCount === 1 ? 'member' : 'members'}
            </Badge>
          )}
          {node.deletedAt && (
            <Badge variant="secondary" className="text-[10px]">
              archived
            </Badge>
          )}
          {node.isOrphan && (
            <Badge variant="secondary" className="text-[10px]">
              parent archived
            </Badge>
          )}
        </span>
      </button>

      {hasChildren && isExpanded && (
        // biome-ignore lint/a11y/useSemanticElements: ARIA tree pattern requires role="group" on non-fieldset container
        <div role="group" className="contents">
          {node.children.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * TreeView -- collapsible tree view for organization hierarchy.
 *
 * Assembles flat org list into tree client-side. Shows expandable/collapsible nodes
 * with org name, slug. Orphaned orgs (parent deleted) render at top level with
 * "(parent archived)" badge. Click handler navigates to org detail.
 */
export function TreeView({ nodes, onSelect, selectedId }: TreeViewProps) {
  const tree = useMemo(() => buildTree(nodes), [nodes])

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(tree.map((n) => n.id)))

  // Sync expanded roots when tree data changes
  useEffect(() => {
    setExpanded((prev) => {
      const rootIds = new Set(tree.map((n) => n.id))
      const next = new Set(prev)
      for (const id of rootIds) {
        next.add(id)
      }
      return next
    })
  }, [tree])

  function handleToggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (tree.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No organizations found</p>
  }

  return (
    <div className="space-y-0.5" role="tree" aria-label="Organization hierarchy">
      {tree.map((node) => (
        <TreeNodeRow
          key={node.id}
          node={node}
          depth={0}
          expanded={expanded}
          selectedId={selectedId}
          onToggle={handleToggle}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
