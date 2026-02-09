---
argument-hint: [list | set <num> --size <S> --priority <P> --status <Status>]
description: List issues missing Size or Priority and assign them. Also update issue Status.
allowed-tools: Bash, AskUserQuestion
---

# Issue Triage

Identify and label GitHub issues that are missing Size or Priority fields.

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

5. **Use AskUserQuestion** if unsure about Size or Priority for an issue.

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

## Options

| Command | Description |
|---------|-------------|
| `list` | Show issues missing Size or Priority |
| `list --json` | JSON output for programmatic use |
| `set <num> --size <S>` | Set size for issue |
| `set <num> --priority <P>` | Set priority for issue |
| `set <num> --status <Status>` | Set status for issue |
| `set <num> --size <S> --priority <P>` | Set size and priority |
| `set <num> --status <S> --size <S> --priority <P>` | Set all fields |

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
.claude/skills/issue-triage/triage.sh set 43 --size S --priority Medium

# 3. Update status
.claude/skills/issue-triage/triage.sh set 42 --status "In Progress"
.claude/skills/issue-triage/triage.sh set 43 --status Review
```

## Configuration

Environment variables (with defaults):
- `PROJECT_ID` - GitHub Project V2 ID
- `STATUS_FIELD_ID` - Project field ID for Status
- `SIZE_FIELD_ID` - Project field ID for Size
- `PRIORITY_FIELD_ID` - Project field ID for Priority

$ARGUMENTS
