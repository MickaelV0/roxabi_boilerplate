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
4. |Δ| = 0 → inform, halt
5. |Δ| > 50 → warn quality degradation, suggest split

## Phase 2 — Spec Compliance

1. issue_num ← `git branch --show-current | grep -oP '\d+' | head -1`
2. spec ← `ls specs/<issue_num>-*.mdx 2>/dev/null`
3. spec ∃ → ∀ criterion ∈ spec.success_criteria:
   - met by diff → ∅
   - ¬met → emit `issue(blocking):` with criterion text
   - ∀ met → emit `praise:` (spec compliance)
4. spec ∄ → skip silently

## Phase 3 — Multi-Domain Review (Fresh Agents)

Spawn fresh agents via Task (¬implementation context → ¬bias).

### Agent dispatch

| Agent | Condition | Focus |
|-------|-----------|-------|
| **security-auditor** | always | OWASP, secrets, injection, auth |
| **architect** | |Δ| > 5 ∨ src ⊇ {arch, pattern, structure, service, module} | patterns, structure, circular deps |
| **product-lead** | spec(issue_num) ∃ | spec compliance, product fit |
| **tester** | Δ ∩ {`src/`, `test/`, `*.test.*`, `*.spec.*`} ≠ ∅ | coverage, AAA, edge cases |
| **frontend-dev** | Δ ∩ {`apps/web/`, `packages/ui/`} ≠ ∅ | FE patterns, components, hooks |
| **backend-dev** | Δ ∩ {`apps/api/`, `packages/types/`} ≠ ∅ | BE patterns, API, errors |
| **devops** | Δ ∩ {configs, CI} ≠ ∅ | config, deploy, infra |

**Notes:**
- **architect skip:** XS changes (≤5 files) ∧ no arch keywords → faster feedback
- **product-lead skip:** Phase 2 auto-detects spec; if missing, skip entirely
- **tester skip:** config/docs/infra only → skip (test reviewers handled by domain-specific agents)

**Subdomain split:** |files_domain| ≥ 8 ∧ distinct modules → N same-type agents, 1/module group. Default: 1 agent/domain.

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

Each **spawned** agent receives: full diff + Δ + spec (if ∃) + "output Conventional Comments". Only agents matching Phase 2 conditions are spawned.

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

**Validation:** missing fields ∨ C ∉ ℤ ∩ [0,100] → C(f) := 0, → Q_1b1.

### Finding categories

| Category | Label | Blocks merge? |
|----------|-------|:---:|
| Bug / Security / Spec gap | `issue:` / `todo:` | ✓ |
| Standard violation | `suggestion(blocking):` | ✓ |
| Style | `suggestion(non-blocking):` / `nitpick:` | ✗ |
| Architecture | `thought:` / `question:` | ✗ |
| Good work | `praise:` | ✗ |

## Phase 4 — Merge & Present

1. Collect F from all agents
2. Dedup: same file:line + issue → keep max C, original agent
3. Sort: C desc within category
4. Group: Blockers → Warnings → Suggestions → Praise

**Verdict:**

| Condition | Verdict |
|-----------|---------|
| ∃f: blocks(f) | Request changes |
| ∃f: warns(f) ∧ ¬∃f: blocks(f) | Approve with comments |
| suggestions/praise only | Approve |
| F = ∅ | Approve (clean) |

## Phase 5 — Confidence-Gated Auto-Apply

Runs **before** PR posting — `[auto-applied]` markers reflect outcomes.

**1. Queue split:**

```
auto_apply(f) ⟺ C(f) ≥ T  ∧  cat(f) ∈ actionable  ∧  src(f) ≠ security-auditor  ∧  |A(f)| ≥ 2
Q_auto = {f ∈ F | auto_apply(f)}
Q_1b1  = F \ Q_auto
∀f: cat(f) ∈ {thought, question, praise} → f ∈ Q_1b1  (unconditional)
```

**2. Verify single-agent:** ∀ f ∈ Q_auto ∧ |A(f)| = 1 → spawn fresh verifier (different domain).
- C(f) ≥ T → stays, |A(f)| := 2
- C(f) < T ∨ rejects → Q_1b1
- Batch ∥

**3. Large queue:** |Q_auto| > 5 → AskUserQuestion: "Auto-apply all N?" / "Review via 1b1".
1b1 → Q_1b1 ∪= Q_auto; Q_auto := ∅; skip to Phase 6.

