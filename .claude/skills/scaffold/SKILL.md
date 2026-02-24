---
argument-hint: [--spec <number> | --issue <number>]
description: Spec→PR execution engine — plan, scaffold, spawn agents, open PR. Triggers: "scaffold from spec" | "implement feature" | "execute spec" | "build from spec".
allowed-tools: Bash, AskUserQuestion, Read, Write, Glob, Grep, Edit, Task, Skill
---

# Scaffold

Full execution engine: takes an approved spec (or issue with spec) and drives it to a pull request. Plans internally, creates the worktree, scaffolds boilerplate, spawns agents for test-first implementation, and opens the PR.

## Usage

```
/scaffold --spec 42            Execute from spec (specs/42-*.mdx)
/scaffold --issue 42           Execute from issue (fetches issue, finds linked spec)
```

## Instructions

### Step 1 — Locate the Spec

**If `--spec <number>` was passed:**

```bash
ls specs/<number>-*.mdx
```

- Read the spec file in full
- Extract: title, summary, acceptance criteria, and file list

**If `--issue <number>` was passed:**

```bash
gh issue view <number> --json title,body,labels
```

- Read the issue, then search for a matching spec: `specs/<number>-*.mdx`
- If no spec found: inform the user and suggest `/bootstrap --issue <number>` to create one. **Stop.**

**If no spec or issue is found:** inform the user and suggest:

> "No spec found. Run `/bootstrap` to create one from scratch, or `/interview` to generate a spec."

**Stop.**

### Step 2 — Plan

Read `docs/processes/dev-process.mdx` and the spec to produce an implementation plan.

#### 2a. Analyze Scope

Identify all files that need to be created or modified:

- **New files:** Types, API routes, UI components, tests, configs
- **Modified files:** Existing modules, shared types, barrel exports, routing
- **Reference files:** Existing similar features to use as patterns

Use `Glob` and `Grep` to find existing feature modules as reference patterns.

#### 2a.1. Pre-flight: Check for unresolved ambiguity markers

Scan the spec for unresolved markers. Use the **Grep** tool to count matches:

- **Pattern:** `\[NEEDS CLARIFICATION`
- **Path:** `specs/<number>-*.mdx`
- **Output mode:** `count`

**If markers are found (count > 0):**

Present via `AskUserQuestion`:

> "The spec contains {N} unresolved `[NEEDS CLARIFICATION]` marker(s). These indicate ambiguity that should be resolved before implementation."

Options:
- **Resolve now** — List each marker for inline resolution (user provides the answer, scaffold updates the spec)
- **Return to bootstrap** — Go back to `/bootstrap --spec <N>` to resolve via interview
- **Proceed anyway** — Continue scaffolding with known ambiguity (adds risk)

**If no markers found:** proceed normally.

#### 2b. Determine Tier

Classify as S / F-lite / F-full per [dev-process.mdx](docs/processes/dev-process.mdx). Judgment-based, not file-count-based.

#### 2c. Determine Agents

Analyze file paths from the spec to recommend agents:

| File path prefix | Agent |
|-----------------|-------|
| `apps/web/`, `packages/ui/` | `frontend-dev` |
| `apps/api/`, `packages/types/` | `backend-dev` |
| `packages/config/`, root configs | `devops` |
| `docs/` | `doc-writer` |

**Always include:** `tester` (for any code change)

**Add if applicable:**
- `architect` — new modules, cross-domain types, or structural changes
- `security-auditor` — auth, input validation, or data access
- `doc-writer` — new architecture or public APIs

**Tier S:** skip agent recommendation (single session).

**Intra-domain parallelization:** When a single domain has 4+ tasks touching independent file groups (no shared files), recommend spawning multiple agents of the same type. Each agent receives a distinct subset of tasks.

Example: A large frontend feature might spawn:
- `frontend-dev` (pages) — routing, page components
- `frontend-dev` (components) — shared UI components, hooks

Only recommend this for Tier F-full with clearly separable file groups. Default to 1 agent per domain otherwise.

> **Shared barrel files:** If parallel agents would both need to update a shared barrel/index export file, merge those tasks into a single agent.

