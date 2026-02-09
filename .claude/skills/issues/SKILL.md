---
argument-hint: [--json | --priority]
description: List open issues from GitHub project with Status, Size, Priority, and dependencies.
allowed-tools: Bash, Read
---

# Issues

List open GitHub issues from the project board with their Status, Size, Priority, and dependency relationships.

## Instructions

1. **Run the script** to fetch issues:
   ```bash
   .claude/skills/issues/fetch_issues.sh
   ```

2. **Present the output in a code block**: Wrap the script output in triple backticks (```). Do NOT reformat or interpret the data - the script already produces a well-formatted table.

3. **Add brief recommendations** (2-3 lines max) based on what you see:
   - Issues with ✅ and high priority (P0/P1) should be prioritized
   - Issues missing Size or Priority need triage (suggest `/issue-triage`)
   - Identify the critical blocker if many issues are blocked

4. **Show work in progress** by running these commands and presenting their output:
   ```bash
   # Worktrees (parallel workspaces)
   git worktree list

   # Feature branches (exclude main/master)
   git branch --list | grep -v -E '^\*?\s*(main|master)$'

   # Open PRs
   gh pr list --state open
   ```

   Present this as a "Work in Progress" section after recommendations:
   - Show worktrees if any exist beyond the main one
   - Show feature branches that may relate to issues (look for issue numbers in branch names)
   - Show open PRs with their status (draft, review, etc.)

## Options

| Flag | Description |
|------|-------------|
| (none) | Table output sorted by Priority, then Size |
| `--json` | Raw JSON output for programmatic use |
| `--priority` | Sort by priority (default) |
| `--size` | Sort by size instead |
| `--title-length=N` | Truncate titles at N chars (default: 55) |

## Output Columns

| Column | Description |
|--------|-------------|
| `#` | Issue number |
| `Title` | Issue title with children as tree (├/└) |
| `Status` | Backlog, Analysis, Specs, In Prog, Review, Done |
| `Size` | XS, S, M, L, XL |
| `Pri` | P0, P1, P2, P3 |
| `⚡` | Block status (see below) |
| `Deps` | Detailed dependency list |

## Block Status (⚡ column)

| Icon | Meaning |
|------|---------|
| `✅` | Ready - no open blockers |
| `⛔` | Blocked - waiting on other issues |
| `🔓` | Blocking - other issues depend on this |

## Dependency Icons (Deps column)

| Icon | Meaning |
|------|---------|
| `⛔#N` | Blocked by issue #N (open) |
| `🔓#N` | Blocks issue #N |
| `✅#N` | Was blocked by #N (now closed) |

## Example Output

```
● 12 issues

  #    │ Title                                         │ Status     │ Size │ Pri │ ⚡ │ Deps
  #33  │ feat(i18n): Implement TanStack Start          │ In Progress│ M    │ P0  │ ✅ │ -
       │   ├ #34 chore(i18n): Add CI workflow...       │ Todo       │ XS   │ P0  │ ✅ │ -
       │   └ #35 feat(i18n): Add middleware...         │ Todo       │ S    │ P0  │ ✅ │ -
  #24  │ Feature: RBAC                                 │ Todo       │ M    │ P1  │ ⛔ │ ⛔#19 ⛔#21 🔓#25
  #19  │ Feature: Auth + Users                         │ Todo       │ L    │ P1  │ 🔓 │ 🔓#21 🔓#22 🔓#24

  ⛔=blocked  🔓=blocking  ✅=ready

  Chains:
  #19 Auth + Users ──► #21 Multi-tenant
                               └──► #22 Audit Logs
                               └──► #23 Notifications
  #28 Coding Standards ──► #12 Claude Code
```

**Recommendations:**
- Priority focus: #33 (i18n) is P0 and ready
- Critical blocker: #19 blocks 5 features

**Work in Progress:**
```
Worktrees:
  /home/user/project           abc1234 [main]
  /home/user/project-33        def5678 [feat/33-i18n]

Branches:
  feat/33-i18n
  feat/19-auth

PRs:
  #42  feat/33-i18n  Add i18n support  DRAFT
```

## Output Sections

| Section | Description |
|---------|-------------|
| Header | `● N issues` - Total count of open issues |
| Table | Issues sorted by Priority, then Size |
| Legend | Icon meanings for quick reference |
| Chains | Dependency visualization showing blocking relationships |
| Recommendations | Brief analysis of priorities and blockers |
| Work in Progress | Worktrees, branches, and open PRs |

## Dependencies (blockedBy / blocking)

GitHub's native **`blockedBy`** field is the source of truth for issue dependencies.

**Add** a dependency with `addBlockedBy`:

```graphql
mutation($issueId: ID!, $blockingId: ID!) {
  addBlockedBy(input: { issueId: $issueId, blockingIssueId: $blockingId }) {
    issue { number }
    blockingIssue { number }
  }
}
```

**Remove** a dependency with `removeBlockedBy`:

```graphql
mutation($issueId: ID!, $blockingId: ID!) {
  removeBlockedBy(input: { issueId: $issueId, blockingIssueId: $blockingId }) {
    issue { number }
    blockingIssue { number }
  }
}
```

- `issueId` = the issue that IS blocked (node ID)
- `blockingIssueId` = the issue that IS blocking (node ID)

**Get node IDs:** `gh api repos/OWNER/REPO/issues/NUMBER --jq '.node_id'`

**Example** — make #51 blocked by #19:
```bash
gh api graphql \
  -F query=@/tmp/mutation.graphql \
  -f issueId="$(gh api repos/OWNER/REPO/issues/51 --jq '.node_id')" \
  -f blockingId="$(gh api repos/OWNER/REPO/issues/19 --jq '.node_id')"
```

> **Important:** Always use `blockedBy`/`blocking` (not `trackedIssues`/`trackedInIssues`). The `blockedBy` field is GitHub's official dependency mechanism (GA August 2025).

## Configuration

Environment variables (with defaults):
- `PROJECT_ID` - GitHub Project V2 ID
- `GITHUB_REPO` - Repository in `owner/repo` format

$ARGUMENTS
