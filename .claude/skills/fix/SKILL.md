---
name: fix
argument-hint: '[#PR]'
description: Apply review findings — auto-apply high-confidence, 1b1 for rest, spawn fixers. Triggers: "fix findings" | "fix review" | "apply fixes" | "fix these".
allowed-tools: Bash, AskUserQuestion, Read, Write, Edit, Glob, Grep, Task, Skill
---

# Fix

Apply review findings from a PR or conversation context — auto-apply high-confidence findings, walk through the rest 1b1, spawn fixer agents for accepted findings, then commit.

**⚠ Flow: single continuous pipeline. ¬stop between phases. AskUserQuestion response → immediately execute next phase. Stop only on: explicit Cancel, or pipeline completion.**

```
/fix        → findings from conversation context
/fix #42    → gather findings from PR #42 comments
```

## Definitions

```
F         = set of all findings
f ∈ F     = a single finding
C(f)      ∈ [0,100] ∩ ℤ        — confidence score
A(f)      = {agents that flagged f}
cat(f)    ∈ {issue, suggestion, todo, nitpick, thought, question, praise}
src(f)    = originating agent
Δ         = set of changed files
actionable = {issue, suggestion, todo}
T         = 80                   — auto-apply threshold
```

## Phase 1 — Gather Findings

1. PR# provided → `gh pr view <#> --json comments --jq '.comments[].body'` — parse Conventional Comments findings from review output
2. ¬PR# → scan conversation context for most recent `/review` output
3. F = ∅ → inform ("No findings to apply"), halt
4. Parse each finding into structured form: label, file:line, agent, root cause, solutions, C(f)
5. Malformed finding (missing fields ∨ C ∉ ℤ ∩ [0,100]) → C(f) := 0

## Phase 2 — Queue Split

```
auto_apply(f) ⟺ C(f) ≥ T  ∧  cat(f) ∈ actionable  ∧  src(f) ≠ security-auditor
Q_auto = {f ∈ F | auto_apply(f)}
Q_1b1  = F \ Q_auto
∀f: cat(f) ∈ {thought, question, praise} → f ∈ Q_1b1  (unconditional)
```

## Phase 3 — Confidence-Gated Auto-Apply

Runs before 1b1 — `[auto-applied]` markers reflect outcomes.

**1. Early exit:** Q_auto = ∅ → skip to Phase 4.

**2. Verify single-agent:** ∀ f ∈ Q_auto ∧ |A(f)| = 1 → spawn fresh verifier (different domain).
- C(f) ≥ T → stays, |A(f)| := 2
- C(f) < T ∨ rejects → Q_1b1
- Batch ∥

**3. Large queue:** |Q_auto| > 5 → AskUserQuestion: "Auto-apply all N?" / "Review via 1b1".
- 1b1 → Q_1b1 ∪= Q_auto; Q_auto := ∅; skip to Phase 4.

**4. Serial apply:** ∀ f ∈ Q_auto (sequential):
- succeeds → `[applied]`
- fails (test / lint / timeout / crash) → stash restore → demote f + remaining → Q_1b1 + note → **halt serial apply**
- Prior fixes ¬rolled back

**5. Summary:** Display before Phase 4:
```
-- Auto-Applied Fixes (C ≥ 80%, verified) --
Applied N finding(s):
  1. [applied] issue(blocking): SQL injection in users.service.ts:42 (92%)
  2. [failed -> 1b1] nitpick: Unused import in dashboard.tsx:3 (85%) -- test failure
Remaining M finding(s) → 1b1.
```

**→ immediately continue to Phase 4 (¬stop).**

## Phase 4 — 1b1 Walkthrough

Q_1b1 = ∅ → skip to Phase 5.

∀ f ∈ Q_1b1 → invoke `skill: "1b1"` with findings as items.

1b1 produces a decision for each finding: {accept, reject, defer}.

accepted = {f ∈ Q_1b1 | decision(f) = accept}

## Phase 5 — Spawn Fixer Agents