> **Note:** Review (Phase 2) uses an 8+ changed-files threshold and fixer (Phase 4) uses a 6+ findings threshold — units differ per context.

#### 2d. Break into Tasks

For each task:
- **Description:** What to implement and why
- **Files:** Specific file paths to create or modify
- **Agent:** Which agent owns this task
- **Dependencies:** Which tasks must complete first
- **Parallel-safe:** Yes/No — can this task run concurrently with other tasks in the same domain? (Yes if no shared files with sibling tasks)

Order: types first → backend → frontend → tests → docs → config.

#### 2e. Select Slices (multi-slice specs only)

If the spec contains **2+ slices**, present them for selection via `AskUserQuestion`:

```
Spec has {N} slices. Select which to implement in this run:

  V1: {description} ({N} files, {agents})
  V2: {description} ({N} files, {agents})
  V3: {description} ({N} files, {agents})
  ...
```

Options (multiSelect: true):
- One option per slice (label: `V1: {short description}`)

**Rules:**
- Default recommendation: **one slice** (the next unimplemented slice in order)
- Respect slice dependencies — if V2 depends on V1, V1 must be selected too (or already implemented)
- After this run completes (commit + PR), re-run `/scaffold --spec N` to pick the next slice(s)
- Each scaffold run is self-contained: plan → setup → implement → PR

**Single-slice specs:** Skip this step.

**Resuming:** When re-running scaffold on a spec with prior slices already implemented, detect which slices are done (check existing code/tests) and only offer remaining slices.

#### 2f. Present Plan for Approval

Present via `AskUserQuestion` (scoped to selected slices only):

```
Implementation Plan: {Spec Title}
Spec: specs/{N}-{slug}.mdx
Tier: {S|F-lite|F-full}
Slices: {selected slices} (of {total} in spec)
Files: {N} files to create/modify
Agents: {agent list}

Tasks:
  1. {description} → {agent} ({files}) [parallel-safe: {Yes/No}]
  2. {description} → {agent} ({files}) [parallel-safe: {Yes/No}]
  ...
```

Options:
- **Approve** — proceed to setup
- **Modify** — adjust the plan
- **Cancel** — abort

### Step 3 — Setup

#### 3a. Create GitHub Issue (if none exists)

```bash
gh issue view <number> --json number,title,state 2>/dev/null
```

**If no issue exists:**

1. Draft: title (conventional format), body (spec summary + acceptance criteria checklist)
2. Present via `AskUserQuestion`: Create / Edit / Skip
3. Create: `gh issue create --title "<title>" --body "<body>"`

#### 3b. Update Issue Status

```bash
bun .claude/skills/issue-triage/triage.ts set <ISSUE_NUMBER> --status "In Progress"
```

#### 3c. Pre-flight Checks

```bash
# Check for existing branch or worktree
git branch --list "feat/<issue_number>-*"
ls -d ../roxabi-<issue_number> 2>/dev/null

# Ensure staging is up to date
git fetch origin staging
```

**If branch exists:** ask via `AskUserQuestion`: Reuse / Delete and recreate / Abort

#### 3d. Create Worktree

```bash
git worktree add ../roxabi-<issue_number> -b feat/<issue_number>-<slug> staging
cd ../roxabi-<issue_number> && cp .env.example .env && bun install
cd apps/api && bun run db:branch:create --force <issue_number>
```

The `.env.example` copy ensures the worktree has all required environment variables for local dev (e.g., `VITE_GITHUB_REPO_URL`, `API_URL`).

The `--force` flag ensures non-interactive behavior (no prompts) when called from `/scaffold`. The `db:branch:create` script handles database creation, migration, seed, and `.env` update in a single step.

All subsequent operations run in the worktree directory.

**XS exception only:** For Size XS changes (single file, <1h, zero risk), use `AskUserQuestion` to confirm with the lead. If approved, a direct branch is acceptable:

```bash
git checkout -b feat/<issue_number>-<slug> staging
```

### Step 4 — Scaffold Stubs

#### 4a. Find Reference Features

