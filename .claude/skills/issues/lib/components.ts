import type { Branch, Issue, PR, Worktree } from './types'

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
  ready: '\u2705',
  blocked: '\u26d4',
  blocking: '\ud83d\udd13',
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

export function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function shortTitle(title: string, max = 22): string {
  const cleaned = title
    .replace(/^(feat|chore|docs|fix|refactor)\(.*?\):\s*/i, '')
    .replace(/^Feature:\s*/i, '')
    .replace(/^LATER:\s*/i, '')
    .replace(/\s*\(.*?\)\s*$/, '')
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}...` : cleaned
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function formatDeps(issue: Issue): string {
  const parts: string[] = []
  for (const b of issue.blockedBy) {
    const icon = b.state === 'OPEN' ? '\u26d4' : '\u2705'
    parts.push(
      `<span class="dep dep-${b.state === 'OPEN' ? 'blocked' : 'done'}">${icon}#${b.number}</span>`
    )
  }
  for (const b of issue.blocking) {
    parts.push(`<span class="dep dep-blocking">\ud83d\udd13#${b.number}</span>`)
  }
  return parts.length > 0 ? parts.join(' ') : '<span class="dep-none">-</span>'
}

export function issueRow(issue: Issue, indent = 0, prefix = ''): string {
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

  let html = `<tr class="issue-row depth-${indent} ${blockClass}" data-issue="${issue.number}" data-status="${escHtml(issue.status)}" data-size="${escHtml(issue.size)}" data-priority="${escHtml(issue.priority)}">
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
    const childPrefix = isLast ? '\u2514 ' : '\u251c '
    html += issueRow(issue.children[i], indent + 1, childPrefix)
  }

  return html
}

function getPRDisplay(pr: PR): { label: string; cssClass: string } {
  if (pr.isDraft) return { label: 'Draft', cssClass: 'status-backlog' }
  if (pr.reviewDecision === 'APPROVED') return { label: 'Approved', cssClass: 'status-done' }
  if (pr.reviewDecision === 'CHANGES_REQUESTED') return { label: 'Changes', cssClass: 'pri-p1' }
  if (pr.labels.some((l) => l.toLowerCase() === 'reviewed'))
    return { label: 'Reviewed', cssClass: 'status-review' }
  return { label: 'Review', cssClass: 'status-progress' }
}

export function renderPRs(prs: PR[]): string {
  if (prs.length === 0) return '<p class="empty-state">No open pull requests</p>'

  let html = `<table class="sub-table"><thead><tr>
    <th>#</th><th>Title</th><th>Status</th><th>Changes</th><th>Updated</th>
  </tr></thead><tbody>`

  for (const pr of prs) {
    const { label: statusLabel, cssClass: statusClass } = getPRDisplay(pr)
    const age = timeAgo(pr.updatedAt)
    html += `<tr>
      <td><a href="${escHtml(pr.url)}" target="_blank" rel="noopener">#${pr.number}</a></td>
      <td class="col-pr-title" title="${escHtml(pr.title)}">
        ${escHtml(pr.title)}
        <div class="pr-branch"><span class="tree-prefix">\u2514</span><code>${escHtml(pr.branch)}</code></div>
      </td>
      <td><span class="badge ${statusClass}">${statusLabel}</span></td>
      <td class="changes"><span class="additions">+${pr.additions}</span> <span class="deletions">-${pr.deletions}</span></td>
      <td class="text-muted">${age}</td>
    </tr>`
  }
  html += `</tbody></table>`
  return html
}

export function renderBranchesAndWorktrees(branches: Branch[], worktrees: Worktree[]): string {
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
