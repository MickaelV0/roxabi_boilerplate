---
argument-hint: [--spec <number> | --plan]
description: Scaffold a feature from an approved spec — creates issue, worktree, boilerplate, and commit.
allowed-tools: Bash, AskUserQuestion, Read, Write, Glob, Grep, Edit, Task
---

# Scaffold

Execution skill that takes an approved spec or plan and does the mechanical work: creates the GitHub issue, sets up the worktree, scaffolds boilerplate files, commits, and opens a draft PR.

## Usage

```
/scaffold --spec 42                → Scaffold from existing spec (docs/specs/42-*.mdx)
/scaffold --plan                   → Resume from in-progress plan (e.g., after /bootstrap)
```

## Instructions

### 1. Locate the Spec

**If `--spec <number>` was passed:**

```bash
# Find the spec file
ls docs/specs/<number>-*.mdx
```

- Read the spec file in full
- Extract: title, summary, acceptance criteria, tier suggestion (if present), and file list

**If `--plan` was passed:**

- Look for an in-progress plan in the current conversation context (e.g., output from `/bootstrap` or `/plan`)
- The plan should contain: spec reference, tier, ordered task list with files

**If no spec or plan is found:** inform the user and suggest:

> "No spec found. Run `/bootstrap` to create one from scratch, or `/interview` to generate a spec."

Stop here.

### 2. Determine Tier

Read `docs/processes/dev-process.mdx` and apply the tier criteria:

```
>10 files or system architecture   → Tier L
3-10 files                         → Tier M
≤3 files, no risk                  → Tier S
```

Count the files from the spec/plan and auto-suggest a tier. Present the suggestion via `AskUserQuestion`:

- **Tier S** — {N} files, direct branch (no worktree)
- **Tier M** — {N} files, worktree required
- **Tier L** — {N} files, worktree required (full spec process)

Let the user confirm or override.

### 3. Create GitHub Issue (if none exists)

Check if a GitHub issue already exists for this spec:

```bash
# Check by spec number — the spec number often IS the issue number
gh issue view <number> --json number,title,state 2>/dev/null
```

**If no issue exists:**

1. Draft the issue content:
   - **Title:** from spec title (conventional format: `feat(<scope>): <description>`)
   - **Body:** spec summary + acceptance criteria as a checklist
2. Present the draft to the user via `AskUserQuestion` with options:
   - **Create issue** — proceed
   - **Edit** — let user modify
   - **Skip** — continue without issue
3. Create the issue:
   ```bash
   gh issue create --title "<title>" --body "<body>"
   ```
4. Capture the issue number from the output

**If issue already exists:** use the existing issue number. Inform the user.

### 4. Update Issue Status to "In Progress"

If a GitHub issue is associated, move it to **In Progress** on the project board:

```bash
.claude/skills/issue-triage/triage.sh set <ISSUE_NUMBER> --status "In Progress"
```

Skip this step if no issue is associated with the scaffold.

### 5. Create Branch + Worktree

Extract a slug from the spec title (kebab-case, 3-4 words max).

#### 5.0 Pre-flight: Check for Conflicts

Before creating anything, check for existing branches and worktrees:

```bash
# Check if branch already exists
git branch --list "feat/<issue_number>-*"

# Check if worktree directory already exists (Tier M/L)
ls -d ../roxabi-<issue_number> 2>/dev/null

# Ensure staging is up to date
git fetch origin staging
```

**If branch exists:** ask via `AskUserQuestion`:
- **Reuse existing branch** — switch to it (and its worktree if present)
- **Delete and recreate** — remove old branch/worktree and start fresh
- **Abort** — stop scaffolding

**If worktree directory exists but branch doesn't:** clean up with `git worktree remove` first, then proceed.

#### 5.1 Create Branch

**Tier M or L — Worktree:**

```bash
git worktree add ../roxabi-<issue_number> -b feat/<issue_number>-<slug> staging
```

All subsequent operations run in the worktree directory: `../roxabi-<issue_number>`

Install dependencies in the worktree:

```bash
cd ../roxabi-<issue_number> && bun install
```

**Tier S — Direct branch:**

```bash
git checkout -b feat/<issue_number>-<slug> staging
```

Stay in the current directory.

### 6. Scaffold Boilerplate

#### 5.1 Find a Reference Feature

Search for the most similar existing feature to use as a pattern:

```bash
# Look for similar patterns in the codebase
# Example: if scaffolding auth, look for existing feature modules
```

Use `Glob` and `Grep` to find:
- Existing feature modules in `apps/web/src/` and `apps/api/src/`
- Similar file structures (routes, components, services, tests)

Read 1-2 reference files to understand the project's conventions for:
- File naming
- Export patterns
- Test file placement
- Type definitions

#### 5.2 Create File Stubs

Create files in this order (types first, tests last):

| Order | Category | Typical paths | Content |
|-------|----------|---------------|---------|
| 1 | **Types** | `packages/types/src/<feature>.ts` | Interfaces, enums, type exports |
| 2 | **API routes/services** | `apps/api/src/<feature>/` | Controller, service, module stubs with TODOs |
| 3 | **UI components** | `apps/web/src/<feature>/` | Component stubs with TODOs |
| 4 | **Test files** | Adjacent to source | Empty test shells with describe blocks |

Each stub should:
- Follow the reference feature's patterns exactly
- Include `// TODO: implement` comments at key points
- Export the correct types/interfaces
- Import from the correct paths
- Be syntactically valid TypeScript