Search for the most similar existing feature to use as a pattern. Read 1-2 reference files to understand conventions for file naming, exports, test placement, and type definitions.

#### 4b. Create File Stubs

Create files in this order (types first, tests last):

| Order | Category | Typical paths | Content |
|-------|----------|---------------|---------|
| 1 | **Types** | `packages/types/src/<feature>.ts` | Interfaces, enums, type exports |
| 2 | **API routes/services** | `apps/api/src/<feature>/` | Controller, service, module stubs with TODOs |
| 3 | **UI components** | `apps/web/src/<feature>/` | Component stubs with TODOs |
| 4 | **Test files** | Adjacent to source | Test shells from spec acceptance criteria |

Each stub:
- Follows reference feature patterns exactly
- Includes `// TODO: implement` comments at key points
- Exports correct types/interfaces
- Is syntactically valid TypeScript

#### 4c. Generate Spec-Aware Test Stubs

Map each success criterion from the spec to `it()` blocks with descriptive names:

```typescript
describe('UserProfile', () => {
  it('should display user avatar', () => {
    // TODO: implement — Success Criterion: "User avatar is visible on profile page"
  });
});
```

#### 4d. Present and Confirm

Present the full file list via `AskUserQuestion`: Create all / Edit list / Cancel

#### 4e. Verify and Commit Scaffold

```bash
bun lint && bun typecheck
```

Stage and commit the scaffold:

```bash
git add <files>
git commit -m "$(cat <<'EOF'
feat(<scope>): scaffold <feature> boilerplate

Create file stubs for <feature>: types, API routes, UI components, tests.
Stubs follow existing codebase patterns with TODO placeholders.

Refs #<issue_number>

Co-Authored-By: Claude <model> <noreply@anthropic.com>
EOF
)"
```

### Step 4f — Generate Micro-Tasks (Tier F only)

**Tier S:** Skip this step entirely. Proceed directly to Step 5.

**Tier F-lite / F-full:** Generate fine-grained micro-tasks from the spec for agent consumption. **Only generate tasks for the slices selected in Step 2e.**

#### 4f.1. Detect Spec Format

Read the spec and determine the generation mode:

