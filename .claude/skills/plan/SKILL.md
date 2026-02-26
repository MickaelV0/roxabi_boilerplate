---
name: plan
argument-hint: '[--issue <N> | --spec <path>]'
description: Implementation plan — tasks, agents, file groups, dependencies. Triggers: "plan" | "plan this" | "implementation plan" | "break it down".
allowed-tools: Bash, AskUserQuestion, Read, Write, Edit, Glob, Grep, Task
---

# Plan

Spec → micro-tasks → agent assignments → plan artifact.

**⚠ Flow: single continuous pipeline. ¬stop between steps. AskUserQuestion response → immediately execute next step. Stop only on: Cancel/Abort or Step 6 completion.**

```
/plan --issue 42      Generate plan from spec for issue #42
/plan --spec artifacts/specs/42-dark-mode.mdx   Generate plan from explicit spec path
```

## Step 1 — Locate Spec

`--issue N` → `ls artifacts/specs/N-*.mdx` → read full → extract title, criteria, files.
`--spec <path>` → read directly.
¬found ⇒ suggest `/spec` or `/bootstrap`. **Stop.**

### Pre-flight: Ambiguity Check

Grep `\[NEEDS CLARIFICATION` in spec (output_mode: count).
count > 0 ⇒ AskUserQuestion: **Resolve now** | **Return to spec** | **Proceed anyway**

## Step 2 — Plan

Read `docs/processes/dev-process.mdx` + spec.

**2a. Scope:** Glob + Grep → files to create/modify + reference features for patterns.

**2b. Tier:** S | F-lite | F-full per dev-process.mdx. If frame exists (`artifacts/frames/`), use its `tier` field. Otherwise assess from spec complexity.

**2c. Agents:**

| Path prefix | Agent |
|------------|-------|
| `apps/web/`, `packages/ui/` | frontend-dev |
| `apps/api/`, `packages/types/` | backend-dev |
| `packages/config/`, root configs | devops |
| `docs/` | doc-writer |

Always: **tester**. Add: architect (new modules), security-auditor (auth/validation), doc-writer (new APIs).
Tier S ⇒ skip agent assignment (single session).

**Intra-domain parallel:** ≥4 independent tasks in 1 domain ⇒ multiple same-type agents. F-full only. Shared barrel files ⇒ merge into single agent.

**2d. Tasks:** ∀ task: description, files, agent, dependencies, parallel-safe (Y/N).
Order: types → backend → frontend → tests → docs → config.

**2e. Slice Selection (multi-slice only):** ≥2 slices ⇒ AskUserQuestion (multiSelect): 1 option/slice `V{N}: {desc} ({files}, {agents})`.
Default: next unimplemented slice. Respect deps. Re-run `/plan` for remaining.

**2f. Present Plan:** AskUserQuestion: tier, slices, files, agents, tasks with `[parallel-safe: Y/N]`.
Options: **Approve** | **Modify** | **Cancel**
**Approve → immediately continue to Step 3 (¬stop).**

## Step 3 — Ref Patterns

Find similar existing feature → read 1-2 files for conventions. Store paths → note in plan for Step 4 agent context injection.

## Step 4 — Micro-Tasks (Tier F only)

Tier S ⇒ skip → Step 5. Read [references/micro-tasks.md](references/micro-tasks.md).

**Summary:** spec (Breadboard+Slices ∨ criteria) → micro-tasks + verify commands → parallelization → consistency → `artifacts/plans/{issue}-{slug}.mdx` → AskUserQuestion → commit.

Agents create files from scratch (¬stubs). Task desc: target path, shape/skeleton, ref pattern file.

### 4.1 Detect Spec Format

| Mode | Condition | Source |
|------|-----------|--------|
| Primary | ∃ `## Breadboard` ∧ `## Slices` | Parse affordances (U*/N*/S*) + slices (V*) |
| Fallback | ∃ `## Success Criteria` only | Parse criteria as SC-1, SC-2, ... |
| Skip | Neither present | Warn user, use text tasks from Step 2d |

### 4.2 Generate Micro-Tasks

**Primary mode (Breadboard + Slices):**

∀ slice (V1, V2, ...):
1. Identify referenced affordances (N1, N2, U1, S1)
2. Expand each → 1-3 micro-tasks by complexity
3. Order: S* → N* → U* → tests
4. Assign agents per Step 2c path rules
5. Generate verification command

**Fallback mode (Success Criteria):**

