#!/usr/bin/env bun
/**
 * Issues Dashboard — local dev tool
 * Usage: bun .claude/skills/issues/dashboard.ts [--port=3333]
 *
 * Serves a live HTML dashboard of GitHub project issues.
 * Data refreshes on every page load (browser refresh).
 */

const PORT = Number(process.argv.find((a) => a.startsWith('--port='))?.split('=')[1] ?? 3333)

const PROJECT_ID = process.env.PROJECT_ID ?? 'PVT_kwHODEqYK84BOId3'
const PID_FILE = `${import.meta.dirname}/.dashboard.pid`

// Write PID file for lifecycle management
await Bun.write(PID_FILE, String(process.pid))
process.on('SIGINT', () => {
  try {
    require('node:fs').unlinkSync(PID_FILE)
  } catch {}
  process.exit(0)
})
process.on('SIGTERM', () => {
  try {
    require('node:fs').unlinkSync(PID_FILE)
  } catch {}
  process.exit(0)
})

const QUERY = `
query($projectId: ID!, $cursor: String) {
  node(id: $projectId) {
    ... on ProjectV2 {
      items(first: 100, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          content {
            ... on Issue {
              number
              title
              state
              url
              subIssues(first: 20) { nodes { number state title } }
              parent { number state }
              blockedBy(first: 20) { nodes { number state } }
              blocking(first: 20) { nodes { number state } }
            }
          }
          fieldValues(first: 10) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field { ... on ProjectV2SingleSelectField { name } }
              }
            }
          }
        }
      }
    }
  }
}`

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RawFieldValue {
  name?: string
  field?: { name?: string }
}

interface RawSubIssue {
  number: number
  state: string
  title: string
}

interface RawContent {
  number: number
  title: string
  state: string
  url: string
  subIssues?: { nodes: RawSubIssue[] }
  parent?: { number: number; state: string } | null
  blockedBy?: { nodes: { number: number; state: string }[] }
  blocking?: { nodes: { number: number; state: string }[] }
}

interface RawItem {
  content: RawContent
  fieldValues: { nodes: RawFieldValue[] }
}

interface Issue {
  number: number
  title: string
  url: string
  status: string
  size: string
  priority: string
  blockStatus: 'ready' | 'blocked' | 'blocking'
  blockedBy: { number: number; state: string }[]
  blocking: { number: number; state: string }[]
  children: Issue[]
}

// ---------------------------------------------------------------------------
// Data fetching via gh CLI
// ---------------------------------------------------------------------------

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

async function fetchIssues(): Promise<Issue[]> {
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

// ---------------------------------------------------------------------------
// Git / GitHub data fetching
// ---------------------------------------------------------------------------

interface PR {
  number: number
  title: string
  branch: string
  state: string
  isDraft: boolean
  url: string
  author: string
  updatedAt: string
  additions: number
  deletions: number
  reviewDecision: string
}

interface Branch {
  name: string
  isCurrent: boolean
}

interface Worktree {
  path: string
  branch: string
  commit: string
  isBare: boolean
}

async function run(cmd: string[]): Promise<string> {
  const proc = Bun.spawn(cmd, { stdout: 'pipe', stderr: 'pipe' })
  const stdout = await new Response(proc.stdout).text()
  await proc.exited
  return stdout.trim()
}

async function fetchPRs(): Promise<PR[]> {
  try {
    const out = await run([
      'gh',
      'pr',
      'list',
      '--state',
      'open',
      '--json',
      'number,title,headRefName,state,isDraft,url,author,updatedAt,additions,deletions,reviewDecision',
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
    }))
  } catch {
    return []
  }
}