1. **Primary mode** — Spec contains `## Breadboard` and `## Slices` sections (post-#281 specs). Parse Breadboard affordances (U*, N*, S*) and Slices (V1, V2, ...).
2. **Fallback mode** — Spec contains `## Success Criteria` but no Breadboard/Slices. Parse criteria as SC-1, SC-2, etc.
3. **Skip** — Spec has neither Breadboard/Slices nor Success Criteria. Warn the user that micro-task generation requires structured spec content. Proceed to Step 5 using the text-based task list from Step 2d.

> **Format detection v1:** Look for `## Breadboard` (heading level 2) with sub-tables containing ID columns (U*, N*, S*), and `## Slices` with a table containing Slice/Description/Affordances columns. If both are present → primary mode. If only `## Success Criteria` with checkbox items → fallback mode.

> **Partial spec:** If only one of `## Breadboard` or `## Slices` is present (but not both), treat as fallback mode if `## Success Criteria` exists, or skip mode otherwise.

#### 4f.2. Generate Micro-Tasks

**Primary mode (Breadboard + Slices):**

For each slice (V1, V2, ...):
1. Identify the affordances referenced by the slice (e.g., N1, N2, U1, S1)
2. Expand each affordance into 1-3 micro-tasks based on its complexity
3. Order within slice: data stores (S*) first → code handlers (N*) → CLI/UI (U*) → tests
4. Assign agents per Step 2c file-path rules
5. Generate a verification command for each task

**Fallback mode (Success Criteria):**

For each criterion (SC-1, SC-2, ...):
1. Analyze the criterion to identify affected files and logic
2. Expand into 1-5 micro-tasks based on complexity
3. Each micro-task gets a verification command (or explicit `[manual]` marker if no automated check is possible)
4. Assign agents per Step 2c file-path rules

**Verification command heuristics for fallback mode:**

| Change type | Verification approach | Example |
|------------|----------------------|---------|
| Application code (`.ts/.tsx`) | Unit/integration test (if adjacent test exists) or typecheck | `bun run test apps/api/src/auth/auth.service.test.ts` |
| Type definitions | Typecheck (scoped) | `bun run typecheck --filter=@repo/types` |
| Config files (`.json/.yaml`) | Lint + content check | `bun run lint && grep -q 'key' path/to/config.json` |
| Skill/agent files (`.md`) | Grep for expected content | `grep -q 'Step 4f' .claude/skills/scaffold/SKILL.md` |
| Documentation (`.mdx`) | File exists + content check | `test -f docs/path.mdx && grep -q '## Section' docs/path.mdx` |
| Migration files | Migrate + check schema | `bun run db:migrate && bun run db:generate --check` |
| Other | Manual checklist | `[manual]` marker with description |

**RED-phase verification:** RED tasks use structural verification (grep for expected test structure) rather than running tests, since tests are expected to fail before implementation. Verification confirms the test file exists with the expected describe/it blocks.

**Verification command safety:** Always single-quote literal strings in grep arguments to prevent shell expansion (use `grep -q 'expected' file` not `grep -q "expected" file`). Verification commands must be non-destructive and read-only. Permitted prefixes: `bun run test`, `bun run typecheck`, `bun run lint`, `grep -q`, `test -f`, `bun run db:generate --check`. Commands that write files, delete data, or modify state are forbidden.

**Per-slice floor:** Each slice must produce at least 2 micro-tasks (one implementation + one test). If a slice generates fewer than 2, merge it with an adjacent slice.

**Each micro-task includes:**

| Field | Description |
|-------|-------------|
| Description | What to implement (imperative, specific) |
| File path | Target file to create or modify |
| Code snippet | Lightweight skeleton showing the expected shape |
| Verification command | Bash command to confirm completion |
| Expected output | What success looks like |
| Time estimate | 2-5 minutes target (may reach 8-10 for atomic operations) |
| `[P]` marker | Present if parallel-safe (no file-path overlap or import dependency with sibling tasks in same slice) |
| Agent | Which agent owns this task |
| Spec trace | Source criterion (SC-N) or affordance wiring (U1→N1→S1) |
| Slice | Which vertical slice (V1, V2, ...) |
| Phase | RED, GREEN, REFACTOR, or RED-GATE |
| Difficulty | 1-5 per-task scale (1=trivial, 2=single-file, 3=multi-concern one file, 4=cross-file, 5=complex multi-concern) |

#### 4f.3. Detect Parallelization

**`[P]` definition:** `[P]` means this task has no file-path or import conflict with ANY other `[P]`-marked task in the same slice and phase. All `[P]`-marked tasks within a slice+phase form a maximal independent set that can safely execute in parallel.

For each pair of micro-tasks within the same slice:

1. **File-path check:** Do they touch the same file? → not parallel-safe
2. **Import inference:** For existing files, read current imports. For new files, infer from Breadboard wiring (e.g., N1→S1 implies handler imports store). If unknown → default to non-parallel-safe (conservative)
3. Mark parallel-safe tasks with `[P]`

#### 4f.4. Scale Task Count

Calculate the feature-level complexity score (from #280 rubric) and derive the target task count:

| Tier | Target range | Minimum floor |
|------|-------------|---------------|
| F-lite | 5-15 tasks | 2 (one implementation, one test) |
| F-full | 15-30 tasks | 2 (one implementation, one test) |

**If task count exceeds 30:** Warn the user via `AskUserQuestion` and suggest splitting via `/bootstrap` Gate 2.5 or manual decomposition. Show the full task list — no truncation. User can proceed or return to spec.

**If task count is below the minimum floor (2):** Warn the user that the feature may not have enough granularity for micro-task benefits. Suggest falling back to the text-based task list from Step 2d.

#### 4f.5. Run Consistency Check

Bidirectional spec-to-task validation:

1. **Coverage check (spec → tasks):** Every spec criterion or Breadboard affordance must have ≥1 matching task (via `specTrace`). Report uncovered criteria.
2. **Gold plating check (tasks → spec):** Every task must trace to a spec criterion. Tasks without spec backing require justification — except for exempt categories:

| Exempt category | Examples |
|-----------------|---------|
| Infrastructure | DB migrations, schema changes, config file updates |
| Quality | Linting fixes, formatting, barrel/index export updates |
| Build | Package.json changes, build configuration, environment setup |
| Documentation | Inline code comments, JSDoc, README updates |

**Scoping rule:** Exempt categories apply only to tasks whose *sole purpose* is the listed activity. If a task also implements spec-traced logic (e.g., a Drizzle schema that is part of a feature's data model), it must have a spec trace regardless of incidental infrastructure work.

3. **Generate consistency report:**
   - Criteria covered: N/total
   - Uncovered criteria: list or "none"
   - Tasks without spec backing: list or "none"
   - Gold plating exemptions applied: count

**If 0 coverage (no tasks match any criterion):** Block agent spawning. Return to spec or regenerate.

#### 4f.6. Write Plan Artifact

Generate the plan artifact at `plans/{issue}-{slug}.mdx`:

```markdown
---
title: "Plan: {Feature Title}"
issue: {issue_number}
spec: specs/{issue}-{slug}.mdx
complexity: {score}/10
tier: {S|F-lite|F-full}
generated: {ISO timestamp}
---

## Summary

{1-2 sentence overview of the feature and implementation approach}

## Bootstrap Context

{Conclusions and selected shape from analyses/{issue}-*.mdx, if exists}

## Agents

| Agent | Task count | Files |
|-------|-----------|-------|
| {agent} | {N} | {comma-separated file list} |

## Consistency Report

- Criteria covered: {N}/{total}
- Uncovered criteria: {list or "none"}
- Tasks without spec backing: {list or "none"}
- Gold plating exemptions applied: {count}

## Micro-Tasks

### Slice V1: {Description}

#### Task 1: {Description} [P] → {agent}
- **File:** {path}
- **Snippet:** {code skeleton}
- **Verify:** `{command}` ({ready|deferred|manual})
- **Expected:** {output}
- **Time:** {N} min
- **Difficulty:** {1-5}
- **Traces:** {SC-N, U1→N1→S1}
- **Phase:** {RED|GREEN|REFACTOR}

#### Task 2: {Description} → {agent}
...

#### RED-GATE: RED complete V1 → tester
- **Verify:** All test tasks for V1 marked complete
- **Phase:** RED-GATE

> The orchestrator manages RED-GATE ordering by spawning GREEN `Task` agents only after the tester completes RED tasks for each slice.
```

**Bootstrap context:** If an analysis exists at `analyses/{issue}-*.mdx`, include its Conclusions and selected Shape sections under `## Bootstrap Context`. This gives domain agents architectural rationale without re-reading the analysis.

Create `plans/` directory if it doesn't exist. The directory is tracked in git (not gitignored), lives at project root alongside `analyses/` and `specs/`.

#### 4f.7. Present for Approval

Present the micro-task queue and consistency report to the user via `AskUserQuestion`:

```
Micro-Task Plan: {Feature Title}
Spec: specs/{N}-{slug}.mdx
Complexity: {score}/10 → {tier}
Tasks: {N} micro-tasks across {M} slices
Agents: {agent list with task counts}

Consistency:
  Criteria covered: {N}/{total}
  Gold plating flags: {N} ({M} exempted)

Slices:
  V1: {description} ({N} tasks, {M} parallel-safe)
  V2: {description} ({N} tasks, {M} parallel-safe)
  ...
```

Options:
- **Approve** — commit the plan artifact, create TaskCreate entries, and proceed to Step 5
- **Modify** — regenerate with adjusted parameters or manual task edits (new plan commit, never amend)
- **Return to spec** — go back to refine the spec

#### 4f.8. Commit Plan Artifact

On approval, commit the plan as a **standalone commit** (separate from the Step 4e stub commit, never amending):

```bash
mkdir -p plans
git add plans/{issue}-{slug}.mdx
git commit -m "$(cat <<'EOF'
docs(<scope>): add scaffold plan for <feature>

Micro-task plan with consistency report. Generated from spec.

Refs #<issue_number>

Co-Authored-By: Claude <model> <noreply@anthropic.com>
EOF
)"
```

#### 4f.9. Dispatch TaskCreate Entries

On approval, create `TaskCreate` entries for each micro-task with metadata:

```json
{
  "taskDifficulty": 3,
  "verificationCommand": "bun run test apps/api/test/auth.test.ts",
  "verificationStatus": "deferred",
  "expectedOutput": "1 passing test: validate email format",
  "estimatedMinutes": 3,
  "parallel": true,
  "specTrace": "SC-3, N1→S1",
  "slice": "V1",
  "phase": "GREEN"
}
```

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `taskDifficulty` | number | 1-5 | Per-task difficulty (not feature complexity) |
| `verificationCommand` | string | bash command | Executable check that confirms completion |
| `verificationStatus` | string | `"ready"`, `"deferred"`, or `"manual"` | `"ready"` = run immediately. `"deferred"` = wait for RED-GATE sentinel. `"manual"` = no automated check available, agent marks complete after code/file inspection. |
| `expectedOutput` | string | text | What success looks like |
| `estimatedMinutes` | number | 2-10 | Target: 2-5 min |
| `parallel` | boolean | true/false | `true` if `[P]` marked |
| `specTrace` | string | IDs | Spec criterion or affordance wiring |
| `slice` | string | V1, V2, ... | Vertical slice |
| `phase` | string | RED, GREEN, REFACTOR, RED-GATE | Implementation phase |

**RED-GATE sentinels:** Auto-generate one sentinel task per slice, assigned to tester, with `phase: "RED-GATE"`. This task is marked complete when all RED tasks for that slice are done.

### Step 5 — Implement

#### Tier S — Single Session

Implement directly (no agents):

1. Read stubs and spec acceptance criteria
2. Implement business logic
3. Write/update tests
4. Run: `bun lint && bun typecheck && bun run test`
5. Loop until green

#### Tier F — Agent-Driven (test-first)

Spawn agents using the `Task` tool based on the plan from Step 2. Each `Task` call creates a stateless subagent that does its job and exits — no persistent teams, no coordination overhead, no zombie risk.

**All domains:** use `Task` tool with the appropriate `subagent_type` (backend-dev, frontend-dev, tester, etc.). Spawn sequentially or in small parallel batches (2-3 max). Each agent gets a focused, self-contained task with all necessary context in the prompt.

**Intra-domain parallelization:** When the plan from Step 2 recommends multiple agents in the same domain, spawn them as separate parallel `Task` calls. Each agent receives only its assigned task subset. Agents in the same domain must NOT share files — if file conflicts are detected during planning, merge those tasks into a single agent.

**Implementation order (RED → GREEN → REFACTOR):**

**If Step 4f generated micro-tasks:** agents receive their assigned micro-tasks from `TaskCreate` entries instead of text-based plans. Each micro-task includes file paths, code snippets, verification commands, and spec traces.

**If Step 4f was skipped:** agents receive the text-based task list from Step 2d (existing behavior).

1. **RED** — Spawn `tester`: write failing tests from spec acceptance criteria (or from RED-phase micro-tasks). After completing all test tasks for a slice, tester marks the `"RED complete: V{N}"` sentinel task as completed.
2. **GREEN** — Spawn domain agents in parallel: implement to pass the tests. Before running a verification command, check the `verificationStatus`:
   - `"ready"` → run the verification command immediately after completing the task
   - `"deferred"` → check if the RED-GATE sentinel for this task's slice is completed. If yes → run verification. If no → skip verification, continue to next task. If no other tasks are available and the RED-GATE sentinel for the current slice is incomplete, message the lead and wait for the RED phase to complete before running deferred verification.
3. **REFACTOR** — Domain agents refactor while keeping tests green
4. **Verify** — Spawn `tester`: verify coverage and add edge cases

**Per-task verification loop (when micro-tasks are active):**

After each task where verification runs:
1. Run the verification command
2. **Pass** → mark task complete, proceed to next
3. **Fail** → fix and re-verify (max 3 retries)
4. **3 failures** → escalate to lead with: task ID, error output, attempted fixes, affected files

**Tracking first-try pass rate:** The orchestrator tracks the count of tasks that pass verification on first attempt vs. those requiring retries. This feeds the Step 7 summary line (`Verification: {N}/{total} passed first try`).

**Quality gate:**

```bash
bun lint && bun typecheck && bun run test
```

- **Pass** — proceed to PR
- **Fail** — agents fix, re-test, loop until green

### Step 6 — PR

1. Stage all implementation files (never `git add -A`)
2. Commit using `/commit` conventions
3. Push the branch, then create PR using `/pr`

### Step 7 — Summary

Display completion summary:

```
Scaffold Complete
=================
  Issue:    #<number> — <title>
  Branch:   feat/<number>-<slug>
  Worktree: ../roxabi-<number>
  Tier:     <S|F-lite|F-full>
  Agents:   <list>

  Files created/modified:
    - packages/types/src/<feature>.ts
    - apps/api/src/<feature>/controller.ts
    - ...

  Verification: {N}/{total} passed first try ({percentage}%)

  PR: #<pr_number>

  Next steps:
    1. Run /review for code review
    2. Walk through findings via /1b1
    3. Fixer applies accepted comments
    4. Merge when CI is green
```

## Rollback

If the scaffold needs to be undone:

```bash
# Close the PR (if created)
gh pr close <pr-number>

# Remove worktree
cd ../roxabi_boilerplate
git worktree remove ../roxabi-<number>

# Delete the branch
git branch -D feat/<number>-<slug>
```

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| **No spec found** | Inform user, suggest `/bootstrap` or `/interview`. Stop. |
| **Size XS confirmed by lead** | Skip worktree, use direct branch |
| **Typecheck fails after scaffolding** | Report errors, let user decide (fix/proceed/abort) |
| **Issue already exists** | Use existing issue, inform user |
| **Branch already exists** | Warn user, ask to reuse or recreate |
| **Worktree directory already exists** | Warn user, ask to reuse or clean up first |
| **Spec has no file list** | Analyze spec to infer file structure from feature description |
| **Tests fail during implementation** | Agents fix and re-test, loop until green |
| **Pre-commit hook failure** | Fix, re-stage, create NEW commit (never amend) |
| **Agent blocked** | Report blocker, ask user for guidance |
| **Spec has unresolved `[NEEDS CLARIFICATION]` markers** | Pre-flight warns, user chooses: resolve inline, return to bootstrap, or proceed with risk |
| **Spec has no Breadboard AND no Success Criteria** | Skip Step 4f, warn user, use text-based task list from Step 2d |
| **Task count exceeds 30** | Warn user, show full task list, suggest splitting. Do not truncate. |
| **Multi-slice spec** | Step 2e presents slices for selection. Default: one slice per run. Re-run scaffold for remaining slices. |
| **All slices already implemented** | Detect via existing code/tests. Inform user, suggest `/review` instead. |
| **Consistency check finds 0 coverage** | Block agent spawning. Return to spec or regenerate. |
| **Verification command references missing file** | Mark `[deferred]`. If fails after RED phase, escalate to lead. |
| **Single affordance expands beyond 5 min** | Split into 2-3 sub-tasks. 2-5 min is a guide; some tasks may reach 8-10 min. |
| **Session interrupted after plan commit** | On resume: re-read plan artifact, reconstruct TaskCreate entries, skip consistency check. |
| **User wants to regenerate micro-tasks** | New commit with regenerated plan (never amend). Latest plan artifact is authoritative. |
| **`plans/` directory doesn't exist** | Scaffold creates it on first use (Step 4f.8). |

## Safety Rules

1. **NEVER run `git add -A` or `git add .`** — always add specific files
2. **NEVER push without creating a PR first** via `/pr`
3. **NEVER create the issue without user approval** of content
4. **ALWAYS present the plan** before executing (Step 2e)
5. **ALWAYS present scaffolded file list** before writing files (Step 4d)
6. **ALWAYS use worktree** (XS exception with explicit lead approval only)
7. **ALWAYS use HEREDOC** for commit messages

$ARGUMENTS
