List issues missing Size or Priority and assign them.

## Usage

- `/issue-triage` - List issues to triage
- `/issue-triage set <num> --size <S> --priority <P>` - Assign

## Values

**Size**: XS, S, M, L, XL
**Priority**: High, Medium, Low

## Execution

```bash
.claude/commands/issue-triage/triage.sh [list] [--json]
.claude/commands/issue-triage/triage.sh set 1 --size M --priority High
```

## Config

`PROJECT_ID`, `SIZE_FIELD_ID`, `PRIORITY_FIELD_ID` env vars
