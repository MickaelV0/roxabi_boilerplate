import { PROJECT_ID, QUERY } from './config'
import type { Branch, Issue, PR, RawItem, Worktree } from './types'

async function fetchPage(
  cursor?: string
): Promise<{ items: RawItem[]; hasNextPage: boolean; endCursor: string | null }> {
  const args = ['gh', 'api', 'graphql', '-f', `query=${QUERY}`, '-f', `projectId=${PROJECT_ID}`]
  if (cursor) args.push('-f', `cursor=${cursor}`)

  const proc = Bun.spawn(args, { stdout: 'pipe', stderr: 'pipe' })
  const stdout = await new Response(proc.stdout).text()
  const stderr = await new Response(proc.stderr).text()
  const code = await proc.exited

  if (code !== 0) {
    throw new Error(`gh api graphql failed (${code}): ${stderr}`)
  }

  const data = JSON.parse(stdout)
  const pageInfo = data.data.node.items.pageInfo
  return {
    items: data.data.node.items.nodes as RawItem[],
    hasNextPage: pageInfo.hasNextPage,
    endCursor: pageInfo.endCursor,
  }
}

export async function fetchIssues(): Promise<Issue[]> {
  const allItems: RawItem[] = []
  let cursor: string | undefined
  do {
    const page = await fetchPage(cursor)
    allItems.push(...page.items)
    cursor = page.hasNextPage ? (page.endCursor ?? undefined) : undefined
  } while (cursor)

  const items: RawItem[] = allItems

  const openItems = items.filter((i) => i.content?.state === 'OPEN')

  const field = (item: RawItem, name: string): string => {
    for (const fv of item.fieldValues.nodes) {
      if (fv.field?.name === name && fv.name) return fv.name
    }
    return '-'
  }

  const byNumber = new Map<number, RawItem>()
  for (const item of openItems) byNumber.set(item.content.number, item)

  const toIssue = (item: RawItem): Issue => {
    const bb = item.content.blockedBy?.nodes ?? []
    const bl = item.content.blocking?.nodes ?? []
    const openBlockedBy = bb.filter((b) => b.state === 'OPEN')

    let blockStatus: Issue['blockStatus'] = 'ready'
    if (openBlockedBy.length > 0) blockStatus = 'blocked'
    else if (bl.length > 0) blockStatus = 'blocking'

    const subs = item.content.subIssues?.nodes ?? []
    const children: Issue[] = subs
      .map((sub) => {
        const child = byNumber.get(sub.number)
        if (!child) return null
        return toIssue(child)
      })
      .filter(Boolean) as Issue[]

    return {
      number: item.content.number,
      title: item.content.title,
      url: item.content.url,
      status: field(item, 'Status'),
      size: field(item, 'Size'),
      priority: field(item, 'Priority'),
      blockStatus,
      blockedBy: bb,
      blocking: bl,
      children,
    }
  }

  // Root issues only (no open parent); orphaned children (parent closed) promoted to root
  const roots = openItems
    .filter((i) => !i.content.parent || i.content.parent.state === 'CLOSED')
    .map(toIssue)

  // Sort: blocking first, then ready, then blocked; within that by priority
  const priorityOrder: Record<string, number> = {
    'P0 - Urgent': 0,
    'P1 - High': 1,
    'P2 - Medium': 2,
    'P3 - Low': 3,
    '-': 99,
  }
  const blockOrder: Record<string, number> = {
    blocking: 0,
    ready: 1,
    blocked: 2,
  }

  roots.sort((a, b) => {
    const bd = (blockOrder[a.blockStatus] ?? 9) - (blockOrder[b.blockStatus] ?? 9)
    if (bd !== 0) return bd
    return (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
  })

  return roots
}

export async function run(cmd: string[]): Promise<string> {
  const proc = Bun.spawn(cmd, { stdout: 'pipe', stderr: 'pipe' })
  const stdout = await new Response(proc.stdout).text()
  await proc.exited
  return stdout.trim()
}

export async function fetchPRs(): Promise<PR[]> {
  try {
    const out = await run([
      'gh',
      'pr',
      'list',
      '--state',
      'open',
      '--json',
      'number,title,headRefName,state,isDraft,url,author,updatedAt,additions,deletions,reviewDecision,labels',
    ])
    if (!out) return []
    return JSON.parse(out).map((pr: Record<string, unknown>) => ({
      number: pr.number,
      title: pr.title,
      branch: pr.headRefName,
      state: pr.state,
      isDraft: pr.isDraft,
      url: pr.url,
      author: (pr.author as Record<string, string>)?.login ?? '',
      updatedAt: pr.updatedAt,
      additions: pr.additions ?? 0,
      deletions: pr.deletions ?? 0,
      reviewDecision: pr.reviewDecision ?? '',
      labels: ((pr.labels as { name: string }[]) ?? []).map((l) => l.name),
    }))
  } catch {
    return []
  }
}

export async function fetchBranches(): Promise<Branch[]> {
  try {
    const out = await run(['git', 'branch', '--list'])
    if (!out) return []
    return out
      .split('\n')
      .filter(Boolean)
      .map((line) => ({
        name: line.replace(/^[*+]?\s+/, ''),
        isCurrent: line.startsWith('*'),
      }))
  } catch {
    return []
  }
}

export async function fetchWorktrees(): Promise<Worktree[]> {
  try {
    const out = await run(['git', 'worktree', 'list', '--porcelain'])
    if (!out) return []
    const trees: Worktree[] = []
    let current: Partial<Worktree> = {}
    for (const line of out.split('\n')) {
      if (line.startsWith('worktree ')) {
        if (current.path) trees.push(current as Worktree)
        current = { path: line.slice(9), branch: '', commit: '', isBare: false }
      } else if (line.startsWith('HEAD ')) {
        current.commit = line.slice(5, 12)
      } else if (line.startsWith('branch ')) {
        current.branch = line.slice(7).replace('refs/heads/', '')
      } else if (line === 'bare') {
        current.isBare = true
      }
    }
    if (current.path) trees.push(current as Worktree)
    return trees
  } catch {
    return []
  }
}
