---
argument-hint: [#PR]
description: Multi-domain code review (agents + Conventional Comments → /1b1). Triggers: "review changes" | "review PR #42" | "code review" | "check my code".
allowed-tools: Bash, AskUserQuestion, Read, Grep, Task
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
   ls specs/<issue_number>-*.mdx 2>/dev/null
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
   | **devops** | If config files or CI changed | Configuration, deployment, infrastructure |

   **Subdomain splitting for large PRs:** When a domain agent's scope covers 8+ changed files spanning distinct modules (e.g., `apps/api/src/auth/` + `apps/api/src/users/` + `apps/api/src/notifications/`), split into multiple reviewers of the same type, each scoped to a module group. This improves review depth by reducing context per agent.

   Example: A PR touching 15 backend files across 3 services → spawn 2 `backend-dev` reviewers:
   - `backend-dev` (auth + users) — files in `apps/api/src/auth/`, `apps/api/src/users/`
   - `backend-dev` (notifications) — files in `apps/api/src/notifications/`

   Default to 1 agent per domain for PRs under 8 files in that domain.

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

4. **Output findings in the enriched format.** Every finding produced by a review agent MUST include the full enriched format — Conventional Comment label, root cause analysis, 2-3 concrete solutions with a recommended marker, and a confidence score:

   ```
   <label>: <description>
     <file_path>:<line_number>
     -- <reviewer_agent>
     Root cause: <why this issue exists -- not just what it is>
     Solutions:
       1. <primary recommendation> (recommended)
       2. <alternative approach>
       3. <alternative approach> [optional]
     Confidence: <0-100>%
   ```

   **Confidence scoring criteria:** The confidence score reflects both **diagnostic certainty** (is the finding correct?) and **fix certainty** (is the recommended fix correct?). Both must be high for a high overall score. A finding where the diagnosis is clear but the fix is uncertain should score lower than one where both are well-understood.

   **Calibration anchors** (review agents should use these bands consistently):

   | Band | Score | When to use |
   |------|-------|-------------|
   | **Certain** | 90-100% | Both diagnosis and fix are unambiguous. Single obvious cause, single obvious fix. Examples: unused import, missing null check with clear guard, typo in variable name. |
   | **High** | 70-89% | Diagnosis is clear, fix has 1-2 viable approaches requiring minor judgment. Examples: missing error handling with standard pattern, naming convention violation. |
   | **Moderate** | 40-69% | Diagnosis is probable but context-dependent. Fix requires understanding broader system behavior. Examples: potential performance issue, possible race condition. |
   | **Low** | 0-39% | Speculative or uncertain diagnosis. Root cause unclear or multiple competing explanations. Examples: architectural concern, design trade-off. |

   **Example:**

   ```
   issue(blocking): This sql.raw() call with user input is a SQL injection vector.
     apps/api/src/users/users.service.ts:42
     -- security-auditor
     Root cause: The raw SQL call was introduced during the Knex-to-Drizzle migration
       without converting to parameterized queries.
     Solutions:
       1. Replace sql.raw(input) with sql.param(input) using Drizzle's parameterized API (recommended)
       2. Use prepared statements with explicit parameter binding
       3. Add input validation + escaping as a defense-in-depth layer
     Confidence: 92%
   ```

   **Missing enrichment fields:** If any enrichment field (root cause, solutions, confidence) is missing from an agent's output, default the finding's confidence to 0% and route it to 1b1. Do not attempt to infer missing fields.

   **Malformed confidence values:** If the confidence value is not a valid integer between 0 and 100 (e.g., "high", "120%", "0.85", negative numbers), treat it as 0% and route the finding to 1b1.

5. **Categorize each finding:**

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

Collect findings from all review agents and merge them into a single report. Deduplicate any overlapping findings (e.g., if both security-auditor and backend-dev flag the same SQL injection). Attribute each finding to the agent that raised it. After deduplication, **sort findings by confidence (descending) within each category group** so the highest-confidence findings appear first in each section.

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

### Phase 3.5 — Confidence-Gated Auto-Apply

After presenting findings locally, split findings based on confidence and category for automated fixing. This phase runs **before** posting to the PR so that the PR comment can accurately reflect auto-apply outcomes.

1. **Split findings into two queues:**
   - **Auto-apply queue:** Findings that meet **all** of the following criteria:
     - Confidence **>= 80%**
     - Category in [`issue`, `suggestion`, `todo`] (actionable categories)
     - **At least two independent review agents** flagged it with confidence >= 80%. Single-agent findings at any confidence level go to 1b1.
     - **Not a security finding.** Findings originating from `security-auditor` or categorized as security issues are **excluded from auto-apply** regardless of confidence score — they always route to 1b1. Security fixes require human judgment due to their risk profile.
   - **1b1 queue:** All other findings — those with confidence **< 80%**, non-actionable categories (`praise`, `thought`, `question`), single-agent findings, or security findings. Praise findings are exempt from auto-apply entirely. `thought` and `question` findings always go to 1b1 regardless of confidence.
   - Confidence exactly 80% is inclusive (treated as >= 80%) for the threshold check.

2. **Confirmation prompt for large auto-apply queues:** If the auto-apply queue contains **more than 5 findings**, present the user with an `AskUserQuestion` before proceeding: "N findings qualify for auto-apply (confidence >= 80%, consensus from 2+ agents). Proceed with auto-apply, or review all individually via 1b1?" Options: "Auto-apply all N" / "Review individually via 1b1". If the user chooses to review individually, move all auto-apply queue findings to the 1b1 queue and skip the rest of Phase 3.5.

3. **If the auto-apply queue is empty**, skip this phase entirely and proceed to Phase 3.6.

4. **Serial application:** Pass auto-apply queue findings to fixer agents **one at a time** (serial, not batched). Each finding is applied and validated before moving to the next.

5. **On success:** Mark the finding as `[applied]` in the post-apply summary.

6. **On failure** (test failure, lint error, or any validation issue):
   - The fixer restores the pre-fix snapshot via `git stash pop` (see fixer agent Auto-Apply Failure Protocol for stash details).
   - The finding is demoted to the 1b1 queue with a note: "Auto-apply attempted but failed: {reason}."
   - **All remaining unapplied findings in the auto-apply queue are also demoted to 1b1.** Do not continue applying after a failure.

7. **On fixer timeout or crash:** The finding is demoted to the 1b1 queue with a note: "Auto-apply failed: fixer agent did not respond." No partial changes should remain — the fixer must restore the stash before erroring.

8. **On fixer "cannot auto-fix" report:** The finding is demoted to the 1b1 queue with the fixer's explanation attached.

9. **Note:** Previously successful auto-applies are NOT rolled back when the queue halts. The changes from applied findings remain in the working tree.

10. **Post-apply summary:** After all auto-apply attempts complete (or halt on failure), display a summary before posting to the PR:

   ```
   -- Auto-Applied Fixes (confidence >= 80%, 2+ agent consensus) --

   Applied N finding(s) automatically:
     1. [applied] issue(blocking): SQL injection in users.service.ts:42 (92%)
     2. [applied] suggestion(blocking): Missing null check in auth.guard.ts:18 (88%)
     3. [failed -> 1b1] nitpick: Unused import in dashboard.tsx:3 (85%) -- test failure after fix

   Remaining M finding(s) (confidence <80%, single-agent, security, or non-actionable) will be presented one-by-one.
   ```

---

### Phase 3.6 — Post Findings to PR

After auto-apply completes (or is skipped), **post the full review as a PR comment** so there is a trace on GitHub. Because this phase runs after Phase 3.5, the `[auto-applied]` markers reflect actual outcomes.

1. **Resolve the PR number:**
   - If a PR number was provided (`/review #42`), use it directly.
   - If reviewing a branch (`/review`), detect the PR for the current branch:
     ```bash
     gh pr list --head "$(git branch --show-current)" --json number --jq '.[0].number'
     ```
   - If no PR exists for the branch, **skip this phase** (no comment to post).

2. **Post the review comment:**

   Write the review body to a temp file, then post:

   ```bash
   # Write review to temp file (avoids shell escaping issues with backticks in findings)
   cat > /tmp/review-comment.md << 'REVIEW_EOF'
   ## Code Review

   <full review output from Phase 3: all findings grouped by category + summary + verdict>

   ---
   _Review by Claude Code via `/review`_
   REVIEW_EOF

   gh pr comment <number> --body-file /tmp/review-comment.md
   ```

3. **Format rules:**
   - Use the same grouped format as Phase 3 (Blockers → Warnings → Suggestions → Praise)
   - Include the summary line and verdict
   - Wrap finding labels in backticks for readability (e.g., `` `issue(blocking):` ``)
   - Use a `## Code Review` header so comments are easy to find
   - **All findings are included in the PR comment regardless of confidence level.** Auto-applied findings (those processed in Phase 3.5) are marked with an `[auto-applied]` prefix in the PR comment so reviewers can see what was fixed automatically. The grouped format and verdict logic remain unchanged.

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

  **Spawning logic:**
  - **Single domain, ≤5 findings:** spawn one fixer
  - **Single domain, 6+ findings across distinct modules:** spawn multiple fixers, each scoped to a module group (e.g., one for `apps/api/src/auth/`, another for `apps/api/src/users/`). Fixers in the same domain must NOT share files.
  - **Multi-domain:** spawn one fixer per domain in parallel. Apply the 6+ splitting rule within each domain.

  Each fixer receives only the findings relevant to its domain. All fixers use the `fixer` agent definition (`.claude/agents/fixer.md`) with their domain scope specified in the prompt.

- After all fixers complete, **stage, commit, and push** the combined fixes in a single commit
- CI runs; if it fails, spawn the relevant domain fixer to investigate and fix until green
- **Post a follow-up comment** on the PR confirming the fixes:

  Write the fixes summary to a temp file, then post:

  ```bash
  cat > /tmp/review-fixes.md << 'FIXES_EOF'
  ## Review Fixes Applied

  All **N** accepted findings from the review have been addressed in <commit_sha>.

  | # | Finding | Status |
  |---|---------|--------|
  | 1 | `issue(blocking):` <short description> | Fixed |
  | 2 | `suggestion(blocking):` <short description> | Fixed |
  | … | … | … |

  Rejected/deferred findings (if any):
  - `<label>:` <short description> — <reason>

  ---
  _Fixes by Claude Code via `/review` fixer agents_
  FIXES_EOF

  gh pr comment <number> --body-file /tmp/review-fixes.md
  ```

### Phase 5 — Auto-Merge Gate

After all fixes are committed, pushed, and the follow-up PR comment is posted:

1. **Ask the human** via `AskUserQuestion` whether to add the `reviewed` label:

   ```
   AskUserQuestion:
     question: "All review findings are fixed and pushed. Add the 'reviewed' label to enable auto-merge?"
     options:
       - label: "Yes, add label"
         description: "Adds the 'reviewed' label. The auto-merge workflow will merge the PR once CI is green."
       - label: "No, I'll review first"
         description: "Skip labeling. You can add the label manually later with: gh pr edit <number> --add-label reviewed"
   ```

2. **If approved**, add the label:
   ```bash
   gh pr edit <number> --add-label "reviewed"
   ```

3. The `auto-merge.yml` workflow picks up the label and enables `gh pr merge --auto --squash`. GitHub merges once all required checks pass.

4. **If declined**, inform the human they can add the label manually later:
   ```bash
   gh pr edit <number> --add-label "reviewed"
   ```

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
| No PR for current branch | Skip PR comment (Phase 3.6), findings stay local only |
| All findings >= 80% with consensus | All auto-applied. Post-apply summary shown. 1b1 is skipped (no items). |
| All findings < 80% or single-agent | Phase 3.5 is skipped. All go through enriched 1b1. |
| Auto-apply breaks tests | Fixer restores via `git stash pop`. Finding demoted to 1b1 with failure note. |
| Auto-apply causes lint error | Same as test failure — stash restore, demote to 1b1. |
| Fixer agent times out | Finding demoted to 1b1 with note: "Auto-apply failed: fixer agent did not respond." |
| Fixer reports "cannot auto-fix" | Finding demoted to 1b1 with fixer's explanation. |
| Praise/thought/question finding | Exempt from auto-apply. Praise in summary, thought/question always to 1b1. |
| Confidence exactly 80% | Treated as >= 80% (inclusive threshold). |
| Review agent outputs confidence without root cause | Invalid — default confidence to 0%, force to 1b1. |
| Phase 3.5 modifies files that 1b1 findings also target | Phase 4 fixer re-reads files before applying. Stale findings reported, not silently applied. |

## Safety Rules

1. **Fresh agents only** — review agents must be new instances with no implementation context
2. **Never auto-merge** or approve PRs on GitHub
3. **Human decides on every finding except high-confidence consensus findings.** The human gate is only bypassed when **at least two independent review agents** flagged the same finding with confidence >= 80% AND it is an actionable category (`issue`, `suggestion`, `todo`) AND it is not a security finding. All other findings go through the 1b1 walkthrough. The human can review auto-applied changes via `git diff` at any time.
4. **Always post review to PR** — if a PR exists, findings must be posted as a comment for traceability. After fixes are applied, post a follow-up comment confirming which findings were addressed.
5. **Fixer handles fixes** — the review skill does not fix code; that is the fixer agent's responsibility after 1b1

$ARGUMENTS
