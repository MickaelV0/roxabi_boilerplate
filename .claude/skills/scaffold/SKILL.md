---
argument-hint: [--spec <number> | --issue <number>]
description: Spec→PR execution engine — plan, scaffold, spawn agents, open PR. Triggers: "scaffold from spec" | "implement feature" | "execute spec" | "build from spec".
allowed-tools: Bash, AskUserQuestion, Read, Write, Glob, Grep, Edit, Task, Skill
---

# Scaffold

Spec → plan → worktree → micro-tasks → agents (test-first) → PR.

```
/scaffold --spec 42     Execute from spec
/scaffold --issue 42    Execute from issue (finds linked spec)
```

## Step 1 — Locate Spec

`--spec N` → `ls artifacts/specs/N-*.mdx` → read full → extract title, criteria, files.
`--issue N` → `gh issue view N --json title,body,labels` → find `artifacts/specs/N-*.mdx`.
¬found ⇒ suggest `/bootstrap`. **Stop.**

### Pre-flight: Ambiguity Check

Grep `\[NEEDS CLARIFICATION` in `artifacts/specs/N-*.mdx` (output_mode: count).
count > 0 ⇒ AskUserQuestion: **Resolve now** | **Return to bootstrap** | **Proceed anyway**

## Step 2 — Plan

Read `docs/processes/dev-process.mdx` + spec.

**2a. Scope:** Glob + Grep → files to create/modify + reference features for patterns.

**2b. Tier:** S | F-lite | F-full per dev-process.mdx. Judgment-based.

**2c. Agents:**

| Path prefix | Agent |
|------------|-------|
| `apps/web/`, `packages/ui/` | frontend-dev |
| `apps/api/`, `packages/types/` | backend-dev |
| `packages/config/`, root configs | devops |
| `docs/` | doc-writer |

Always: **tester**. Add: architect (new modules), security-auditor (auth/validation), doc-writer (new APIs).
Tier S ⇒ skip (single session).

**Intra-domain parallel:** ≥4 independent tasks in 1 domain ⇒ multiple same-type agents. F-full only. Shared barrel files ⇒ merge into single agent.

**2d. Tasks:** ∀ task: description, files, agent, dependencies, parallel-safe (Y/N).
Order: types → backend → frontend → tests → docs → config.

**2e. Slice Selection (multi-slice only):** ≥2 slices ⇒ AskUserQuestion (multiSelect): 1 option/slice `V{N}: {desc} ({files}, {agents})`.
Default: next unimplemented slice. Respect deps. Re-run `/scaffold` for remaining.

**2f. Present Plan:** AskUserQuestion: tier, slices, files, agents, tasks with `[parallel-safe: Y/N]`.
Options: **Approve** | **Modify** | **Cancel**

## Step 3 — Setup

**3a. Issue:** `gh issue view <N>` — ¬∃ ⇒ draft + AskUserQuestion (Create|Edit|Skip) + `gh issue create`.

**3b. Status:**

```bash
bun .claude/skills/issue-triage/triage.ts set <N> --status "In Progress"
```

**3c. Pre-flight:**

```bash
git branch --list "feat/<N>-*"
ls -d ../roxabi-<N> 2>/dev/null
git fetch origin staging
```

∃ branch ⇒ AskUserQuestion: Reuse | Recreate | Abort

**3d. Worktree:**

```bash
git worktree add ../roxabi-<N> -b feat/<N>-<slug> staging
cd ../roxabi-<N> && cp .env.example .env && bun install
cd apps/api && bun run db:branch:create --force <N>
```

XS exception: AskUserQuestion → if approved, `git checkout -b feat/<N>-<slug> staging`.

## Step 4 — Prepare Tasks

**4a. Ref Patterns:** Find similar feature → read 1-2 files for conventions. Store paths → inject in 5a.

**4b. Micro-Tasks (Tier F only):**

Tier S ⇒ skip → Step 5. Read [references/micro-tasks.md](references/micro-tasks.md).

**Summary:** spec (Breadboard+Slices ∨ criteria) → micro-tasks + verify commands → parallelization → consistency → `artifacts/plans/{issue}-{slug}.mdx` → AskUserQuestion → commit → TaskCreate.

Agents create files from scratch (¬stubs). Task desc: target path, shape/skeleton, ref pattern file.

## Step 5 — Implement

### 5a. Context Injection (Tier F only)

∀ agent: inject read instructions in Task prompt. Section headers only (¬numeric prefixes).

Template: "Read `{doc}` sections: {sections}. Read `{ref_file}` for conventions."

| Agent | Standards → Sections | +ref |
|-------|---------------------|:---:|
| frontend-dev | frontend-patterns: Component Patterns, AI Quick Ref · testing: FE Testing | ✓ |
| backend-dev | backend-patterns: Design Patterns, Error Handling, AI Quick Ref · testing: BE Testing | ✓ |
| tester | testing: Test Structure (AAA), Coverage, Mocking, AI-Assisted TDD | ✓ |
| architect | frontend-patterns + backend-patterns: AI Quick Ref | ✗ |
| devops, security-auditor, doc-writer | ∅ | ✗ |

### Tier S — Direct

Read spec + ref patterns (4a) → create + implement → tests → `bun lint && bun typecheck && bun run test` → loop until ✓.

### Tier F — Agent-Driven (test-first)

Spawn via `Task` (subagent/domain). Sequential ∨ parallel (2-3 max).

**RED → GREEN → REFACTOR:**
1. **RED** — tester: failing tests from spec. RED-GATE sentinel/slice.
2. **GREEN** — domain agents ∥: implement to pass. `ready` → run, `deferred` → wait RED-GATE.
3. **REFACTOR** — domain agents: refactor, keep tests ✓
4. **Verify** — tester: coverage + edge cases

**Per-task:** verify → ✓ | ✗ fix (max 3) | 3✗ → escalate. Track first-try pass rate (Step 7).
**Quality gate:** `bun lint && bun typecheck && bun run test` — ✓ → PR | ✗ → fix loop.

## Step 6 — PR

Stage files (¬`git add -A`) → `/commit` → push → `/pr`.

## Step 7 — Summary

```
Scaffold Complete
  Issue:    #N — title
  Branch:   feat/N-slug
  Worktree: ../roxabi-N
  Tier:     S|F-lite|F-full
  Agents:   list
  Files:    created/modified list
  Verify:   N/total first-try (%)
  PR:       #N
  Next:     /review → /1b1 → fixer → merge
```

## Rollback

```bash
gh pr close <pr-number>
cd ../roxabi_boilerplate
git worktree remove ../roxabi-<N>
git branch -D feat/<N>-<slug>
```

## Edge Cases

Read [references/edge-cases.md](references/edge-cases.md).

## Safety

1. ¬`git add -A` ∨ `git add .` — specific files only
2. ¬push without PR via `/pr`
3. ¬create issue without user approval
4. Always present plan (2f) + file list (4d)
5. Always worktree (XS exception w/ explicit lead approval)
6. Always HEREDOC for commit messages

$ARGUMENTS
