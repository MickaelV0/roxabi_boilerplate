/**
 * GitHub API helpers — shared across skills.
 * All GitHub interactions go through gh CLI.
 */

import { GITHUB_REPO, PROJECT_ID } from './config'
import {
  ADD_BLOCKED_BY_MUTATION,
  ADD_SUB_ISSUE_MUTATION,
  ADD_TO_PROJECT_MUTATION,
  ITEM_ID_QUERY,
  PARENT_QUERY,
  REMOVE_BLOCKED_BY_MUTATION,
  REMOVE_SUB_ISSUE_MUTATION,
  UPDATE_FIELD_MUTATION,
} from './queries'

/** Run a shell command and return trimmed stdout. */
export async function run(cmd: string[]): Promise<string> {
  const proc = Bun.spawn(cmd, { stdout: 'pipe', stderr: 'pipe' })
  const stdout = await new Response(proc.stdout).text()
  await proc.exited
  return stdout.trim()
}

/** Execute a GraphQL query/mutation via `gh api graphql`. */
export async function ghGraphQL(
  query: string,
  variables: Record<string, string | number>
): Promise<unknown> {
  const args = ['gh', 'api', 'graphql', '-f', `query=${query}`]
  for (const [key, value] of Object.entries(variables)) {
    if (typeof value === 'number') {
      args.push('-F', `${key}=${value}`)
    } else {
      args.push('-f', `${key}=${value}`)
    }
  }

  const proc = Bun.spawn(args, { stdout: 'pipe', stderr: 'pipe' })
  const stdout = await new Response(proc.stdout).text()
  const stderr = await new Response(proc.stderr).text()
  const code = await proc.exited

  if (code !== 0) {
    throw new Error(`gh api graphql failed (${code}): ${stderr}`)
  }
  return JSON.parse(stdout)
}

/** Get issue node ID via REST API. */
export async function getNodeId(issueNumber: number | string): Promise<string> {
  return run(['gh', 'api', `repos/${GITHUB_REPO}/issues/${issueNumber}`, '--jq', '.node_id'])
}

/** Get project item ID for an issue number. */
export async function getItemId(issueNumber: number): Promise<string> {
  const [owner, repo] = GITHUB_REPO.split('/')
  const data = (await ghGraphQL(ITEM_ID_QUERY, { owner, repo, number: issueNumber })) as {
    data: {
      repository: {
        issue: { projectItems: { nodes: { id: string; project: { id: string } }[] } }
      }
    }
  }
  const items = data.data.repository.issue.projectItems.nodes
  const item = items.find((i) => i.project.id === PROJECT_ID)
  if (!item) throw new Error(`Issue #${issueNumber} not found in project`)
  return item.id
}

/** Add an issue to the project board. Returns the new item ID. */
export async function addToProject(nodeId: string): Promise<string> {
  const data = (await ghGraphQL(ADD_TO_PROJECT_MUTATION, {
    projectId: PROJECT_ID,
    contentId: nodeId,
  })) as { data: { addProjectV2Item: { item: { id: string } } } }
  return data.data.addProjectV2Item.item.id
}

/** Update a single-select project field value. */
export async function updateField(
  itemId: string,
  fieldId: string,
  optionId: string
): Promise<void> {
  await ghGraphQL(UPDATE_FIELD_MUTATION, {
    projectId: PROJECT_ID,
    itemId,
    fieldId,
    optionId,
  })
}

/** Add a blocked-by dependency between two issues. */
export async function addBlockedBy(issueId: string, blockingId: string): Promise<void> {
  await ghGraphQL(ADD_BLOCKED_BY_MUTATION, { issueId, blockingId })
}

/** Remove a blocked-by dependency between two issues. */
export async function removeBlockedBy(issueId: string, blockingId: string): Promise<void> {
  await ghGraphQL(REMOVE_BLOCKED_BY_MUTATION, { issueId, blockingId })
}

/** Add a sub-issue (parent/child) relationship. */
export async function addSubIssue(parentId: string, childId: string): Promise<void> {
  await ghGraphQL(ADD_SUB_ISSUE_MUTATION, { parentId, childId })
}

/** Remove a sub-issue (parent/child) relationship. */
export async function removeSubIssue(parentId: string, childId: string): Promise<void> {
  await ghGraphQL(REMOVE_SUB_ISSUE_MUTATION, { parentId, childId })
}

/** Get the parent issue number for an issue, or null if none. */
export async function getParentNumber(issueNumber: number): Promise<number | null> {
  const [owner, repo] = GITHUB_REPO.split('/')
  const data = (await ghGraphQL(PARENT_QUERY, { owner, repo, number: issueNumber })) as {
    data: { repository: { issue: { parent: { number: number } | null } } }
  }
  return data.data.repository.issue.parent?.number ?? null
}
