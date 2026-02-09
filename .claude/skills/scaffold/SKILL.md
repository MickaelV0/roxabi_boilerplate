---
argument-hint: [--spec <number> | --plan]
description: Scaffold a feature from an approved spec — creates issue, worktree, boilerplate, commit, and draft PR.
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

### 4. Create Branch + Worktree

Extract a slug from the spec title (kebab-case, 3-4 words max).

**Tier M or L — Worktree:**

```bash
git worktree add ../roxabi-<issue_number> -b feat/<issue_number>-<slug>
```

All subsequent operations run in the worktree directory: `../roxabi-<issue_number>`

**Tier S — Direct branch:**

```bash
git checkout -b feat/<issue_number>-<slug>
```

Stay in the current directory.

### 5. Scaffold Boilerplate

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

### 6. Verify

Run quality checks on the scaffolded files:

```bash
bun lint && bun typecheck
```

**If all passes:** continue to commit.

**If typecheck fails:**

1. Report the errors clearly
2. Ask the user via `AskUserQuestion`:
   - **Fix and retry** — attempt to fix type errors in stubs
   - **Proceed anyway** — commit with known type errors
   - **Abort** — stop scaffolding

**If lint fails:** auto-fix with `bunx biome check --write` and re-run.

### 7. Commit

Follow `/commit` skill conventions:

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

3. Present the message to the user via `AskUserQuestion`:
   - **Commit** — use as-is
   - **Edit** — modify the message
   - **Abort** — cancel

4. Execute the commit using HEREDOC format:
   ```bash
   git commit -m "$(cat <<'EOF'
   <message>
   EOF
   )"
   ```

5. If pre-commit hook fails: fix, re-stage, create a **NEW** commit (never amend).

### 8. Create Draft PR

Follow `/pr` skill conventions:

1. Push the branch:
   ```bash
   git push -u origin feat/<issue_number>-<slug>
   ```

2. Generate PR content:
   - **Title:** `feat(<scope>): scaffold <feature> boilerplate`
   - **Body:**
     ```markdown
     ## Summary
     - Scaffold boilerplate for <feature> based on spec #<number>
     - Creates file stubs: types, API routes, UI components, tests
     - All stubs follow existing codebase patterns with TODO placeholders

     ## Test Plan
     - [ ] Verify `bun typecheck` passes
     - [ ] Verify `bun lint` passes
     - [ ] Review stub files match project conventions

     Refs #<issue_number>

     ---
     Generated with [Claude Code](https://claude.ai/code) via `/scaffold`
     ```

3. Present to user via `AskUserQuestion`:
   - **Create draft PR** — proceed
   - **Edit** — modify title/body
   - **Skip PR** — commit only, no PR

4. Create the draft PR:
   ```bash
   gh pr create --title "<title>" --body "<body>" --draft
   ```

5. Display the PR URL.

### 9. Final Summary

Display a summary of everything created:

```
Scaffold Complete
=================
  Issue:    #<number> — <title>
  Branch:   feat/<number>-<slug>
  Worktree: ../roxabi-<number>       (or "N/A — Tier S")
  PR:       <PR_URL> (draft)

  Files created:
    - packages/types/src/<feature>.ts
    - apps/api/src/<feature>/controller.ts
    - ...

  Next steps:
    1. cd ../roxabi-<number>          (if worktree)
    2. Implement the TODOs
    3. Run /commit when ready
    4. Run /review before merging
```

## Rollback

If the scaffold is wrong, cleanup is two commands:

```bash
# Remove worktree (Tier M/L only)
git worktree remove ../roxabi-<number>

# Close the draft PR
gh pr close <PR_NUMBER>

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
2. **NEVER push without creating a branch first**
3. **NEVER auto-commit** — user approves message before every commit
4. **NEVER create the PR without user approval** of title and body
5. **NEVER create the issue without user approval** of content
6. **ALWAYS present scaffolded file list** before writing any files
7. **ALWAYS use HEREDOC** for commit messages to preserve formatting
8. **ALWAYS display the PR URL** after creation

$ARGUMENTS
