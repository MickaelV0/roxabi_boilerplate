/**
 * Update an existing issue: project fields, dependencies, and parent/child relations.
 * Replaces set.sh.
 */

import {
  PRIORITY_OPTIONS,
  SIZE_FIELD_ID,
  SIZE_OPTIONS,
  STATUS_FIELD_ID,
  STATUS_OPTIONS,
  PRIORITY_FIELD_ID,
  resolvePriority,
  resolveSize,
  resolveStatus,
} from '../../shared/config'
import {
  addBlockedBy,
  addSubIssue,
  getItemId,
  getNodeId,
  getParentNumber,
  removeBlockedBy,
  removeSubIssue,
  updateField,
} from '../../shared/github'

interface SetOptions {
  issueNumber: number
  size?: string
  priority?: string
  status?: string
  blockedBy?: string
  blocks?: string
  rmBlockedBy?: string
  rmBlocks?: string
  parent?: string
  addChild?: string
  rmParent: boolean
  rmChild?: string
}

function parseArgs(args: string[]): SetOptions {
  const opts: SetOptions = { issueNumber: 0, rmParent: false }

  let i = 0
  while (i < args.length) {
    const arg = args[i]
    switch (arg) {
      case '--size':
        opts.size = args[++i]
        break
      case '--priority':
        opts.priority = args[++i]
        break
      case '--status':
        opts.status = args[++i]
        break
      case '--blocked-by':
        opts.blockedBy = args[++i]
        break
      case '--blocks':
        opts.blocks = args[++i]
        break
      case '--rm-blocked-by':
        opts.rmBlockedBy = args[++i]
        break
      case '--rm-blocks':
        opts.rmBlocks = args[++i]
        break
      case '--parent':
        opts.parent = args[++i]
        break
      case '--add-child':
        opts.addChild = args[++i]
        break
      case '--rm-parent':
        opts.rmParent = true
        break
      case '--rm-child':
        opts.rmChild = args[++i]
        break
      default:
        if (!opts.issueNumber && /^\d+$/.test(arg)) {
          opts.issueNumber = Number(arg)
        }
        break
    }
    i++
  }

  return opts
}

