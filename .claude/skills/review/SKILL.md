---
argument-hint: [--fix] [#PR]
description: Code review with Conventional Comments and optional automated fix pipeline.
allowed-tools: Bash, AskUserQuestion, Read, Grep, Edit, Task
---

# Code Review

Review current branch changes (or a specific PR) against the project standards. Default: findings report only. With `--fix`: review + parallel fix agents that apply changes without committing.

## Usage

```
/review                    → Review current branch changes vs main
/review --fix              → Review + apply fixes (no auto-commit)
/review #42                → Review a specific PR by number
/review --fix #42          → Review + fix a specific PR
```

## Instructions

### Phase 1 — Gather Changes

1. **Determine the target:**
   - No PR number: use `git diff main...HEAD` to get all changes on the current branch
   - PR number provided: use `gh pr diff <number>` to get the PR diff

2. **List changed files:**
   ```bash
   # Branch mode
   git diff --name-only main...HEAD

   # PR mode
   gh pr diff <number> --name-only
   ```

3. **Read all changed files in full** (not just the diff hunks) to understand surrounding context. Skip binary files and note them in the report.

4. **Early exit if no changes:** If the diff is empty, inform the user there is nothing to review and stop.

5. **Large PR warning:** If more than 50 files changed, warn that review quality may degrade and suggest splitting the PR.

### Phase 2 — Structured Review

1. **Read the project standards** (all of these, every time):
   - `docs/standards/code-review.mdx` — review checklist and Conventional Comments format
   - `docs/standards/frontend-patterns.mdx` — if any frontend files changed
   - `docs/standards/backend-patterns.mdx` — if any backend files changed
   - `docs/standards/testing.mdx` — if any test files changed

2. **Analyze every changed file** against the checklist from `code-review.mdx`:
   - Correctness (edge cases, error handling, types)
   - Security (secrets, injection, XSS, auth guards)
   - Performance (N+1 queries, memory leaks, unnecessary memoization)
   - Architecture (module structure, circular deps, shared types)
   - Tests (coverage, AAA structure, selectors)
   - Readability (naming, complexity, comments)
   - Observability (logging, correlation IDs, timeouts)

3. **Categorize each finding:**

   | Category | Severity | Label | Blocks merge? |
   |----------|----------|-------|---------------|
   | **Bug** | Blocker | `issue:` / `todo:` | Yes |
   | **Security** | Blocker | `issue:` / `todo:` | Yes |
   | **Standard violation** | Warning | `suggestion(blocking):` | Yes |
   | **Style** | Suggestion | `suggestion(non-blocking):` / `nitpick:` | No |
   | **Architecture** | Discussion | `thought:` / `question:` | No |
   | **Good work** | Praise | `praise:` | No |

### Phase 3 — Present Findings

Format every finding as a **Conventional Comment** with file path and line number:

```
issue(blocking): This `sql.raw()` call with user input is a SQL injection vector.
  apps/api/src/users/users.service.ts:42

suggestion(non-blocking): Consider extracting this into a shared helper.
  apps/web/src/components/auth/login-form.tsx:88

praise: Great use of discriminated unions for the API response type.
  packages/types/src/api.ts:15
```

**Group findings by category**, blockers first:

```
Review: feat/42-user-profile
═══════════════════════════

Blockers (2)
────────────
  issue(blocking): ...
  issue(blocking): ...

Warnings (1)
────────────
  suggestion(blocking): ...

Suggestions (3)
───────────────
  suggestion(non-blocking): ...
  nitpick: ...
  thought: ...

Praise (1)
──────────
  praise: ...

Summary: 2 blockers, 1 warning, 3 suggestions, 1 praise
Verdict: Request changes (blockers must be resolved)
```

**Verdict logic:**

| Condition | Verdict |
|-----------|---------|
| Any blockers | Request changes |
| Warnings only (no blockers) | Approve with comments |
| Suggestions/praise only | Approve |
| No findings | Approve (clean) |

**If not using `--fix`, stop here.** The review is complete.

---

### Phase 4 — Fix Mode (`--fix` only)

Only runs when `--fix` flag is provided. Continues after Phase 3.

#### Step 4a: User Selects Findings

Present all actionable findings (blockers + warnings + suggestions) grouped by file via `AskUserQuestion` with multi-select. Each option shows the finding summary and file path. Praise and question/thought findings are excluded (nothing to fix).

Let the user select which findings to fix. Only selected findings proceed.

#### Step 4b: Spawn Fix Agents

- **Maximum 5 concurrent agents** using the Task tool
- **Parallel across different files**, sequential within the same file
- If multiple findings target the same file, a single agent handles them in order

Each fix agent:

1. **Read the full file content** into memory (this is the revert snapshot)
2. **Apply the fix** using the Edit tool
3. **Run validation:**
   ```bash
   bunx biome check --write <file>
   bun typecheck
   ```
4. **If validation fails:** restore the original file content from the snapshot and report the finding as "could not auto-fix" with the error reason
5. **If validation passes:** keep the fix

#### Step 4c: Present Fix Report

Show a summary of all fix results:

```
Fix Report
══════════

Applied (3):
  [1] apps/api/src/users/users.service.ts:42 — Replaced sql.raw() with parameterized query
  [2] apps/web/src/components/auth/login-form.tsx:88 — Extracted shared helper
  [3] apps/api/src/users/users.controller.ts:15 — Added @UseGuards() decorator

Could not auto-fix (1):
  [4] packages/types/src/api.ts:30 — Type change caused downstream errors
      Error: Type 'UserResponse' is not assignable to type 'ApiResponse<User>'

Changes are staged but NOT committed.
Run /commit to commit the approved changes.
```

- Show the unified diff of all applied fixes
- List any findings that could not be auto-fixed with the failure reason
- **Never auto-commit.** The user reviews the diff and decides what to keep
- Suggest running `/commit` to commit the approved changes

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No changes on branch | Inform user, nothing to review. Stop. |
| Binary files in diff | Skip, note in report as "binary file, skipped" |
| Large PR (>50 files) | Warn about review quality, suggest splitting |
| No findings | Report clean review, approve |
| `--fix` with no actionable findings | Inform user there is nothing to fix |
| Fix agent fails validation | Revert file, mark as "could not auto-fix" |
| Multiple findings in same file | Single agent handles them sequentially |

## Safety Rules

1. **Never auto-commit** — fixes are applied to the working tree only
2. **Never auto-merge** or approve PRs on GitHub
3. **Always revert on failure** — if a fix breaks typecheck or tests, restore the original
4. **Max 5 concurrent fix agents** — prevent resource exhaustion
5. **User selects findings** — never auto-fix without explicit selection

$ARGUMENTS