accepted = ∅ → inform ("No findings accepted"), skip to Phase 6.

**Domain dispatch:**

| Fixer | Condition | Scope |
|-------|-----------|-------|
| Backend | accepted ∩ {`apps/api/`, `packages/types/`} ≠ ∅ | BE patterns, API, errors |
| Frontend | accepted ∩ {`apps/web/`, `packages/ui/`} ≠ ∅ | FE patterns, components, hooks |
| Infra | accepted ∩ {`packages/config/`, root, CI} ≠ ∅ | Config, deploy, infra |

**Split rules:**
- ≤5 findings/domain → 1 fixer per domain
- ≥6 findings/domain across distinct modules → N fixers (disjoint file groups), 1/module group
- multi-domain → 1 fixer/domain ∥ + split within domain if ≥6

All fixers use `.claude/agents/fixer.md`.

**Fixer payload per agent:** accepted findings in scope + full diff context + "fix each finding; re-read files before editing; run lint + tests after each fix."

Fixer constraints:
- Re-read all target files before editing (Phase 3 edits may have changed them)
- CI fail → respawn until green (max 3 attempts)
- Cannot fix → escalate to lead, mark as unresolved

## Phase 6 — Commit + Push

1. Stage specific files only (¬`git add -A`)
2. Commit:
   ```
   fix(<scope>): apply review findings (#<PR>)

   - <short description of finding 1>
   - <short description of finding 2>

   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   ```
3. Push: `git push`
4. ¬push without explicit request from user → AskUserQuestion: "Push now?" / "I'll push later"

## Phase 7 — Post Follow-Up Comment

∄ PR → skip.

`/tmp/review-fixes.md` → `gh pr comment <#> --body-file /tmp/review-fixes.md`

```markdown
## Review Fixes Applied

**Auto-applied (Phase 3):** N finding(s)
**Accepted via 1b1:** M finding(s)
**Rejected:** K finding(s)
**Deferred:** J finding(s)

### Applied
- [applied] issue(blocking): SQL injection in users.service.ts:42 (92%)
- [applied] suggestion: Missing error boundary in dashboard.tsx:15 (83%)

### Deferred
- nitpick: Variable naming in auth.service.ts:88 — noted for future cleanup
```

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| F = ∅ | Inform, halt |
| Q_auto = ∅ | Skip Phase 3, go to Phase 4 |
| Q_1b1 = ∅ after Phase 3 | Skip Phase 4 |
| accepted = ∅ | Skip Phase 5, inform |
| ∀f: auto_apply(f) | All auto-applied, 1b1 skipped |
| ∀f: C(f) < T | Phase 3 skipped, all → 1b1 |
| |A(f)| = 1 ∧ C(f) ≥ T | Verification agent → auto-apply ∨ 1b1 |
| Auto-apply breaks tests/lint | Stash restore, demote to 1b1 |
| Fixer timeout/crash/cannot-fix | Demote to 1b1, stash restore |
| cat(f) ∈ {praise, thought, question} | Exempt from auto-apply |
| C(f) = T | Inclusive (≥ T) |
| Missing root cause/solutions | C(f) := 0, → Q_1b1 |
| Phase 3 edits ∩ Phase 5 targets | Phase 5 fixer re-reads files first |
| security-auditor finding ∧ C ≥ T | Still → Q_1b1 (safety rule) |
| ¬∃ PR | Skip Phase 7, local commit only |
| Critical security accepted | Escalate immediately after 1b1 |

## Safety Rules

1. security-auditor findings ¬auto-apply regardless of C(f) — always → Q_1b1
2. ¬approve PRs on GitHub, ¬auto-merge
3. Human can `git diff` anytime — applied changes visible in working tree
4. ∃ PR → must post follow-up comment (Phase 7)
5. Fixer agents ¬have implementation context from current session → spawn fresh
6. Stage specific files only — ¬`git add -A` (risk of including .env, secrets)

$ARGUMENTS