async function fetchBranches(): Promise<Branch[]> {
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

async function fetchWorktrees(): Promise<Worktree[]> {
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

// ---------------------------------------------------------------------------
// Dependency graph builder
// ---------------------------------------------------------------------------

interface DepNode {
  number: number
  title: string
  blockStatus: string
  targets: number[]
}

function flattenIssues(issues: Issue[]): Map<number, Issue> {
  const flat = new Map<number, Issue>()
  const collect = (list: Issue[]) => {
    for (const i of list) {
      flat.set(i.number, i)
      collect(i.children)
    }
  }
  collect(issues)
  return flat
}

function buildDepGraph(issues: Issue[]): DepNode[] {
  const flat = flattenIssues(issues)

  const nodes: DepNode[] = []
  for (const issue of flat.values()) {
    const targets = issue.blocking.filter((b) => b.state === 'OPEN').map((b) => b.number)
    if (targets.length > 0) {
      nodes.push({
        number: issue.number,
        title: issue.title,
        blockStatus: issue.blockStatus,
        targets,
      })
    }
  }

  // Topological sort
  const emitted = new Set<number>()
  const sorted: DepNode[] = []
  const remaining = [...nodes]
  while (remaining.length > 0) {
    const ready = remaining.filter((n) =>
      nodes.filter((o) => o.targets.includes(n.number)).every((o) => emitted.has(o.number))
    )
    if (ready.length === 0) {
      sorted.push(...remaining)
      break
    }
    for (const n of ready) {
      sorted.push(n)
      emitted.add(n.number)
      remaining.splice(remaining.indexOf(n), 1)
    }
  }

  return sorted
}

// ---------------------------------------------------------------------------
// HTML rendering
// ---------------------------------------------------------------------------

const PRIORITY_SHORT: Record<string, string> = {
  'P0 - Urgent': 'P0',
  'P1 - High': 'P1',
  'P2 - Medium': 'P2',
  'P3 - Low': 'P3',
}

const STATUS_SHORT: Record<string, string> = {
  'In Progress': 'In Prog',
}

const BLOCK_ICON: Record<string, string> = {
  ready: '✅',
  blocked: '⛔',
  blocking: '🔓',
}

const PRIORITY_CLASS: Record<string, string> = {
  'P0 - Urgent': 'pri-p0',
  'P1 - High': 'pri-p1',
  'P2 - Medium': 'pri-p2',
  'P3 - Low': 'pri-p3',
}

const STATUS_CLASS: Record<string, string> = {
  'In Progress': 'status-progress',
  Review: 'status-review',
  Specs: 'status-specs',
  Analysis: 'status-analysis',
  Backlog: 'status-backlog',
  Done: 'status-done',
}

function formatDeps(issue: Issue): string {
  const parts: string[] = []
  for (const b of issue.blockedBy) {
    const icon = b.state === 'OPEN' ? '⛔' : '✅'
    parts.push(
      `<span class="dep dep-${b.state === 'OPEN' ? 'blocked' : 'done'}">${icon}#${b.number}</span>`
    )
  }
  for (const b of issue.blocking) {
    parts.push(`<span class="dep dep-blocking">🔓#${b.number}</span>`)
  }
  return parts.length > 0 ? parts.join(' ') : '<span class="dep-none">-</span>'
}

function issueRow(issue: Issue, indent = 0, prefix = ''): string {
  const pri = PRIORITY_SHORT[issue.priority] ?? issue.priority
  const status = STATUS_SHORT[issue.status] ?? issue.status
  const priClass = PRIORITY_CLASS[issue.priority] ?? ''
  const statusClass = STATUS_CLASS[issue.status] ?? ''
  const blockIcon = BLOCK_ICON[issue.blockStatus] ?? ''
  const blockClass = `block-${issue.blockStatus}`

  const titleHtml =
    indent > 0
      ? `<span class="tree-prefix">${prefix}</span><a href="${issue.url}" target="_blank" rel="noopener">#${issue.number}</a> ${escHtml(issue.title)}`
      : `<a href="${issue.url}" target="_blank" rel="noopener">#${issue.number}</a> ${escHtml(issue.title)}`

  let html = `<tr class="issue-row depth-${indent > 0 ? 'child' : 'root'} ${blockClass}">
    <td class="col-num">${indent === 0 ? `<a href="${issue.url}" target="_blank" rel="noopener">#${issue.number}</a>` : ''}</td>
    <td class="col-title">${titleHtml}</td>
    <td class="col-status"><span class="badge ${statusClass}">${escHtml(status)}</span></td>
    <td class="col-size">${escHtml(issue.size)}</td>
    <td class="col-pri"><span class="badge ${priClass}">${escHtml(pri)}</span></td>
    <td class="col-block">${blockIcon}</td>
    <td class="col-deps">${formatDeps(issue)}</td>
  </tr>\n`

  for (let i = 0; i < issue.children.length; i++) {
    const isLast = i === issue.children.length - 1
    const childPrefix = isLast ? '└ ' : '├ '
    html += issueRow(issue.children[i], indent + 1, childPrefix)
  }

  return html
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function shortTitle(title: string, max = 22): string {
  const cleaned = title
    .replace(/^(feat|chore|docs|fix|refactor)\(.*?\):\s*/i, '')
    .replace(/^Feature:\s*/i, '')
    .replace(/^LATER:\s*/i, '')
    .replace(/\s*\(.*?\)\s*$/, '')
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}...` : cleaned
}

interface GraphDims {
  nodeWidth: number
  nodeHeight: number
  hGap: number
  vGap: number
}

function collectGraphNumbers(nodes: DepNode[]): Set<number> {
  const allNumbers = new Set<number>()
  for (const n of nodes) {
    allNumbers.add(n.number)
    for (const t of n.targets) allNumbers.add(t)
  }
  return allNumbers
}

function bfsAssignLayers(nodes: DepNode[]): Map<number, number> {
  const col = new Map<number, number>()
  const blockedNumbers = new Set(nodes.flatMap((n) => n.targets))
  const sources = nodes.filter((n) => !blockedNumbers.has(n.number))

  const queue = sources.map((n) => n.number)
  for (const num of queue) col.set(num, 0)
  const visited = new Set(queue)

  while (queue.length > 0) {
    const num = queue.shift()
    if (num === undefined) continue
    const node = nodes.find((n) => n.number === num)
    if (!node) continue
    const myCol = col.get(num) ?? 0
    for (const t of node.targets) {
      const existing = col.get(t) ?? 0
      col.set(t, Math.max(existing, myCol + 1))
      if (!visited.has(t)) {
        visited.add(t)
        queue.push(t)
      }
    }
  }

  return col
}

function groupByColumn(col: Map<number, number>, allNumbers: Set<number>): Map<number, number[]> {
  for (const num of allNumbers) {
    if (!col.has(num)) col.set(num, 0)
  }

  const columns = new Map<number, number[]>()
  for (const [num, c] of col) {
    if (!columns.has(c)) columns.set(c, [])
    columns.get(c)?.push(num)
  }

  return columns
}

function computeNodePositions(
  columns: Map<number, number[]>,
  dims: GraphDims,
  svgHeight: number
): Map<number, { x: number; y: number }> {
  const pos = new Map<number, { x: number; y: number }>()
  for (const [c, nums] of columns) {
    const x = 10 + c * (dims.nodeWidth + dims.hGap)
    const totalH = nums.length * dims.nodeHeight + (nums.length - 1) * dims.vGap
    const startY = (svgHeight - totalH) / 2
    nums.forEach((num, i) => {
      pos.set(num, { x, y: startY + i * (dims.nodeHeight + dims.vGap) })
    })
  }
  return pos
}

function renderSvgEdges(
  nodes: DepNode[],
  pos: Map<number, { x: number; y: number }>,
  dims: GraphDims
): string {
  let svg = ''
  for (const node of nodes) {
    const from = pos.get(node.number)
    if (!from) continue
    for (const t of node.targets) {
      const to = pos.get(t)
      if (!to) continue
      const x1 = from.x + dims.nodeWidth
      const y1 = from.y + dims.nodeHeight / 2
      const x2 = to.x
      const y2 = to.y + dims.nodeHeight / 2
      const cx1 = x1 + dims.hGap / 2
      const cx2 = x2 - dims.hGap / 2
      svg += `<path d="M${x1},${y1} C${cx1},${y1} ${cx2},${y2} ${x2},${y2}" fill="none" stroke="#8b949e" stroke-width="1.5" marker-end="url(#arrow)" opacity="0.6"/>`
    }
  }
  return svg
}

const BLOCK_COLOR: Record<string, string> = {
  blocking: '#d29922',
  blocked: '#f85149',
  ready: '#3fb950',
}

function renderSvgNodes(
  allNumbers: Set<number>,
  pos: Map<number, { x: number; y: number }>,
  flat: Map<number, Issue>,
  dims: GraphDims
): string {
  let svg = ''
  for (const num of allNumbers) {
    const p = pos.get(num)
    if (!p) continue
    const issue = flat.get(num)
    const label = issue ? `#${num} ${shortTitle(issue.title, 16)}` : `#${num}`
    const status = issue?.blockStatus ?? 'ready'
    const color = BLOCK_COLOR[status] ?? '#8b949e'

    svg += `<g>`
    svg += `<rect x="${p.x}" y="${p.y}" width="${dims.nodeWidth}" height="${dims.nodeHeight}" rx="4" fill="#161b22" stroke="${color}" stroke-width="1.5"/>`
    svg += `<text x="${p.x + 8}" y="${p.y + dims.nodeHeight / 2 + 4}" fill="#e6edf3" font-size="11" font-family="-apple-system, sans-serif">${escHtml(label)}</text>`
    svg += `</g>`
  }
  return svg
}

function renderDepGraph(nodes: DepNode[], allIssues: Issue[]): string {
  if (nodes.length === 0) return '<p class="empty-state">No dependency chains</p>'

  const flat = flattenIssues(allIssues)
  const allNumbers = collectGraphNumbers(nodes)

  const dims: GraphDims = { nodeWidth: 140, nodeHeight: 28, hGap: 40, vGap: 16 }
  const col = bfsAssignLayers(nodes)
  const columns = groupByColumn(col, allNumbers)

  const maxCol = Math.max(...columns.keys(), 0)
  const maxRowCount = Math.max(...[...columns.values()].map((v) => v.length), 1)

  const svgWidth = (maxCol + 1) * (dims.nodeWidth + dims.hGap) + 20
  const svgHeight = maxRowCount * (dims.nodeHeight + dims.vGap) + 20

  const pos = computeNodePositions(columns, dims, svgHeight)

  let svg = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" class="dep-graph">`
  svg += `<defs><marker id="arrow" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="8" markerHeight="6" orient="auto"><path d="M0,0 L10,3 L0,6" fill="#8b949e"/></marker></defs>`
  svg += renderSvgEdges(nodes, pos, dims)
  svg += renderSvgNodes(allNumbers, pos, flat, dims)
  svg += `</svg>`
  return svg
}

function getPRDisplay(pr: PR): { label: string; cssClass: string } {
  if (pr.isDraft) return { label: 'Draft', cssClass: 'status-backlog' }
  if (pr.reviewDecision === 'APPROVED') return { label: 'Approved', cssClass: 'status-done' }
  if (pr.reviewDecision === 'CHANGES_REQUESTED') return { label: 'Changes', cssClass: 'pri-p1' }
  return { label: 'Open', cssClass: 'status-progress' }
}

function renderPRs(prs: PR[]): string {
  if (prs.length === 0) return '<p class="empty-state">No open pull requests</p>'

  let html = `<table class="sub-table"><thead><tr>
    <th>#</th><th>Title</th><th>Branch</th><th>Status</th><th>Changes</th><th>Updated</th>
  </tr></thead><tbody>`

  for (const pr of prs) {
    const { label: statusLabel, cssClass: statusClass } = getPRDisplay(pr)
    const age = timeAgo(pr.updatedAt)
    html += `<tr>
      <td><a href="${escHtml(pr.url)}" target="_blank" rel="noopener">#${pr.number}</a></td>
      <td>${escHtml(pr.title)}</td>
      <td><code>${escHtml(pr.branch)}</code></td>
      <td><span class="badge ${statusClass}">${statusLabel}</span></td>
      <td class="changes"><span class="additions">+${pr.additions}</span> <span class="deletions">-${pr.deletions}</span></td>
      <td class="text-muted">${age}</td>
    </tr>`
  }
  html += `</tbody></table>`
  return html
}

function renderBranchesAndWorktrees(branches: Branch[], worktrees: Worktree[]): string {
  const featureBranches = branches.filter((b) => b.name !== 'main' && b.name !== 'master')
  if (featureBranches.length === 0) return '<p class="empty-state">No feature branches</p>'

  // Index worktrees by branch name for quick lookup
  const wtByBranch = new Map<string, Worktree>()
  for (const wt of worktrees) {
    if (wt.branch) wtByBranch.set(wt.branch, wt)
  }

  let html = '<div class="branch-list">'
  for (const b of featureBranches) {
    const issueMatch = b.name.match(/(\d+)/)
    const issueNum = issueMatch ? `#${issueMatch[1]}` : ''
    const wt = wtByBranch.get(b.name)
    const shortPath = wt ? wt.path.replace(/^\/home\/[^/]+\/projects\//, '~/') : ''

    html += `<div class="branch-item">
      <span class="branch-icon">&#9095;</span>
      <code>${escHtml(b.name)}</code>
      ${issueNum ? `<span class="branch-issue">${issueNum}</span>` : ''}
      ${b.isCurrent ? '<span class="badge status-progress">current</span>' : ''}
      ${wt ? `<span class="wt-path">${escHtml(shortPath)}</span>` : ''}
    </div>`
  }
  html += '</div>'
  return html
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function buildHtml(
  issues: Issue[],
  prs: PR[],
  branches: Branch[],
  worktrees: Worktree[],
  fetchMs: number
): string {
  const totalCount = issues.reduce((sum, i) => sum + 1 + i.children.length, 0)

  const rows = issues.map((i) => issueRow(i)).join('')
  const depNodes = buildDepGraph(issues)
  const depGraphHtml = renderDepGraph(depNodes, issues)
  const prsHtml = renderPRs(prs)
  const branchesHtml = renderBranchesAndWorktrees(branches, worktrees)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Issues Dashboard</title>
<style>
  :root {
    --bg: #0d1117;
    --surface: #161b22;
    --border: #30363d;
    --text: #e6edf3;
    --text-muted: #8b949e;
    --accent: #58a6ff;
    --green: #3fb950;
    --orange: #d29922;
    --red: #f85149;
    --purple: #bc8cff;
    --pink: #f778ba;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.5;
    padding: 24px;
  }

  header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  header h1 {
    font-size: 20px;
    font-weight: 600;
  }

  .count {
    font-size: 13px;
    color: var(--text-muted);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 2px 10px;
  }

  .meta {
    margin-left: auto;
    font-size: 12px;
    color: var(--text-muted);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  thead th {
    text-align: left;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    color: var(--text-muted);
    font-weight: 500;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    position: sticky;
    top: 0;
    background: var(--bg);
    z-index: 1;
  }

  tbody td {
    padding: 6px 12px;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }

  .issue-row:hover { background: var(--surface); }

  .col-num { width: 50px; color: var(--text-muted); }
  .col-num a { color: var(--text-muted); text-decoration: none; }
  .col-num a:hover { color: var(--accent); }
  .col-title { min-width: 300px; white-space: normal; word-break: break-word; }
  .col-title a { color: var(--accent); text-decoration: none; }
  .col-title a:hover { text-decoration: underline; }
  .col-status { width: 90px; }
  .col-size { width: 50px; text-align: center; }
  .col-pri { width: 50px; text-align: center; }
  .col-block { width: 36px; text-align: center; }
  .col-deps { min-width: 120px; font-size: 12px; }

  .depth-child td { border-bottom: none; padding-top: 2px; padding-bottom: 2px; }
  .depth-child .col-title { padding-left: 28px; color: var(--text-muted); font-size: 12px; }
  .tree-prefix { color: var(--border); margin-right: 4px; font-family: monospace; }

  .badge {
    display: inline-block;
    padding: 1px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    border: 1px solid var(--border);
    color: var(--text-muted);
  }

  .pri-p0 { background: rgba(248,81,73,.15); color: var(--red); border-color: rgba(248,81,73,.4); }
  .pri-p1 { background: rgba(210,153,34,.15); color: var(--orange); border-color: rgba(210,153,34,.4); }
  .pri-p2 { background: rgba(88,166,255,.1); color: var(--accent); border-color: rgba(88,166,255,.3); }
  .pri-p3 { background: rgba(139,148,158,.1); color: var(--text-muted); border-color: var(--border); }

  .status-progress { background: rgba(63,185,80,.15); color: var(--green); border-color: rgba(63,185,80,.4); }
  .status-review { background: rgba(188,140,255,.15); color: var(--purple); border-color: rgba(188,140,255,.4); }
  .status-specs { background: rgba(247,120,186,.15); color: var(--pink); border-color: rgba(247,120,186,.4); }
  .status-analysis { background: rgba(210,153,34,.15); color: var(--orange); border-color: rgba(210,153,34,.4); }
  .status-backlog { }
  .status-done { background: rgba(63,185,80,.15); color: var(--green); border-color: rgba(63,185,80,.4); }

  .block-blocked { }
  .block-blocking { }
  .block-ready { }

  .dep { margin-right: 6px; white-space: nowrap; }
  .dep-blocked { color: var(--red); }
  .dep-blocking { color: var(--orange); }
  .dep-done { color: var(--green); }
  .dep-none { color: var(--text-muted); }

  .legend {
    margin-top: 16px;
    font-size: 12px;
    color: var(--text-muted);
    display: flex;
    gap: 20px;
  }

  kbd {
    font-family: monospace;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 1px 5px;
    font-size: 11px;
  }

  /* Sections */
  .section {
    margin-top: 32px;
  }

  .section h2 {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }

  .section-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-top: 32px;
  }

  .section-grid .section { margin-top: 0; }

  /* Dependency graph */
  .graph-container {
    overflow-x: auto;
    padding: 8px 0;
  }

  .dep-graph rect { cursor: default; }
  .dep-graph rect:hover { filter: brightness(1.2); }

  /* Sub-tables (PRs) */
  .sub-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .sub-table thead th {
    text-align: left;
    padding: 6px 10px;
    border-bottom: 1px solid var(--border);
    color: var(--text-muted);
    font-weight: 500;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .sub-table tbody td {
    padding: 5px 10px;
    border-bottom: 1px solid var(--border);
  }

  .sub-table a { color: var(--accent); text-decoration: none; }
  .sub-table a:hover { text-decoration: underline; }
  .sub-table code { font-size: 12px; color: var(--text-muted); background: var(--surface); padding: 1px 6px; border-radius: 4px; }

  .changes { font-family: monospace; font-size: 12px; }
  .additions { color: var(--green); }
  .deletions { color: var(--red); }
  .text-muted { color: var(--text-muted); }

  /* Branches & Worktrees */
  .branch-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .branch-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 13px;
  }

  .branch-item:hover { border-color: var(--accent); }

  .branch-icon { font-size: 14px; }
  .branch-issue { color: var(--accent); font-size: 12px; }
  .wt-path { font-size: 11px; color: var(--text-muted); margin-left: auto; }

  .empty-state {
    color: var(--text-muted);
    font-size: 13px;
    font-style: italic;
    padding: 12px 0;
  }
</style>
</head>
<body>
  <header>
    <h1>Issues Dashboard</h1>
    <span class="count">${totalCount} issues</span>
    <span class="meta">Fetched in ${fetchMs}ms &middot; Refresh page (<kbd>F5</kbd>) for latest data</span>
  </header>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Title</th>
        <th>Status</th>
        <th>Size</th>
        <th>Pri</th>
        <th>&#9889;</th>
        <th>Deps</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="legend">
    <span>⛔ blocked</span>
    <span>🔓 blocking</span>
    <span>✅ ready</span>
  </div>

  <div class="section">
    <h2>Dependency Graph</h2>
    <div class="graph-container">
      ${depGraphHtml}
    </div>
  </div>

  <div class="section">
    <h2>Pull Requests</h2>
    ${prsHtml}
  </div>

  <div class="section">
    <h2>Branches &amp; Worktrees</h2>
    ${branchesHtml}
  </div>

</body>
</html>`
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = Bun.serve({
  port: PORT,
  async fetch() {
    try {
      const start = performance.now()
      const [issues, prs, branches, worktrees] = await Promise.all([
        fetchIssues(),
        fetchPRs(),
        fetchBranches(),
        fetchWorktrees(),
      ])
      const fetchMs = Math.round(performance.now() - start)
      const html = buildHtml(issues, prs, branches, worktrees, fetchMs)
      return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return new Response(
        `<pre style="color:red;padding:20px;">Error fetching issues:\n${msg}</pre>`,
        { status: 500, headers: { 'Content-Type': 'text/html' } }
      )
    }
  },
})

console.log(`\n  Issues Dashboard → http://localhost:${server.port}\n`)
