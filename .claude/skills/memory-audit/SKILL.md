---
description: Audit and drain Claude Code auto-memory — every entry gets resolved (fix/promote/relocate/delete), target is memory=0. Triggers: "memory-audit" | "audit memory" | "clean memory" | "prune memory".
allowed-tools: Read, Edit, Write, Bash, Glob, AskUserQuestion
---

# Memory Audit

**Goal: μ → 0.** Memory is a inbox, ¬a knowledge base. Every ε must be resolved to a permanent home or deleted.

Let:
  ε := entry (H2 section `##` or top-level bullet cluster)
  μ := MEMORY.md                    — first κ lines injected every session
  τ := memory/*.md                  — topic files, loaded on demand
  κ := 200                          — line cap
  δ := ~/.claude/projects/<project>/memory/    — project memory (orchestrator)
  α := .claude/agent-memory/*/MEMORY.md        — agent memory (per-agent)

## Resolutions

Every ε resolves to exactly one:

| Resolution | When | Action |
|-----------|------|--------|
| **Fix** | Root cause is a bug or design flaw | Fix the code/config/workflow, then delete ε |
| **Promote** | Durable insight needed by multiple agents | Move content to permanent target (see placement), delete ε |
| **Relocate** | Domain/agent-specific knowledge | Move to scoped target (see placement), delete ε |
| **Delete** | Ephemeral, stale, already covered, or resolved by fix/promote/relocate | Delete ε |

### Placement Hierarchy

When promoting or relocating, pick the **narrowest** target that covers all consumers:

```
∀ agents need it?              → CLAUDE.md (root)
Agent coordination/delegation? → AGENTS.md
∀ agents in one domain?        → apps/web/CLAUDE.md or apps/api/CLAUDE.md
Single agent type?             → .claude/agents/<agent>.md
Single skill?                  → .claude/skills/<skill>/SKILL.md
Human-facing documentation?    → docs/<topic>.mdx
Process/workflow knowledge?    → docs/processes/ or docs/standards/
```

## Audit Log

Log: `artifacts/memory-audit-log.md` — append-only, persists across audits.

```markdown
## Audit <YYYY-MM-DD>

| ε | Source | Resolution | Target | Recurrence |
|---|--------|-----------|--------|------------|
| CI --allowed-tools | δ/μ | Promote | CLAUDE.md § Gotchas | 1st |
| CSS injection pattern | α/frontend-dev | Relocate | apps/web/CLAUDE.md | 2nd ⚠️ |
| Worktree #389 | δ/μ | Delete | — | 1st |

Recurrences: 1 (CSS injection — promoted in audit 2026-02-15 but reappeared in α/frontend-dev)
```

### Recurrence Detection

Before classifying (Phase 2), scan the log for prior resolutions of similar entries:

```bash
# Check if key phrase from ε was resolved before
grep -i "<key phrase>" artifacts/memory-audit-log.md 2>/dev/null
```

Recurrence = ε resolves to same topic as a prior audit entry. This means:

| Recurrence Count | Signal | Action |
|-----------------|--------|--------|
| 1st | Normal | Resolve normally |
| 2nd | **Fix didn't stick** | Flag ⚠️ — investigate why: wrong target? agents ¬reading it? docs unclear? |
| 3rd+ | **Systemic gap** | Flag 🔴 — the permanent home is broken. Create an issue to fix the root cause (docs structure, agent prompt, CLAUDE.md gap) |

∀ ε with recurrence ≥ 2: AskUserQuestion with root cause options:
- **Wrong target** — content was placed somewhere agents don't read → move to better location
- **Unclear docs** — content exists but is ambiguous/buried → rewrite at target
- **Agent prompt gap** — agent definition doesn't reference the right docs → fix agent .md
- **Process gap** — no docs target fits → create new section/file
- **Create issue** — too complex to fix now, track it

## Instructions

### Phase 1 — Inventory

1. Detect δ + α:
```bash
project_dir=$(echo "$PWD" | sed 's|/|-|g; s|^-||')
memory_dir="$HOME/.claude/projects/$project_dir/memory"
echo "=== Project memory (δ) ==="
echo "Memory dir: $memory_dir"
ls -la "$memory_dir/" 2>/dev/null || echo "No project memory directory found"

echo "=== Agent memory (α) ==="
ls -la .claude/agent-memory/*/MEMORY.md 2>/dev/null || echo "No agent memory files found"
```

