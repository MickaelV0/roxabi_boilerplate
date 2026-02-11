---
argument-hint: --spec <number|path>
description: Generate a structured implementation plan from an existing spec.
allowed-tools: AskUserQuestion, Read, Glob, Grep
---

# Plan

Generate a structured implementation plan from an existing spec. Breaks the spec into ordered tasks with file impact, effort estimates, dependencies, and tier suggestion.

## Instructions

### 1. Locate the Spec

Resolve the `--spec` argument:

- **Issue number** (`--spec 42`): Glob for `docs/specs/42-*.mdx`
- **File path** (`--spec path/to/spec.mdx`): Read directly

If not found:
- Inform the user: "No spec found for #{N}."
- Suggest: "Run `/bootstrap` or `/interview` to create one first."
- **Stop.**

### 2. Read and Understand the Spec

- Read the full spec file
- Identify: goal, scope, constraints, acceptance criteria, non-goals
- Read relevant project standards to understand existing patterns:
  - `docs/standards/frontend-patterns.mdx` (if frontend work)
  - `docs/standards/backend-patterns.mdx` (if backend work)
  - `docs/standards/testing.mdx` (if tests required)

If the spec is **too vague** to plan (missing goal, scope, or acceptance criteria):
- Ask clarifying questions via `AskUserQuestion` before proceeding
- Do not generate a plan from an ambiguous spec

### 3. Analyze Scope

Identify all files that need to be created or modified:

- **New files:** Types, API routes, UI components, tests, configs
- **Modified files:** Existing modules, shared types, barrel exports, routing
- **Reference files:** Existing similar features to use as patterns

Count files and determine tier:

| File Count | Architectural Impact | Tier |
|------------|---------------------|------|
| 1-3 files | None | **S** — Direct branch, no worktree |
| 3-10 files | Local | **M** — Worktree mandatory |
| >10 files | System-wide | **L** — Full spec + worktree |

### 4. Generate Implementation Plan

Break the spec into ordered tasks. For each task:

- **Description:** What to implement and why
- **Files:** Specific files to create or modify (full paths)
- **Effort:** S (small), M (medium), or L (large)
- **Dependencies:** Which tasks must complete first

Define the implementation order:
1. Types and interfaces first (foundation)
2. Backend logic (API, services, database)
3. Frontend components (UI, hooks, pages)
4. Tests (unit, integration, e2e)
5. Configuration and wiring (routes, barrel exports)

### 5. Present Tier Suggestion

Present the auto-detected tier via `AskUserQuestion`:
- Show the file count and rationale
- Let the user **confirm or override** the tier
- If overridden, adjust recommendations accordingly (e.g., skip worktree for S)

### 6. Present Full Plan for Approval

Present the complete plan via `AskUserQuestion`:
- Use the output format below
- Ask: "Approve this plan, or provide feedback to adjust?"
- If **rejected:** Ask what to change, regenerate the plan
- If **approved:** Output is ready for `/scaffold`

## Plan Output Format

```
## Implementation Plan: {Spec Title}

**Spec:** docs/specs/{N}-{slug}.mdx
**Tier:** {S|M|L} (auto-detected, user-confirmed)
**Files:** {N} files to create/modify
**Estimated effort:** {total}

### Task 1: {Description}
- **Files:** `{path/to/file1}`, `{path/to/file2}`
- **Effort:** {S|M|L}
- **Dependencies:** none

### Task 2: {Description}
- **Files:** `{path/to/file3}`
- **Effort:** {S|M|L}
- **Dependencies:** Task 1

...

### Implementation Order
1. Task {N} — {reason} (e.g., "defines types used by all other tasks")
2. Task {N} — {reason}
3. Task {N} — {reason}

### Recommended Agents (Tier M/L only)
{agent list} + reviewer + tester

> To spawn: `/teammates add {agent1} {agent2} reviewer tester`
```

### Agent Recommendation Logic

For Tier M and L plans, analyze the file paths to recommend agents:

| File path prefix | Agent |
|-----------------|-------|
| `apps/web/`, `packages/ui/` | `frontend-dev` |
| `apps/api/`, `packages/types/` | `backend-dev` |
| `packages/config/`, root configs | `infra-ops` |
| `docs/` | `doc-writer` |

**Always include:** `reviewer` + `tester`

**Add if applicable:**
- `architect` — if the plan involves new modules, cross-domain types, or structural changes
- `security-auditor` — if the plan touches auth, input validation, or data access
- `doc-writer` — if the plan creates new architecture or public APIs

**Skip agent recommendation** for Tier S plans (single-agent session).

## Edge Cases

- **Spec not found:** Inform user, suggest `/bootstrap` or `/interview`. Stop.
- **Spec too vague:** Ask clarifying questions via `AskUserQuestion` before generating plan.
- **User overrides tier:** Accept the override and adjust plan (e.g., remove worktree recommendation for S, add worktree for upgraded tier).
- **Spec references unknown dependencies:** Flag them in the plan as risks, ask user to confirm they exist.
- **Called from `/bootstrap`:** Works identically — `/bootstrap` passes the spec path, `/plan` returns the approved plan.

$ARGUMENTS
