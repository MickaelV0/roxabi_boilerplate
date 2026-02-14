/**
 * Pure utility functions for db-branch CLI script.
 *
 * Extracted from db-branch.ts to enable unit testing without triggering
 * the CLI's top-level side effects (process.argv parsing, process.exit, etc.).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorktreeInfo {
  path: string
  branch: string
  issueNumber: string | null
}

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

/** Redact the password portion of a postgresql:// URL for safe logging. */
export function redactUrl(url: string): string {
  return url.replace(/(\/\/[^:]+):.+@/, '$1:***@')
}

/** Build the DATABASE_URL for a branch database. */
export function buildDatabaseUrl(
  dbName: string,
  user: string,
  password: string,
  host = 'localhost',
  port = 5432
): string {
  return `postgresql://${user}:${password}@${host}:${port}/${dbName}`
}

/** Parse a single porcelain worktree block into a WorktreeInfo, or null if incomplete. */
export function parseWorktreeBlock(block: string): WorktreeInfo | null {
  const lines = block.split('\n')
  let wtPath = ''
  let branch = ''

  for (const line of lines) {
    if (line.startsWith('worktree ')) {
      wtPath = line.replace('worktree ', '')
    }
    if (line.startsWith('branch ')) {
      branch = line.replace('branch refs/heads/', '')
    }
  }

  if (!wtPath || !branch) return null

  const match = branch.match(/(?:feat|fix|hotfix)\/(\d+)/)
  return {
    path: wtPath,
    branch,
    issueNumber: match ? match[1] : null,
  }
}