2. Read μ + all τ + all α. ∀ file: count lines, parse into ε set.

3. Report:
```
Memory Audit Inventory
  Project memory (δ):
    MEMORY.md: <N> lines / κ cap (<N>%)
    Topic files: |τ| (<total lines>)
  Agent memory (α):
    <agent>: <N> lines / <N> entries
    ...
  Total entries: |ε|
```

δ ∄ ∧ α = ∅ → report "Memory is clean — all sources = 0", halt.

### Phase 2 — Classify + Resolve

∀ ε determine resolution:

| Signal | Resolution | Example |
|--------|-----------|---------|
| Describes a bug/workaround that should be fixed properly | **Fix** | "bun test ≠ bun run test" → fix hook or docs |
| Cross-cutting insight not yet in permanent docs | **Promote** | CI --allowed-tools finding → CLAUDE.md |
| Agent/domain-specific knowledge in global memory | **Relocate** | API auth pattern → apps/api/CLAUDE.md |
| References #NNN, PR, branch, worktree path | **Delete** | Ephemeral context |
| References file/workflow that ∄ on disk | **Delete** | Stale |
| Already exists in CLAUDE.md, docs/, or agent defs | **Delete** | Redundant |
| Tool version or env-specific value | **Delete** (or Fix) | Likely stale |

Verify ∀ ε:
```bash
# Referenced paths exist?
test -f "<path from ε>" && echo "EXISTS" || echo "STALE"

# Already in permanent docs?
grep -l "<key phrase>" CLAUDE.md apps/*/CLAUDE.md docs/**/*.mdx 2>/dev/null
```

### Phase 3 — Present Resolution Plan

```
ε                              │ Resolution │ Target                        │ Reason
───────────────────────────────┼────────────┼───────────────────────────────┼──────────────────
CI --allowed-tools finding     │ Promote    │ CLAUDE.md § Gotchas           │ All agents need it
Worktree pattern               │ Delete     │ —                             │ Already in CLAUDE.md Rule 7
API auth edge case             │ Relocate   │ apps/api/CLAUDE.md            │ API-specific
bun test footgun               │ Fix        │ docs/standards/testing.mdx    │ Should be documented properly
Worktree #389 path             │ Delete     │ —                             │ Ephemeral
```

AskUserQuestion:
- **Execute all** (apply all resolutions)
- **1-by-1** (per-ε approve/change resolution)
- **Skip** (¬changes)

### Phase 4 — Execute

∀ approved ε, in order:

1. **Fix**: make the code/config change, ¬just delete
2. **Promote**: append content to target file (respect existing structure)
3. **Relocate**: append content to scoped target
4. **Delete**: remove from μ/τ/α

After all resolutions applied → delete ε from μ/τ/α.

### Phase 5 — Log

Append audit entry to `artifacts/memory-audit-log.md` (create if ∄):

```markdown
## Audit <YYYY-MM-DD>

| ε | Source | Resolution | Target | Recurrence |
|---|--------|-----------|--------|------------|
| ... | ... | ... | ... | Nth |

Summary: <N> fixed, <N> promoted, <N> relocated, <N> deleted
Recurrences: <N> (details)
```

### Phase 6 — Verify Zero + Report

Report:
```
Memory Audit Complete
  Before: <N> entries, <N> lines
  After:  <N> entries, <N> lines
  ─────────────────────────────
  Fixed:     <N> (code/config changes made)
  Promoted:  <N> (→ permanent docs)
  Relocated: <N> (→ scoped targets)
  Deleted:   <N> (ephemeral/stale/redundant)
  ─────────────────────────────
  Recurrences: <N> ⚠️ (fix didn't stick)
  Systemic:    <N> 🔴 (3rd+ occurrence)
  Target: μ = 0
```

μ + τ + α still have content → report remaining ε as blockers.

μ = 0 ∧ |τ| = 0 ∧ |α| = 0 → "Memory fully drained."

## When to Run

- `/memory-audit` anytime
- After `/promote` (feature shipped → ephemeral context likely stale)
- After `/cleanup` (branches cleaned → worktree refs likely stale)
- Proactively when |ε| > 5 or μ > 50 lines

$ARGUMENTS
