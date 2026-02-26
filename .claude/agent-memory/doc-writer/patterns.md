# Skill SKILL.md Patterns

## Frontmatter

```yaml
---
name: skill-name
argument-hint: '[args]'
description: Short description. Triggers: "trigger phrase" | "other trigger".
allowed-tools: Bash, AskUserQuestion, Read, Write, Edit, Glob, Grep
---
```

## Compressed Notation

- `Let:` block at top defines variables (φ, σ, α, τ, Σ, N, etc.)
- `∃` = exists, `¬` = not, `⇒` = implies, `∀` = for all
- `∧` = and, `∨` = or, `∅` = empty/null
- `→` = maps to / leads to
- `S*` = "next step" variable convention
- Step labels: `## Step 0 — Name`, `## Step 1 — Name`, etc.
- AskUserQuestion options written as `**Option**`
- Conditions: `∃ X ⇒ do Y` / `¬∃ X ⇒ do Z`
- Negation prefix: `¬do-something` means "do NOT do something"

## File Structure

1. Frontmatter (YAML)
2. `# Title`
3. `Let:` variable block
4. One-line summary sentence
5. `## Entry` (how to invoke)
6. `## Step N — Name` sections
7. `## Completion`
8. `## Edge Cases`
9. `$ARGUMENTS` (last line, always)

## Skill Invocation

```
skill: "skill-name", args: "--issue N"
```

## State Maps

Use Σ for state dictionaries:
```
Σ = { step: bool, ... }
```
