List open GitHub issues from the project board with Size, Priority, Labels, and dependencies.

## Usage

- `/issues` - Sorted by Size (XS → XL, then unestimated)
- `/issues --priority` - Sorted by Priority (High → Low)
- `/issues --json` - Raw JSON output

## Columns

| Column | Description |
|--------|-------------|
| # | Issue number |
| Title | Title (truncated to 40 chars) |
| Status | Todo, In Progress, Done |
| Size | XS, S, M, L, XL or - |
| Priority | H (High), M (Medium), L (Low) or - |
| Deps | ⛔#n (blocked by) or 🔓#n (blocks) or - |

## Execution

```bash
.claude/commands/issues/fetch_issues.sh [--size|--priority] [--json]
```

## Prerequisites

- `gh` CLI authenticated
- `jq`
