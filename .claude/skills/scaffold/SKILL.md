---
argument-hint: [--spec <number> | --issue <number>]
description: Execute a feature from spec to PR — plans, scaffolds, spawns agents, implements, and opens the pull request.
allowed-tools: Bash, AskUserQuestion, Read, Write, Glob, Grep, Edit, Task, Skill
---

# Scaffold

Full execution engine: takes an approved spec (or issue with spec) and drives it to a pull request. Plans internally, creates the worktree, scaffolds boilerplate, spawns agents for test-first implementation, and opens the PR.

## Usage

```
/scaffold --spec 42            Execute from spec (docs/specs/42-*.mdx)
/scaffold --issue 42           Execute from issue (fetches issue, finds linked spec)
```

## Instructions

### Step 1 — Locate the Spec

**If `--spec <number>` was passed:**

```bash
ls docs/specs/<number>-*.mdx
```

- Read the spec file in full
- Extract: title, summary, acceptance criteria, and file list

**If `--issue <number>` was passed:**

```bash
gh issue view <number> --json title,body,labels
```

- Read the issue, then search for a matching spec: `docs/specs/<number>-*.mdx`
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

#### 2b. Determine Tier

| Tier | Criteria | Process |
|------|----------|---------|
| **S** | <=3 files, no arch, no risk | Single session implements |
| **F-lite** | Clear scope, documented requirements, single domain | Agents + /review |
| **F-full** | New arch concepts, unclear requirements, or >2 domain boundaries | Agents + /review |

Tier is judgment-based, not file-count-based. A 50-file mechanical change may be F-lite, while a 3-file rate limiter with design decisions may be F-full.

#### 2c. Determine Agents

Analyze file paths from the spec to recommend agents:

| File path prefix | Agent |
|-----------------|-------|
| `apps/web/`, `packages/ui/` | `frontend-dev` |
| `apps/api/`, `packages/types/` | `backend-dev` |
| `packages/config/`, root configs | `infra-ops` |
| `docs/` | `doc-writer` |

**Always include:** `tester` (for any code change)

**Add if applicable:**
- `architect` — new modules, cross-domain types, or structural changes
- `security-auditor` — auth, input validation, or data access
- `doc-writer` — new architecture or public APIs

**Tier S:** skip agent recommendation (single session).

#### 2d. Break into Tasks

For each task:
- **Description:** What to implement and why
- **Files:** Specific file paths to create or modify
- **Agent:** Which agent owns this task
- **Dependencies:** Which tasks must complete first

Order: types first → backend → frontend → tests → docs → config.

#### 2e. Present Plan for Approval

Present via `AskUserQuestion`:

```
Implementation Plan: {Spec Title}
Spec: docs/specs/{N}-{slug}.mdx
Tier: {S|F-lite|F-full}
Files: {N} files to create/modify
Agents: {agent list}

Tasks:
  1. {description} → {agent} ({files})
  2. {description} → {agent} ({files})
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
.claude/skills/issue-triage/triage.sh set <ISSUE_NUMBER> --status "In Progress"
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
```

The `.env.example` copy ensures the worktree has all required environment variables for local dev (e.g., `VITE_GITHUB_REPO_URL`, `API_URL`).

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

### Step 5 — Implement

#### Tier S — Single Session

Implement directly (no agents):

1. Read stubs and spec acceptance criteria
2. Implement business logic
3. Write/update tests
4. Run: `bun lint && bun typecheck && bun test`
5. Loop until green

#### Tier F — Agent-Driven (test-first)

Spawn agents based on the plan from Step 2.

**Single-domain:** use `Task` tool (subagents within the session).
**Multi-domain:** use `TeamCreate` (independent agent sessions).

**Implementation order (RED → GREEN → REFACTOR):**

1. **RED** — Spawn `tester`: write failing tests from spec acceptance criteria
2. **GREEN** — Spawn domain agents in parallel: implement to pass the tests
3. **REFACTOR** — Domain agents refactor while keeping tests green
4. **Verify** — Spawn `tester`: verify coverage and add edge cases

**Quality gate:**

```bash
bun lint && bun typecheck && bun test
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

## Safety Rules

1. **NEVER run `git add -A` or `git add .`** — always add specific files
2. **NEVER push without creating a PR first** via `/pr`
3. **NEVER create the issue without user approval** of content
4. **ALWAYS present the plan** before executing (Step 2e)
5. **ALWAYS present scaffolded file list** before writing files (Step 4d)
6. **ALWAYS use worktree** (XS exception with explicit lead approval only)
7. **ALWAYS use HEREDOC** for commit messages

$ARGUMENTS
