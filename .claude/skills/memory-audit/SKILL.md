---
description: Audit and clean Claude Code auto-memory — prune stale/ephemeral/redundant entries. Triggers: "memory-audit" | "audit memory" | "clean memory" | "prune memory".
allowed-tools: Read, Edit, Write, Bash, Glob, AskUserQuestion
---

# Memory Audit

Audit and prune Claude Code auto-memory. Removes ephemeral, stale, and redundant entries. Keeps durable cross-session learnings.

## Memory Locations

```
~/.claude/projects/<project>/memory/MEMORY.md    # first 200 lines injected every session
~/.claude/projects/<project>/memory/*.md          # topic files loaded on demand
```

## Instructions

### Phase 1 — Inventory

1. Detect project memory path:
```bash
project_dir=$(echo "$PWD" | sed 's|/|-|g; s|^-||')
memory_dir="$HOME/.claude/projects/$project_dir/memory"
echo "Memory dir: $memory_dir"
ls -la "$memory_dir/" 2>/dev/null || echo "No memory directory found"
```

2. Read `MEMORY.md` and all topic files. For each file, count lines and parse into logical entries (H2 sections `##` or top-level bullet clusters).

3. Report inventory:
```
Memory Audit Inventory
  MEMORY.md: <N> lines / 200 cap (<N>%)
  Topic files: <count> (<total lines>)
  Total entries: <count>
```

If no memory directory exists or MEMORY.md is empty, report "Memory is clean" and stop.

### Phase 2 — Classify Each Entry

Apply this rubric to every entry:

| Signal | Category | Action |
|--------|----------|--------|
| References a specific issue number (#NNN), PR, branch name, or worktree path | **Ephemeral** | Flag for removal |
| References a file/workflow that no longer exists | **Stale** | Flag for removal |
| Duplicates content in CLAUDE.md, apps/*/CLAUDE.md, or docs/ | **Redundant** | Flag for removal |
| References a tool version or environment-specific value that may have changed | **Review** | Flag for human review |
| General pattern, architectural insight, or cross-session learning | **Durable** | Keep |

Cross-check referenced paths exist:
```bash
# For each file/path mentioned in an entry, verify it exists
# e.g., if entry says ".github/workflows/pr-review.yml":
test -f ".github/workflows/pr-review.yml" && echo "EXISTS" || echo "STALE"
```

Cross-check CLAUDE.md for redundancy:
```bash
# Check if the entry's key insight is already in CLAUDE.md
grep -l "<key phrase from entry>" CLAUDE.md apps/*/CLAUDE.md 2>/dev/null
```

### Phase 3 — Present Audit Report

Show a table with classification and recommendations:

```
Entry                          | Category   | Reason                | Action
───────────────────────────────┼────────────┼───────────────────────┼──────────
CI Workflow: pr-review.yml     | Durable    | Hard-won CI insight   | Keep
Worktree Pattern (general)     | Redundant  | In CLAUDE.md Rule 7   | Remove
Worktree #389 path             | Ephemeral  | Specific issue path   | Remove
```

Then `AskUserQuestion` with options:
- **Execute all recommendations** (auto-remove flagged, keep durable)
- **Review each entry 1-by-1** (per-entry keep/remove/edit decision)
- **Skip** (no changes)

### Phase 4 — Execute + Report

Apply approved edits to MEMORY.md and topic files. Report:

```
Memory Audit Complete
  Before: <N> lines / 200 cap
  After:  <N> lines / 200 cap
  Removed: <count> entries (<category breakdown>)
  Kept: <count> entries
```

### Phase 5 — Budget Warning (if needed)

If MEMORY.md exceeds 150 lines after cleanup:

`AskUserQuestion`: "MEMORY.md is at <N>/200 lines. Move detailed sections to topic files?"

If yes, identify the longest entries and offer to split them into `memory/<topic>.md` files, leaving only a 1-line pointer in MEMORY.md.

## When to Run

- Manually: `/memory-audit` anytime
- After `/promote` completes (feature shipped = ephemeral context may be stale)
- After `/cleanup` (branches cleaned = worktree references likely stale)
- When MEMORY.md approaches 150 lines
