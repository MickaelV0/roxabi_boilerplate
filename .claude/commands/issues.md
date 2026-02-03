List open issues from GitHub project with Status, Size, Priority, and dependencies.

## Usage

- `/issues` - Sorted by Size
- `/issues --priority` - Sorted by Priority
- `/issues --json` - Raw JSON

## Columns

| Col | Description |
|-----|-------------|
| # | Issue number |
| Title | Truncated to 40 chars |
| Status | Todo, In Progress, Done |
| Size | XS, S, M, L, XL |
| Pri | H (High), M (Medium), L (Low) |
| Deps | ⛔ blocked by (open) / ✅ blocked by (closed) / 🔓 blocks |

## Execution

```bash
.claude/commands/issues/fetch_issues.sh [--size|--priority] [--json]
```

## Config

`PROJECT_ID` env var (default: Roxabi Boilerplate project)

## Output

**IMPORTANT:** Always display the complete script output as-is, with all tables. Never summarize or condense the results.