∀ criterion (SC-1, SC-2, ...):
1. Identify affected files + logic
2. Expand → 1-5 micro-tasks
3. Verification command ∨ `[manual]` marker
4. Assign agents per Step 2c

**Verification heuristics:**

| Change type | Verify |
|------------|--------|
| `.ts/.tsx` code | Unit test ∨ typecheck |
| Type defs | `bun run typecheck --filter=@repo/types` |
| Config (json/yaml) | `bun run lint && grep -q 'key' path` |
| Skill/agent (.md) | `grep -q 'expected' path` |
| Docs (.mdx) | `test -f path && grep -q '## Section' path` |
| Migrations | `bun run db:migrate && bun run db:generate --check` |
| Other | `[manual]` |

**RED tasks:** Structural verify only (grep test structure). Tests expected to fail pre-impl.

**Safety:** Single-quote grep args. Read-only only. Allowed: `bun run test`, `bun run typecheck`, `bun run lint`, `grep -q`, `test -f`, `bun run db:generate --check`.

**Per-slice floor:** ≥2 tasks (1 impl + 1 test). < 2 ⇒ merge with adjacent slice.

### Micro-Task Fields

| Field | Description |
|-------|-------------|
| Description | Imperative, specific |
| File path | Target file |
| Code snippet | Expected shape skeleton |
| Verify command | Bash confirmation |
| Expected output | Success criteria |
| Time estimate | 2-5 min (up to 8-10 for atomic ops) |
| `[P]` marker | Parallel-safe |
| Agent | Owner |
| Spec trace | SC-N ∨ U1→N1→S1 |
| Slice | V1, V2, ... |
| Phase | RED ∨ GREEN ∨ REFACTOR ∨ RED-GATE |
| Difficulty | 1-5 |

### 4.3 Detect Parallelization

`[P]` := ¬file-path conflict ∧ ¬import conflict with any other `[P]` task in same slice+phase.

∀ task pair in same slice:
1. Same file? → ¬parallel
2. Import dep? (read existing ∨ infer from wiring) → ¬parallel
3. Unknown → ¬parallel (conservative)

### 4.4 Scale Task Count

| Tier | Target | Floor |
|------|--------|-------|
| F-lite | 5-15 | 2 |
| F-full | 15-30 | 2 |

> 30 ⇒ AskUserQuestion: warn, suggest splitting. Show full list (¬truncate).
< 2 ⇒ warn, suggest text-based tasks from Step 2d.

### 4.5 Consistency Check

Bidirectional spec↔task:

1. **Coverage (spec→tasks):** ∀ criterion/affordance → ≥1 task. Report uncovered.
2. **Gold plating (tasks→spec):** ∀ task → spec trace required. **Exempt** (sole purpose only): infra, quality, build, docs.
3. **Report:** covered N/total, uncovered list, untraced list, exemptions count.

0 coverage ⇒ block agents. Return to spec ∨ regenerate.

## Step 5 — Write Plan Artifact

Write to `artifacts/plans/{issue}-{slug}.mdx`. Create `artifacts/plans/` dir if needed.

Use [references/plan-template.mdx](references/plan-template.mdx) format. See [references/micro-task-example.mdx](references/micro-task-example.mdx) for task formatting.

```markdown
---
title: "Plan: {title}"
issue: {N}
spec: artifacts/specs/{issue}-{slug}.mdx
complexity: {score}/10
tier: {tier}
generated: {ISO}
---
```

Include:
- Summary (1-2 sentences)
- Bootstrap Context (from analysis if exists, omit if none)
- Agents table (agent, task count, files)
- Consistency Report (covered/total, uncovered, untraced, exemptions)
- Micro-Tasks (grouped by slice/criteria, with RED-GATE sentinels)

## Step 6 — Approve + Commit

AskUserQuestion: complexity, tier, task count, agents, consistency, slices.
Options: **Approve** | **Modify** | **Return to spec**

On Approve → commit plan artifact (standalone commit, ¬amend):

```bash
mkdir -p artifacts/plans
git add artifacts/plans/{issue}-{slug}.mdx
git commit -m "$(cat <<'EOF'
docs(<scope>): add implementation plan for <feature>

Refs #<N>

Co-Authored-By: Claude <model> <noreply@anthropic.com>
EOF
)"
```

## Edge Cases

Read [references/edge-cases.md](references/edge-cases.md).

## Safety

1. ¬`git add -A` ∨ `git add .` — specific files only
2. ¬create issue without user approval
3. Always present plan (2f) before writing artifact
4. Show full task list (¬truncate) when count > 30

$ARGUMENTS
