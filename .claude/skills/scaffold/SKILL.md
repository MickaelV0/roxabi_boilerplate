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

`--spec N` → `ls specs/N-*.mdx` → read full → extract title, criteria, files.
`--issue N` → `gh issue view N --json title,body,labels` → find `specs/N-*.mdx`.
¬found ⇒ suggest `/bootstrap`. **Stop.**

### Pre-flight: Ambiguity Check

Grep `\[NEEDS CLARIFICATION` in `specs/N-*.mdx` (output_mode: count).
count > 0 ⇒ AskUserQuestion: **Resolve now** | **Return to bootstrap** | **Proceed anyway**

## Step 2 — Plan

Read `docs/processes/dev-process.mdx` + spec.

### 2a. Scope

Glob + Grep → files to create/modify + reference features for patterns.

### 2b. Tier

S | F-lite | F-full per dev-process.mdx. Judgment-based.

### 2c. Agents

| Path prefix | Agent |
|------------|-------|
| `apps/web/`, `packages/ui/` | frontend-dev |
| `apps/api/`, `packages/types/` | backend-dev |
| `packages/config/`, root configs | devops |
| `docs/` | doc-writer |

Always: **tester**. Add: architect (new modules), security-auditor (auth/validation), doc-writer (new APIs).
Tier S ⇒ skip (single session).

**Intra-domain parallel:** ≥4 independent tasks in 1 domain ⇒ multiple same-type agents. F-full only. Shared barrel files ⇒ merge into single agent.

### 2d. Tasks

∀ task: description, files, agent, dependencies, parallel-safe (Y/N).
Order: types → backend → frontend → tests → docs → config.

### 2e. Slice Selection (multi-slice only)

≥2 slices ⇒ AskUserQuestion (multiSelect): 1 option/slice `V{N}: {desc} ({files}, {agents})`.
Default: next unimplemented slice. Respect deps. Re-run `/scaffold` for remaining.

### 2f. Present Plan

AskUserQuestion: tier, slices, files, agents, tasks with `[parallel-safe: Y/N]`.
Options: **Approve** | **Modify** | **Cancel**

## Step 3 — Setup

### 3a. Issue

`gh issue view <N>` — ¬∃ ⇒ draft + AskUserQuestion (Create|Edit|Skip) + `gh issue create`.

### 3b. Status

```bash
bun .claude/skills/issue-triage/triage.ts set <N> --status "In Progress"
```

### 3c. Pre-flight

```bash
git branch --list "feat/<N>-*"
ls -d ../roxabi-<N> 2>/dev/null
git fetch origin staging
```

∃ branch ⇒ AskUserQuestion: Reuse | Recreate | Abort

### 3d. Worktree

```bash
git worktree add ../roxabi-<N> -b feat/<N>-<slug> staging
cd ../roxabi-<N> && cp .env.example .env && bun install
cd apps/api && bun run db:branch:create --force <N>
```

XS exception: AskUserQuestion → if approved, `git checkout -b feat/<N>-<slug> staging`.

## Step 4 — Prepare Tasks

### 4a. Reference Patterns

Find similar feature → read 1-2 files for conventions (naming, exports, test placement).
Store reference paths + patterns → inject into agent prompts (Step 5a).

### 4b. Micro-Tasks (Tier F only)

Tier S ⇒ skip → Step 5.
Read [references/micro-tasks.md](references/micro-tasks.md) for full procedure.

**Summary:** Parse spec (Breadboard+Slices ∨ Success Criteria) → generate micro-tasks with verification commands → detect parallelization → consistency check → write plan artifact to `plans/{issue}-{slug}.mdx` → AskUserQuestion approval → commit plan → dispatch TaskCreate entries.

Micro-tasks include file creation — agents create files from scratch during implementation (¬orchestrator stubs). Each task description specifies: target file path, expected shape/skeleton, reference pattern file to follow.

## Step 5 — Implement

### 5a. Context Injection (Tier F-lite / F-full only)

Tier S ⇒ skip this sub-step.

For each agent to spawn, include domain-specific read instructions in the Task prompt. Use section header text only (no numeric prefixes) — robust against section renumbering.

**Reference patterns:** Include reference file paths from Step 4a in each agent prompt: "Read `{ref_file}` for naming/export/test conventions before creating files."

| Agent | Read instructions to inject |
|-------|----------------------------|
| **frontend-dev** | "Before implementing, read `docs/standards/frontend-patterns.mdx` sections: Component Patterns, AI Quick Reference. Read `docs/standards/testing.mdx` section: Frontend Testing Patterns. Read `{ref_file}` for conventions." |
| **backend-dev** | "Before implementing, read `docs/standards/backend-patterns.mdx` sections: Design Patterns, Error Handling, AI Quick Reference. Read `docs/standards/testing.mdx` section: Backend Testing Patterns. Read `{ref_file}` for conventions." |
| **tester** | "Before writing tests, read `docs/standards/testing.mdx` sections: Test Structure (AAA Pattern), Coverage Guidelines, Mocking Strategies, AI-Assisted TDD Workflow. Read `{ref_file}` for test placement conventions." |
| **architect** | "Before reviewing architecture, read `docs/standards/frontend-patterns.mdx` section: AI Quick Reference. Read `docs/standards/backend-patterns.mdx` section: AI Quick Reference." |
| **devops** | No standards doc injection (devops reads config files, not standards docs) |
| **security-auditor** | No standards doc injection (uses built-in OWASP checklist) |
| **doc-writer** | No standards doc injection (reads API definitions and spec files, not standards docs) |

Agents receive these instructions as part of their Task prompt and read the specified sections instead of discovering and reading full docs. Agents create all files from scratch — no pre-existing stubs.

### Tier S — Direct

Read spec criteria + reference patterns (4a) → create files + implement → tests → `bun lint && bun typecheck && bun run test` → loop until ✓.

### Tier F — Agent-Driven (test-first)

Spawn via `Task` (subagent per domain). Sequential ∨ parallel batches (2-3 max).

**RED → GREEN → REFACTOR:**

1. **RED** — tester: failing tests from spec. Marks RED-GATE sentinel per slice.
2. **GREEN** — domain agents parallel: implement to pass. Verification: `ready` → run now, `deferred` → wait for RED-GATE.
3. **REFACTOR** — domain agents: refactor, keep tests ✓
4. **Verify** — tester: coverage + edge cases

**Per-task loop:** verify → ✓ complete | ✗ fix (max 3) | 3✗ → escalate to lead.
Track first-try pass rate for Step 7 summary.

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
