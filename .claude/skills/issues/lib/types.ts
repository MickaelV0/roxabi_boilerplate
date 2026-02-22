export interface RawFieldValue {
  name?: string
  field?: { name?: string }
}

export interface RawSubIssue {
  number: number
  state: string
  title: string
}

export interface RawContent {
  number: number
  title: string
  state: string
  url: string
  subIssues?: { nodes: RawSubIssue[] }
  parent?: { number: number; state: string } | null
  blockedBy?: { nodes: { number: number; state: string }[] }
  blocking?: { nodes: { number: number; state: string }[] }
}

export interface RawItem {
  content: RawContent
  fieldValues: { nodes: RawFieldValue[] }
}

export interface Issue {
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

export interface PR {
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
  labels: string[]
}

export interface Branch {
  name: string
  isCurrent: boolean
}

export interface Worktree {
  path: string
  branch: string
  commit: string
  isBare: boolean
}

export interface DepNode {
  number: number
  title: string
  blockStatus: string
  targets: number[]
}

export interface GraphDims {
  nodeWidth: number
  nodeHeight: number
  hGap: number
  vGap: number
}
