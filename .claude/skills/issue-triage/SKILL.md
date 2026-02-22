---
argument-hint: [list | set <num> | create --title "..." [--parent N] [--size S] [--priority P]]
description: Triage/create GitHub issues — set size/priority/status, manage dependencies & parent/child. Triggers: "triage" | "create issue" | "set size" | "set priority" | "blocked by" | "set parent" | "child of" | "sub-issue".
allowed-tools: Bash, AskUserQuestion
---

# Issue Triage

Create GitHub issues, assign Size/Priority/Status, manage blockedBy dependencies and parent/child (sub-issue) relationships.

## Instructions

1. **List untriaged issues**:
   ```bash
   .claude/skills/issue-triage/triage.sh list
   ```

2. **Review each issue** and determine appropriate values:
   - **Size**: Estimate effort (XS, S, M, L, XL)
   - **Priority**: Determine urgency (Urgent, High, Medium, Low)

3. **Set values** for each issue:
   ```bash
   .claude/skills/issue-triage/triage.sh set <number> --size <S> --priority <P>
   ```

4. **Update status** when needed:
   ```bash
   .claude/skills/issue-triage/triage.sh set <number> --status "In Progress"
   ```

5. **Create new issues** with optional fields:
   ```bash
   .claude/skills/issue-triage/triage.sh create --title "Title" [--body "Body"] [--label "bug,frontend"] [--size M] [--priority High] [--parent 163]
   ```

6. **Use AskUserQuestion** if unsure about Size or Priority for an issue.

## Size Guidelines

| Size | Description | Example |
|------|-------------|---------|
| **XS** | Trivial change, < 1 hour | Typo fix, config tweak |
| **S** | Small task, < 4 hours | Single file change, simple feature |
| **M** | Medium task, 1-2 days | Multi-file feature, requires testing |
| **L** | Large task, 3-5 days | Complex feature, architectural changes |
| **XL** | Very large, > 1 week | Major refactor, new system |

## Priority Guidelines

| Priority | Description | Action |
|----------|-------------|--------|
| **Urgent** (P0) | Blocking or critical | Do immediately |
| **High** (P1) | Important for current milestone | Do this sprint |
| **Medium** (P2) | Should be done soon | Plan for next sprint |
| **Low** (P3) | Nice to have | Backlog |

## Commands

### `list` — Show untriaged issues

| Flag | Description |
|------|-------------|
| *(none)* | Table of issues missing Size or Priority |
| `--json` | JSON output for programmatic use |

### `set <num>` — Update an existing issue

| Flag | Description |
|------|-------------|
| `--size <S>` | Set size (XS, S, M, L, XL) |
| `--priority <P>` | Set priority (Urgent, High, Medium, Low) |
| `--status <S>` | Set status (Backlog, Analysis, Specs, "In Progress", Review, Done) |
| `--blocked-by <N>[,<N>...]` | Add blocked-by dependency |
| `--blocks <N>[,<N>...]` | Add blocking dependency |
| `--rm-blocked-by <N>[,<N>...]` | Remove blocked-by dependency |
| `--rm-blocks <N>[,<N>...]` | Remove blocking dependency |
| `--parent <N>` | Set parent issue (make this a sub-issue of #N) |
| `--add-child <N>[,<N>...]` | Add child sub-issues |
| `--rm-parent` | Remove parent relationship |
| `--rm-child <N>[,<N>...]` | Remove child sub-issues |

### `create` — Create a new issue

| Flag | Description |
|------|-------------|
| `--title "..."` | Issue title (**required**) |
| `--body "..."` | Issue body/description |
| `--label "l1,l2"` | Comma-separated labels |
| `--size <S>` | Set size on creation |
| `--priority <P>` | Set priority on creation |
| `--status <S>` | Set status on creation (default: added to project as-is) |
| `--parent <N>` | Set parent issue on creation |
| `--add-child <N>[,<N>...]` | Add existing issues as children |
| `--blocked-by <N>[,<N>...]` | Set blocked-by on creation |
| `--blocks <N>[,<N>...]` | Set blocking on creation |

## Status Values

| Status | Description |
|--------|-------------|
| **Backlog** | Not yet started, waiting to be picked up |
| **Analysis** | Being researched / analyzed |
| **Specs** | Specification in progress or done |
| **In Progress** | Active development (has worktree/branch) |
| **Review** | In code review / PR open |
| **Done** | Completed and merged |

## Example Workflow

```bash
# 1. List issues to triage
.claude/skills/issue-triage/triage.sh list

# 2. Set size and priority
.claude/skills/issue-triage/triage.sh set 42 --size M --priority High

# 3. Update status
.claude/skills/issue-triage/triage.sh set 42 --status "In Progress"

# 4. Set dependencies
.claude/skills/issue-triage/triage.sh set 91 --blocked-by 117
.claude/skills/issue-triage/triage.sh set 117 --blocks 91,118

# 5. Remove dependencies
.claude/skills/issue-triage/triage.sh set 91 --rm-blocked-by 117

# 6. Set parent (make #164 a child of #163)
.claude/skills/issue-triage/triage.sh set 164 --parent 163

# 7. Add children to an epic
.claude/skills/issue-triage/triage.sh set 163 --add-child 164,165,166

# 8. Remove parent relationship
.claude/skills/issue-triage/triage.sh set 164 --rm-parent

# 9. Remove specific children
.claude/skills/issue-triage/triage.sh set 163 --rm-child 166

# 10. Create a new issue with full setup
.claude/skills/issue-triage/triage.sh create \
  --title "research: compare against example/repo" \
  --body "Deep analysis of example/repo" \
  --label "research" \
  --size S --priority Medium \
  --parent 163

# 11. Create an epic with existing children
.claude/skills/issue-triage/triage.sh create \
  --title "epic: improve CI pipeline" \
  --size L --priority High \
  --add-child 150,151,152
```

## Configuration

Environment variables (with defaults):
- `PROJECT_ID` - GitHub Project V2 ID
- `STATUS_FIELD_ID` - Project field ID for Status
- `SIZE_FIELD_ID` - Project field ID for Size
- `PRIORITY_FIELD_ID` - Project field ID for Priority

$ARGUMENTS