**Do NOT generate implementation logic.** Stubs contain only the skeleton: imports, exports, type signatures, and TODO comments.

#### 5.2b Generate Spec-Aware Test Stubs

If a spec exists (found in Step 1 or from the `--spec` argument), read its **Success Criteria** and **Expected Behavior** sections to generate meaningful test stubs instead of empty `describe` blocks.

For each success criterion or expected behavior, create an `it()` block with a descriptive name and a `// TODO: implement` body:

```typescript
describe('UserProfile', () => {
  it('should display user avatar', () => {
    // TODO: implement — Success Criterion: "User avatar is visible on profile page"
  });

  it('should show edit button for own profile', () => {
    // TODO: implement — Expected: "Owner sees edit controls"
  });

  it('should return 404 for non-existent user', () => {
    // TODO: implement — Edge case: "Non-existent user ID returns 404"
  });
});
```

**Rules:**
- Map each success criterion to one or more `it()` blocks
- Map edge cases from the spec to error-path `it()` blocks
- Keep the `// TODO` comment referencing the spec criterion for traceability
- If no spec exists, fall back to empty `describe` blocks as before

#### 5.3 Present Scaffold Summary

Before writing files, present the full list to the user via `AskUserQuestion`:

```
Files to create:
  1. packages/types/src/<feature>.ts        (types)
  2. apps/api/src/<feature>/controller.ts   (API)
  3. apps/api/src/<feature>/service.ts       (API)
  4. apps/api/src/<feature>/module.ts        (API)
  5. apps/web/src/<feature>/page.tsx          (UI)
  6. apps/api/src/<feature>/service.test.ts  (test)
```

Options:
- **Create all** — proceed with all files
- **Edit list** — add/remove files
- **Cancel** — abort scaffold

### 7. Verify

Run quality checks on the scaffolded files:

```bash
bun lint && bun typecheck
```

> **Note:** `bun test` is intentionally skipped — stubs contain only TODO placeholders and would not pass tests.

**If all passes:** continue to commit.

**If typecheck fails:**

1. Report the errors clearly
2. Ask the user via `AskUserQuestion`:
   - **Fix and retry** — attempt to fix type errors in stubs
   - **Proceed anyway** — commit with known type errors
   - **Abort** — stop scaffolding

**If lint fails:** auto-fix with `bunx biome check --write` and re-run.

### 8. Commit

Follow `/commit` skill conventions. **Do NOT ask the user to approve the commit message.** Proceed directly to committing.

1. Stage only the scaffolded files (never `git add -A`):
   ```bash
   git add <file1> <file2> ...
   ```

2. Generate a commit message:
   ```
   feat(<scope>): scaffold <feature> boilerplate

   Create file stubs for <feature>: types, API routes, UI components, tests.
   Stubs follow existing codebase patterns with TODO placeholders.

   Refs #<issue_number>

   Co-Authored-By: Claude <model> <noreply@anthropic.com>
   ```

Replace `<model>` with the actual model name (e.g., `Claude Opus 4.6`).

3. Execute the commit using HEREDOC format:
   ```bash
   git commit -m "$(cat <<'EOF'
   <message>
   EOF
   )"
   ```

4. After commit: run `git log --oneline -1` to confirm and show the result to the user.

5. If pre-commit hook fails: fix, re-stage, create a **NEW** commit (never amend).

### 9. Final Summary

**Do NOT create a draft PR.** The scaffold only sets up stubs — the PR should be created later via `/pr` once implementation is complete.

Display a summary of everything created:

```
Scaffold Complete
=================
  Issue:    #<number> — <title>
  Branch:   feat/<number>-<slug>
  Worktree: ../roxabi-<number>       (or "N/A — Tier S")

  Files created:
    - packages/types/src/<feature>.ts
    - apps/api/src/<feature>/controller.ts
    - ...

  Next steps:
    1. cd ../roxabi-<number>          (if worktree)
    2. Implement the TODOs
    3. Run /commit when ready
    4. Run /pr when implementation is complete
    5. Run /review before merging
```

## Rollback

If the scaffold is wrong, cleanup is two commands:

```bash
# Remove worktree (Tier M/L only)
git worktree remove ../roxabi-<number>

# Delete the branch
git branch -D feat/<number>-<slug>
```

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| **Tier S detected** | Skip worktree creation, use direct branch |
| **Typecheck fails after scaffolding** | Report errors, let user decide (fix/proceed/abort) |
| **No spec found** | Inform user, suggest `/bootstrap` or `/interview` |
| **Issue already exists** | Use existing issue, inform user |
| **Branch already exists** | Warn user, ask to reuse or create a new name |
| **Worktree directory already exists** | Warn user, ask to reuse or clean up first |
| **Spec has no file list** | Analyze spec to infer file structure from feature description |
| **Pre-commit hook failure** | Fix, re-stage, create NEW commit (never amend) |

## Safety Rules

1. **NEVER run `git add -A` or `git add .`** — always add specific files
2. **NEVER push** — scaffold only commits locally; pushing and PR creation happen later via `/pr`
3. **NEVER create the issue without user approval** of content
4. **ALWAYS present scaffolded file list** before writing any files
5. **ALWAYS use HEREDOC** for commit messages to preserve formatting
6. **ALWAYS commit directly** without asking for approval (follow `/commit` conventions)

$ARGUMENTS