function parseNumberList(input: string): number[] {
  return input
    .split(',')
    .map((s) => s.trim().replace(/^#/, ''))
    .filter(Boolean)
    .map(Number)
}

export async function setIssue(args: string[]): Promise<void> {
  const opts = parseArgs(args)

  if (!opts.issueNumber) {
    console.error('Error: Issue number required')
    process.exit(1)
  }

  const hasAction =
    opts.size ||
    opts.priority ||
    opts.status ||
    opts.blockedBy ||
    opts.blocks ||
    opts.rmBlockedBy ||
    opts.rmBlocks ||
    opts.parent ||
    opts.addChild ||
    opts.rmParent ||
    opts.rmChild

  if (!hasAction) {
    console.error(
      'Error: Specify --size, --priority, --status, --blocked-by, --blocks, --rm-blocked-by, --rm-blocks, --parent, --add-child, --rm-parent, and/or --rm-child'
    )
    process.exit(1)
  }

  // Project field updates need item_id (non-fatal)
  if (opts.size || opts.priority || opts.status) {
    let itemId: string | undefined
    try {
      itemId = await getItemId(opts.issueNumber)
    } catch {
      console.error(
        `Warning: Issue #${opts.issueNumber} not found in project — skipping project field updates (status/size/priority)`
      )
    }

    if (itemId) {
      if (opts.status) {
        const canonical = resolveStatus(opts.status)
        if (!canonical || !STATUS_OPTIONS[canonical]) {
          console.error(
            'Error: Invalid status. Valid: Backlog, Analysis, Specs, "In Progress", Review, Done'
          )
          process.exit(1)
        }
        await updateField(itemId, STATUS_FIELD_ID, STATUS_OPTIONS[canonical])
        console.log(`Status=${canonical} #${opts.issueNumber}`)
      }

      if (opts.size) {
        const canonical = resolveSize(opts.size)
        if (!canonical || !SIZE_OPTIONS[canonical]) {
          console.error(`Error: Invalid size. Valid: ${Object.keys(SIZE_OPTIONS).join(', ')}`)
          process.exit(1)
        }
        await updateField(itemId, SIZE_FIELD_ID, SIZE_OPTIONS[canonical])
        console.log(`Size=${canonical} #${opts.issueNumber}`)
      }

      if (opts.priority) {
        const canonical = resolvePriority(opts.priority)
        if (!canonical || !PRIORITY_OPTIONS[canonical]) {
          console.error('Error: Invalid priority. Valid: Urgent, High, Medium, Low')
          process.exit(1)
        }
        await updateField(itemId, PRIORITY_FIELD_ID, PRIORITY_OPTIONS[canonical])
        console.log(`Priority=${canonical} #${opts.issueNumber}`)
      }
    }
  }

  // Dependency updates use node IDs
  if (opts.blockedBy) {
    const issueNodeId = await getNodeId(opts.issueNumber)
    for (const dep of parseNumberList(opts.blockedBy)) {
      const blockingNodeId = await getNodeId(dep)
      await addBlockedBy(issueNodeId, blockingNodeId)
      console.log(`BlockedBy=#${dep} #${opts.issueNumber}`)
    }
  }

  if (opts.blocks) {
    const blockingNodeId = await getNodeId(opts.issueNumber)
    for (const dep of parseNumberList(opts.blocks)) {
      const blockedNodeId = await getNodeId(dep)
      await addBlockedBy(blockedNodeId, blockingNodeId)
      console.log(`Blocks=#${dep} #${opts.issueNumber}`)
    }
  }

  if (opts.rmBlockedBy) {
    const issueNodeId = await getNodeId(opts.issueNumber)
    for (const dep of parseNumberList(opts.rmBlockedBy)) {
      const blockingNodeId = await getNodeId(dep)
      await removeBlockedBy(issueNodeId, blockingNodeId)
      console.log(`RemovedBlockedBy=#${dep} #${opts.issueNumber}`)
    }
  }

  if (opts.rmBlocks) {
    const blockingNodeId = await getNodeId(opts.issueNumber)
    for (const dep of parseNumberList(opts.rmBlocks)) {
      const blockedNodeId = await getNodeId(dep)
      await removeBlockedBy(blockedNodeId, blockingNodeId)
      console.log(`RemovedBlocks=#${dep} #${opts.issueNumber}`)
    }
  }

  // Parent/child relationship management
  if (opts.parent) {
    const parentNum = opts.parent.replace(/^#/, '')
    const issueNodeId = await getNodeId(opts.issueNumber)
    const parentNodeId = await getNodeId(parentNum)
    await addSubIssue(parentNodeId, issueNodeId)
    console.log(`Parent=#${parentNum} #${opts.issueNumber}`)
  }

  if (opts.addChild) {
    const issueNodeId = await getNodeId(opts.issueNumber)
    for (const child of parseNumberList(opts.addChild)) {
      const childNodeId = await getNodeId(child)
      await addSubIssue(issueNodeId, childNodeId)
      console.log(`Child=#${child} #${opts.issueNumber}`)
    }
  }

  if (opts.rmParent) {
    const parentNum = await getParentNumber(opts.issueNumber)
    if (parentNum) {
      const issueNodeId = await getNodeId(opts.issueNumber)
      const parentNodeId = await getNodeId(parentNum)
      await removeSubIssue(parentNodeId, issueNodeId)
      console.log(`RemovedParent=#${parentNum} #${opts.issueNumber}`)
    } else {
      console.log(`No parent found for #${opts.issueNumber}`)
    }
  }

  if (opts.rmChild) {
    const issueNodeId = await getNodeId(opts.issueNumber)
    for (const child of parseNumberList(opts.rmChild)) {
      const childNodeId = await getNodeId(child)
      await removeSubIssue(issueNodeId, childNodeId)
      console.log(`RemovedChild=#${child} #${opts.issueNumber}`)
    }
  }
}
