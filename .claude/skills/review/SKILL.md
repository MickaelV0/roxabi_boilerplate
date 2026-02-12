---
argument-hint: [#PR]
description: Multi-domain code review with fresh agents and Conventional Comments. Review findings are walked through with the human via /1b1.
allowed-tools: Bash, AskUserQuestion, Read, Grep, Edit, Task
---

# Code Review

Review current branch changes (or a specific PR) using fresh domain-specific review agents. Each agent reviews from its area of expertise (security, architecture, product, tests, domain code). Findings are presented to the human one-by-one for accept/reject decisions.

## Usage

```
/review                    → Review current branch changes vs staging
/review #42                → Review a specific PR by number
```

## Instructions

### Phase 1 — Gather Changes

1. **Determine the target:**
   - No PR number: use `git diff staging...HEAD` to get all changes on the current branch
   - PR number provided: use `gh pr diff <number>` to get the PR diff

2. **List changed files:**
   ```bash
   # Branch mode
   git diff --name-only staging...HEAD

   # PR mode
   gh pr diff <number> --name-only
   ```

3. **Read all changed files in full** (not just the diff hunks) to understand surrounding context. Skip binary files and note them in the report.

4. **Early exit if no changes:** If the diff is empty, inform the user there is nothing to review and stop.

5. **Large PR warning:** If more than 50 files changed, warn that review quality may degrade and suggest splitting the PR.

### Phase 1.5 — Spec Compliance Check

Check if a spec exists for the linked issue and verify acceptance criteria are met.

1. **Detect the issue number** from the branch name or PR:
   ```bash
   # Extract issue number from branch: feat/42-slug → 42
   git branch --show-current | grep -oP '\d+' | head -1
   ```

2. **Look for a matching spec:**
   ```bash
   ls docs/specs/<issue_number>-*.mdx 2>/dev/null
   ```

3. **If a spec exists:**
   - Read the spec file
   - Extract the **Success Criteria** section (checklist items)
   - For each criterion, check whether the changed files and diff evidence that it has been implemented
   - Flag unmet criteria as `issue(blocking):` findings with the criterion text
   - If all criteria are met, add a `praise:` noting spec compliance

4. **If no spec exists:** skip this phase silently. Not all changes require a spec (Tier S fixes, docs, chores).

### Phase 2 — Multi-Domain Review (Fresh Agents)

Spawn **fresh review agents** via the `Task` tool. Each agent is a new instance with no implementation context (prevents bias). Each agent reviews the diff from its domain of expertise.

1. **Determine which agents to spawn** based on changed files:

   | Agent | When to spawn | Focus area |
   |-------|---------------|------------|
   | **security-auditor** | Always | OWASP vulnerabilities, secrets, injection, auth |
   | **architect** | Always | Design patterns, module structure, circular deps |
   | **product-lead** | Always | Spec compliance, acceptance criteria, product fit |
   | **tester** | Always | Test coverage, AAA structure, edge cases |
   | **frontend-dev** | If `apps/web/` or `packages/ui/` changed | Frontend patterns, component structure, hooks |
   | **backend-dev** | If `apps/api/` or `packages/types/` changed | Backend patterns, API design, error handling |
   | **infra-ops** | If config files or CI changed | Configuration, deployment, infrastructure |

2. **Spawn each agent** with a Task that includes:
   - The full diff (`git diff staging...HEAD` or `gh pr diff`)
   - The list of changed files
   - The spec (if one exists) for compliance checking
   - Instructions to produce findings in Conventional Comments format

3. **Each agent reviews** using the checklist from `docs/standards/code-review.mdx` scoped to its domain:
   - Correctness (edge cases, error handling, types)
   - Security (secrets, injection, XSS, auth guards)
   - Performance (N+1 queries, memory leaks, unnecessary memoization)
   - Architecture (module structure, circular deps, shared types)
   - Tests (coverage, AAA structure, selectors)
   - Readability (naming, complexity, comments)
   - Observability (logging, correlation IDs, timeouts)

4. **Categorize each finding:**

   | Category | Severity | Label | Blocks merge? |
   |----------|----------|-------|---------------|
   | **Bug** | Blocker | `issue:` / `todo:` | Yes |
   | **Security** | Blocker | `issue:` / `todo:` | Yes |
   | **Spec gap** | Blocker | `issue:` / `todo:` | Yes |
   | **Standard violation** | Warning | `suggestion(blocking):` | Yes |
   | **Style** | Suggestion | `suggestion(non-blocking):` / `nitpick:` | No |
   | **Architecture** | Discussion | `thought:` / `question:` | No |
   | **Good work** | Praise | `praise:` | No |

### Phase 3 — Merge and Present Findings

Collect findings from all review agents and merge them into a single report. Deduplicate any overlapping findings (e.g., if both security-auditor and backend-dev flag the same SQL injection). Attribute each finding to the agent that raised it.

Format every finding as a **Conventional Comment** with file path, line number, and reviewer attribution:

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

### Phase 3.5 — Post Findings to PR

After presenting findings locally, **post the full review as a PR comment** so there is a trace on GitHub.

1. **Resolve the PR number:**
   - If a PR number was provided (`/review #42`), use it directly.
   - If reviewing a branch (`/review`), detect the PR for the current branch:
     ```bash
     gh pr list --head "$(git branch --show-current)" --json number --jq '.[0].number'
     ```
   - If no PR exists for the branch, **skip this phase** (no comment to post).

2. **Post the review comment:**

   ```bash
   gh pr comment <number> --body "$(cat <<'EOF'
   ## Code Review

   <full review output from Phase 3: all findings grouped by category + summary + verdict>

   ---
   _Review by Claude Code via `/review`_
   EOF
   )"
   ```

3. **Format rules:**
   - Use the same grouped format as Phase 3 (Blockers → Warnings → Suggestions → Praise)
   - Include the summary line and verdict
   - Wrap finding labels in backticks for readability (e.g., `` `issue(blocking):` ``)
   - Use a `## Code Review` header so comments are easy to find

---

### Phase 4 — 1b1 Walkthrough

After the review report is posted to the PR, Main Claude walks the human through each actionable finding one-by-one using `/1b1`. This is the critical human decision gate.

For each finding:

1. **Show** the comment, severity, file path, line number, and reviewer attribution
2. **Present trade-offs** — explain what the fix would involve and any risks
3. **Recommend** — suggest accept or reject based on severity and impact
4. **Human decides**: accept, reject, or defer

After the walkthrough:

- **Accepted findings** are collected into a fix list
- **Spawn parallel fixer agents by domain** to maximize speed:

  | Fixer | When to spawn | Scope |
  |-------|---------------|-------|
  | **Backend fixer** | If accepted findings touch `apps/api/` or `packages/types/` | Backend test/source fixes only |
  | **Frontend fixer** | If accepted findings touch `apps/web/` or `packages/ui/` | Frontend test/source fixes only |
  | **Infra fixer** | If accepted findings touch `packages/config/`, root configs, or CI | Config/infra fixes only |

  If all accepted findings fall within a **single domain**, spawn one fixer. If findings span **2+ domains**, spawn one fixer per domain in parallel.

  Each fixer receives only the findings relevant to its domain. All fixers use the `fixer` agent definition (`.claude/agents/fixer.md`) with their domain scope specified in the prompt.

- After all fixers complete, **stage, commit, and push** the combined fixes in a single commit
- CI runs; if it fails, spawn the relevant domain fixer to investigate and fix until green
- Human approves the merge

> **Note:** The `/review` skill no longer includes a `--fix` flag. Fixing is handled separately by the fixer agent(s) after the human validates findings via `/1b1`.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No changes on branch | Inform user, nothing to review. Stop. |
| Binary files in diff | Skip, note in report as "binary file, skipped" |
| Large PR (>50 files) | Warn about review quality, suggest splitting |
| No findings | Report clean review, approve. Still post comment (clean verdict). |
| All findings are non-blocking | Human can batch-accept without full 1b1 walkthrough |
| Critical security finding | Escalate immediately to human, do not wait for 1b1 |
| Review agents disagree | Present both perspectives in 1b1, human decides |
| No PR for current branch | Skip PR comment (Phase 3.5), findings stay local only |

## Safety Rules

1. **Fresh agents only** — review agents must be new instances with no implementation context
2. **Never auto-merge** or approve PRs on GitHub
3. **Human decides on every finding** — findings go through 1b1 walkthrough before any fix is applied
4. **Always post review to PR** — if a PR exists, findings must be posted as a comment for traceability
5. **Fixer handles fixes** — the review skill does not fix code; that is the fixer agent's responsibility after 1b1

$ARGUMENTS
