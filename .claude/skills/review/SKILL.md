---
argument-hint: [#PR]
description: Multi-domain code review (agents + Conventional Comments → /1b1). Triggers: "review changes" | "review PR #42" | "code review" | "check my code".
allowed-tools: Bash, AskUserQuestion, Read, Grep, Task
---

# Code Review

Review branch/PR changes via fresh domain-specific agents → Conventional Comments → /1b1.

```
/review          → diff staging...HEAD
/review #42      → gh pr diff 42
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

## Phase 1 — Gather Changes

1. target = PR# provided → `gh pr diff <#>` | else → `git diff staging...HEAD`
2. Δ = `git diff --name-only staging...HEAD` (or `gh pr diff <#> --name-only`)
3. Read all files ∈ Δ in full (skip binaries, note in report)
4. |Δ| = 0 → inform user, halt
5. |Δ| > 50 → warn quality degradation, suggest split

## Phase 1.5 — Spec Compliance

1. issue_num ← `git branch --show-current | grep -oP '\d+' | head -1`
2. spec ← `ls specs/<issue_num>-*.mdx 2>/dev/null`
3. spec ∃ → ∀ criterion ∈ spec.success_criteria:
   - met by diff → ∅
   - ¬met → emit `issue(blocking):` with criterion text
   - ∀ met → emit `praise:` (spec compliance)
4. spec ∄ → skip silently

## Phase 2 — Multi-Domain Review (Fresh Agents)

Spawn fresh agents via Task (¬implementation context → ¬bias).

### Agent dispatch

| Agent | Condition | Focus |
|-------|-----------|-------|
| **security-auditor** | always | OWASP, secrets, injection, auth |
| **architect** | always | patterns, structure, circular deps |
| **product-lead** | always | spec compliance, product fit |
| **tester** | always | coverage, AAA, edge cases |
| **frontend-dev** | Δ ∩ {`apps/web/`, `packages/ui/`} ≠ ∅ | FE patterns, components, hooks |
| **backend-dev** | Δ ∩ {`apps/api/`, `packages/types/`} ≠ ∅ | BE patterns, API, errors |
| **devops** | Δ ∩ {configs, CI} ≠ ∅ | config, deploy, infra |

**Subdomain split:** |files_domain| ≥ 8 ∧ files span distinct modules → split into N agents of same type, each scoped to a module group. Default: 1 agent/domain when < 8 files.

### Security-auditor scoping (this agent only)

1. ∀ f ∈ Δ: extract imports(f) = static `from '...'` ∪ dynamic `import('...')` paths
2. Resolve aliases:

   | Pattern | Resolution |
   |---------|-----------|
   | `./`, `../` | relative, try `.ts`, `/index.ts` |
   | `@repo/<pkg>` | → `packages/<pkg>/src/index.ts` (skip vitest-config, playwright-config) |
   | `@/*` (web only) | → `apps/web/src/` + rest, try `.ts`, `.tsx`, `/index.{ts,tsx}` |
   | External | skip |

3. scope = Δ ∪ ⋃{resolve(imports(f)) | f ∈ Δ} ∪ `apps/api/src/auth/**` — deduplicate

### Agent payload

Each agent receives: full diff + Δ + spec (if ∃) + "output Conventional Comments"

### Review dimensions (scoped per domain)

correctness | security | performance | architecture | tests | readability | observability

### Finding format (ALL fields mandatory)

```
<label>: <description>
  <file>:<line>
  -- <agent>
  Root cause: <why, not what>
  Solutions:
    1. <primary> (recommended)
    2. <alternative>
    3. <alternative> [optional]
  Confidence: <0-100>%
```

**C(f) = min(diagnostic_certainty, fix_certainty)**

| Band | C | Criteria |
|------|---|----------|
| Certain | 90-100 | Unambiguous diagnosis + fix |
| High | 70-89 | Clear diagnosis, 1-2 fix approaches |
| Moderate | 40-69 | Probable, context-dependent |
| Low | 0-39 | Speculative, competing explanations |

**Example:**
```
issue(blocking): This sql.raw() call with user input is a SQL injection vector.
  apps/api/src/users/users.service.ts:42
  -- security-auditor
  Root cause: Raw SQL from Knex-to-Drizzle migration, not converted to parameterized queries.
  Solutions:
    1. Replace sql.raw(input) with sql.param(input) via Drizzle parameterized API (recommended)
    2. Use prepared statements with explicit parameter binding
    3. Add input validation + escaping as defense-in-depth
  Confidence: 92%
```

**Validation:** missing enrichment fields ∨ C ∉ ℤ ∩ [0,100] → C(f) := 0, route to Q_1b1.

### Finding categories

| Category | Label | Blocks merge? |
|----------|-------|:---:|
| Bug / Security / Spec gap | `issue:` / `todo:` | ✓ |
| Standard violation | `suggestion(blocking):` | ✓ |
| Style | `suggestion(non-blocking):` / `nitpick:` | ✗ |
| Architecture | `thought:` / `question:` | ✗ |
| Good work | `praise:` | ✗ |

## Phase 3 — Merge & Present

1. Collect F from all agents
2. Deduplicate (same file:line + same issue → keep highest C, attribute to original agent)
3. Sort by C desc within each category group
4. Group: Blockers → Warnings → Suggestions → Praise

**Verdict:**

| Condition | Verdict |
|-----------|---------|
| ∃f: blocks(f) | Request changes |
| ∃f: warns(f) ∧ ¬∃f: blocks(f) | Approve with comments |
| suggestions/praise only | Approve |
| F = ∅ | Approve (clean) |

## Phase 3.5 — Confidence-Gated Auto-Apply

Runs **before** PR posting so `[auto-applied]` markers reflect actual outcomes.

### 1. Queue split

```
auto_apply(f) ⟺ C(f) ≥ T  ∧  cat(f) ∈ actionable  ∧  src(f) ≠ security-auditor  ∧  |A(f)| ≥ 2

Q_auto = {f ∈ F | auto_apply(f)}
Q_1b1  = F \ Q_auto

∀f: cat(f) ∈ {thought, question, praise} → f ∈ Q_1b1  (unconditional)
```

### 2. Verify single-agent findings

∀ f ∈ Q_auto where |A(f)| = 1: spawn fresh verification agent (different domain type). Verifier receives f + file(s) + diff.
- Verifier C(f) ≥ T → f stays in Q_auto (|A(f)| := 2)
- Verifier C(f) < T ∨ rejects → f → Q_1b1
- Batch all verifications ∥

### 3. Large queue gate

|Q_auto| > 5 → AskUserQuestion: "Auto-apply all N?" / "Review via 1b1"
User picks 1b1 → Q_1b1 := Q_1b1 ∪ Q_auto; Q_auto := ∅; skip to Phase 3.6

### 4. Early exit

Q_auto = ∅ → skip to Phase 3.6

### 5. Serial application

∀ f ∈ Q_auto (sequential, one at a time):
- fixer(f) **succeeds** → mark `[applied]`
- fixer(f) **fails** (test / lint / timeout / crash / cannot-fix) → `git stash pop` restore → demote f + all remaining Q_auto to Q_1b1 with failure note → **halt loop**
- Previously applied fixes ¬rolled back on halt

### 6. Post-apply summary

Display before PR posting:
```
-- Auto-Applied Fixes (C ≥ 80%, 2+ agent consensus) --

Applied N finding(s):
  1. [applied] issue(blocking): SQL injection in users.service.ts:42 (92%)
  2. [failed -> 1b1] nitpick: Unused import in dashboard.tsx:3 (85%) -- test failure

Remaining M finding(s) → 1b1.
```

## Phase 3.6 — Post to PR

1. PR# = provided ∨ `gh pr list --head "$(git branch --show-current)" --json number --jq '.[0].number'`; ¬∃ PR → skip phase
2. Write to `/tmp/review-comment.md` → `gh pr comment <#> --body-file /tmp/review-comment.md`
3. Format: `## Code Review` header, grouped findings (Blockers→Warnings→Suggestions→Praise) + summary + verdict. Auto-applied → `[auto-applied]` prefix. All findings included ∀C.

## Phase 4 — 1b1 Walkthrough

∀ f ∈ Q_1b1 (via `/1b1`): show → trade-offs → recommend → human decides {accept, reject, defer}

Post-walkthrough, spawn ∥ fixers by domain:

| Fixer | Condition | Scope |
|-------|-----------|-------|
| Backend | accepted ∩ {`apps/api/`, `packages/types/`} ≠ ∅ | BE only |
| Frontend | accepted ∩ {`apps/web/`, `packages/ui/`} ≠ ∅ | FE only |
| Infra | accepted ∩ {`packages/config/`, root, CI} ≠ ∅ | Config only |

**Split rule:**
- 1 domain ∧ |findings| ≤ 5 → 1 fixer
- 1 domain ∧ |findings| ≥ 6 across modules → N fixers (disjoint file sets)
- Multi-domain → 1 fixer/domain ∥ + apply split rule within each

All fixers use `.claude/agents/fixer.md`. After completion → stage + commit + push (single commit). CI fail → respawn domain fixer until green. Post follow-up PR comment (`## Review Fixes Applied`) with fix table via `/tmp/review-fixes.md`.

## Phase 5 — Auto-Merge Gate

1. AskUserQuestion: "Add `reviewed` label for auto-merge?" → Yes/No
2. Yes → `gh pr edit <#> --add-label "reviewed"` → `auto-merge.yml` → squash merge on green CI
3. No → inform manual option

> `/review` ¬includes `--fix` flag. Fixing = fixer agents after /1b1.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| |Δ| = 0 | Inform, halt |
| Binary ∈ Δ | Skip, note |
| |Δ| > 50 | Warn, suggest split |
| F = ∅ | Clean approve, post comment |
| ∀f: ¬blocks(f) | Batch-accept option in 1b1 |
| Critical security | Escalate immediately, ¬wait for 1b1 |
| Agents disagree | Present both in 1b1, human decides |
| ¬∃ PR | Skip Phase 3.6, local only |
| ∀f: auto_apply(f) | All auto-applied, 1b1 skipped |
| ∀f: C(f) < T | Phase 3.5 skipped, all → 1b1 |
| |A(f)| = 1 ∧ C(f) ≥ T | Verification agent → auto-apply ∨ 1b1 |
| Auto-apply breaks tests/lint | Stash restore, demote to 1b1 |
| Fixer timeout/crash/cannot-fix | Demote to 1b1, stash restore |
| cat(f) ∈ {praise, thought, question} | Exempt from auto-apply |
| C(f) = T | Inclusive (≥ T) |
| Missing root cause/solutions | C(f) := 0, → Q_1b1 |
| Phase 3.5 edits ∩ Phase 4 targets | Phase 4 fixer re-reads files first |

## Safety Rules

1. Fresh agents only — ¬implementation context
2. ¬auto-merge, ¬approve PRs on GitHub
3. Human gate bypassed ⟺ |A(f)| ≥ 2 ∧ C(f) ≥ T ∧ cat(f) ∈ actionable ∧ src(f) ≠ security-auditor. |A(f)| = 1 ∧ C(f) ≥ T → verification first. All else → 1b1. Human can `git diff` anytime.
4. ∃ PR → must post comment + post-fix follow-up
5. Review ¬fix code — fixer agents handle after 1b1

$ARGUMENTS