**4. Early exit:** Q_auto = ∅ → skip to Phase 6.

**5. Serial apply:** ∀ f ∈ Q_auto (sequential):
- succeeds → `[applied]`
- fails (test / lint / timeout / crash) → stash restore → demote f + remaining → Q_1b1 + note → **halt**
- Prior fixes ¬rolled back

**6. Summary:** Display before PR:
```
-- Auto-Applied Fixes (C ≥ 80%, 2+ consensus) --
Applied N finding(s):
  1. [applied] issue(blocking): SQL injection in users.service.ts:42 (92%)
  2. [failed -> 1b1] nitpick: Unused import in dashboard.tsx:3 (85%) -- test failure
Remaining M finding(s) → 1b1.
```

## Phase 6 — Post to PR

1. PR# = provided ∨ `gh pr list --head "$(git branch --show-current)" --json number --jq '.[0].number'`; ¬∃ → skip
2. `/tmp/review-comment.md` → `gh pr comment <#> --body-file /tmp/review-comment.md`
3. `## Code Review` header, grouped findings + summary + verdict. Auto-applied → `[auto-applied]` prefix. ∀C included.

## Phase 7 — 1b1 Walkthrough

∀ f ∈ Q_1b1 (via `/1b1`): show → trade-offs → recommend → human decides {accept, reject, defer}

Post-walkthrough → spawn ∥ fixers:

| Fixer | Condition | Scope |
|-------|-----------|-------|
| Backend | accepted ∩ {`apps/api/`, `packages/types/`} ≠ ∅ | BE |
| Frontend | accepted ∩ {`apps/web/`, `packages/ui/`} ≠ ∅ | FE |
| Infra | accepted ∩ {`packages/config/`, root, CI} ≠ ∅ | Config |

**Split:** ≤5 → 1 fixer | ≥6 across modules → N fixers (disjoint) | multi-domain → 1/domain ∥ + split within.

All use `.claude/agents/fixer.md`. Done → stage + commit + push (1 commit). CI fail → respawn until green. Post `## Review Fixes Applied` via `/tmp/review-fixes.md`.

## Phase 8 — Auto-Merge Gate

1. `git fetch origin staging && git rev-list HEAD..origin/staging --count`
   - count > 0 → `git rebase origin/staging` + `git push --force-with-lease`
   - conflict → inform user, halt (¬label)
2. AskUserQuestion: "Add `reviewed` label?" → Yes / No
3. Yes → `gh api repos/:owner/:repo/issues/<#>/labels -f "labels[]=reviewed"` → squash merge on green CI
4. No → inform manual

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
| ¬∃ PR | Skip Phase 6, local only |
| ∀f: auto_apply(f) | All auto-applied, 1b1 skipped |
| ∀f: C(f) < T | Phase 5 skipped, all → 1b1 |
| |A(f)| = 1 ∧ C(f) ≥ T | Verification agent → auto-apply ∨ 1b1 |
| Auto-apply breaks tests/lint | Stash restore, demote to 1b1 |
| Fixer timeout/crash/cannot-fix | Demote to 1b1, stash restore |
| cat(f) ∈ {praise, thought, question} | Exempt from auto-apply |
| C(f) = T | Inclusive (≥ T) |
| Missing root cause/solutions | C(f) := 0, → Q_1b1 |
| Phase 5 edits ∩ Phase 7 targets | Phase 7 fixer re-reads files first |
| architect skipped (|Δ| ≤ 5 + no arch keywords) | No arch review → faster, still security/spec/test |
| product-lead skipped (no spec) | Skip compliance check → Phase 2 validation skipped |
| tester skipped (pure config/docs) | No test coverage review → focus on security/devops |

## Safety Rules

1. Fresh agents only — ¬implementation context
2. ¬auto-merge, ¬approve PRs on GitHub
3. Human gate bypassed ⟺ |A(f)| ≥ 2 ∧ C(f) ≥ T ∧ cat(f) ∈ actionable ∧ src(f) ≠ security-auditor. |A(f)| = 1 ∧ C(f) ≥ T → verification first. All else → 1b1. Human can `git diff` anytime.
4. ∃ PR → must post comment + post-fix follow-up
5. Review ¬fix code — fixer agents handle after 1b1

$ARGUMENTS
