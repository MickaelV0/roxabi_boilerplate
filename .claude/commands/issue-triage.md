List issues missing Size or Priority and assign them.

## Usage

- `/issue-triage` - List issues to triage
- `/issue-triage set <num> --size <S> --priority <P>` - Assign values

## Values

**Size**: XS, S, M, L, XL
**Priority**: High, Medium, Low

## Execution

```bash
# List
.claude/commands/issue-triage/triage.sh [list] [--json]

# Assign
.claude/commands/issue-triage/triage.sh set 1 --size M --priority High
```

## Prerequisites

- `gh` CLI authenticated
- `jq`
