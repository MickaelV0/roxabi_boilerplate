---
name: bootstrap
argument-hint: '["idea" | --issue <N> | --spec <N>]'
description: Idea→approved spec pipeline (analysis + spec + 2 approval gates). Triggers: "bootstrap" | "plan feature" | "start feature" | "I have an idea" | "spec from issue".
allowed-tools: Bash, AskUserQuestion, Read, Write, Edit, Glob, Grep, Task
---

# Bootstrap

Let:
  α := analyses/{slug}.mdx
  σ := specs/{issue}-{slug}.mdx
  ρ := auto-selected expert reviewers

idea | issue | spec → approved spec. Interview → write docs → expert review → user gates.
¬scaffold, ¬PR. Execution → `/scaffold`. ¬TeamCreate — drive interviews + docs directly.

## Entry

```
/bootstrap "text"      → Gate 1 (full pipeline)
/bootstrap --issue N   → Gate 1 (issue as context)
/bootstrap --spec N    → Gate 2 (validate existing spec)
```

## Step 0 — Parse + Pre-check

Parse args → entry point.
`--issue N` → check ∃ branch/PR:

```bash
gh pr list --search "N" --json number,title,state,headRefName --jq '.[] | select(.state=="OPEN")'
gh api repos/:owner/:repo/issues/N/timeline --jq '.[] | select(.event=="cross-referenced") | .source.issue | select(.pull_request) | {number, title, state}'
```

∃ open PR ⇒ AskUserQuestion: `/review` | `/scaffold` | continue anyway.
¬proceed unless user picks "continue."

## Step 1 — Scan Existing Docs

Glob `analyses/*`, `specs/*` — match issue# ∨ slug keywords.

- ∃ σ ∧ entry=Gate1 ⇒ AskUserQuestion: reuse (→Gate2) | fresh
- ∃ α ∧ entry=Gate1 ⇒ AskUserQuestion: reuse | fresh

## Step 1a — Complexity Score

Skip if `--spec`. Use `/issue-triage` [Complexity Scoring](../issue-triage/SKILL.md#complexity-scoring) rubric.
AskUserQuestion: Confirm {tier} | Override S | Override F-lite | Override F-full.

---

## Gate 1: Analysis

> Skip if `--spec`.

### 1a. Generate

∃ α ⇒ read + present.
¬∃ ⇒ `skill: "interview", args: "topic text"` → α
Interview explores 2–3 shapes. α includes `## Shapes` + `## Fit Check`. Tier S may skip.
Domain expertise ⇒ spawn expert via Task. See [references/expert-consultation.md](references/expert-consultation.md).

### 1b. Expert Review

Auto-select ρ (¬ask user):

| ρ | When | Focus |
|---|------|-------|
| doc-writer | Always | Structure, clarity |
| product-lead | Always | Product fit, criteria quality |
| architect | ∃ arch / trade-offs / multi-domain | Technical soundness |
| devops | ∃ CI/CD / deploy / infra | Operational impact |

∀ r ∈ ρ → spawn ∥ `Task(subagent_type: "<r>", prompt: "Review α for <focus>. Return: good / needs improvement / concerns.")`.
Incorporate feedback → note unresolved concerns.

### 1c. User Approval

Open α: `code analyses/{slug}.mdx`. Summary: shapes, trade-offs, recommendation.
AskUserQuestion: **Approve** → commit α + Gate 2 | **Reject** → revise + re-review, loop.

---

## Gate 1.5: Investigation (Optional)

Skip if `--spec`. ∃ technical uncertainty ⇒ read [references/investigation.md](references/investigation.md).
¬signals ⇒ skip → Ensure GitHub Issue.

---

## Ensure GitHub Issue

Required before spec (naming: `{issue}-{slug}.mdx`).
∃ issue (`--issue N` ∨ found in scan) ⇒ use it.
¬∃ ⇒ draft from α → `gh issue create --title "<title>" --body "<body>"` → capture #.

---

## Gate 2: Spec

### 2a. Generate

∃ σ ⇒ read + present.
¬∃ ⇒ `skill: "interview", args: "--promote analyses/{slug}.mdx"` → σ
σ includes `## Breadboard` (affordance tables + wiring) + `## Slices` (vertical increments). May contain `[NEEDS CLARIFICATION]` (max 3–5). Tier S may skip Breadboard/Slices.

### 2b. Expert Review

Same auto-select as 1b. σ with impl details ⇒ always include architect.

**Pre-check ("unit tests for English"):**

| Check | Rule |
|-------|------|
| Testable criteria | Each binary (pass/fail) |
| No dangling refs | All breadboard IDs (U*/N*/S*) wired |
| Ambiguity budget | ≤5 `[NEEDS CLARIFICATION]` |
| Slice coverage | Every affordance in ≥1 slice |
| Edge completeness | Each edge case has handling strategy |

> Skip dangling refs + slice coverage if σ lacks `## Breadboard` ∨ `## Slices`.

≥2 checks fail ⇒ inform user before review. User: fix σ ∨ continue.
Spawn ∥ reviewers → incorporate feedback.

### 2c. User Approval

Open σ: `code specs/{issue}-{slug}.mdx`. Summary: scope, slices, |acceptance criteria|, `[NEEDS CLARIFICATION]` count.
AskUserQuestion: **Approve** → commit σ + Gate 2.5 | **Reject** → revise + re-review, loop.

---

## Gate 2.5: Smart Splitting (Optional)

Skip if Tier S. Read [references/smart-splitting.md](references/smart-splitting.md).
**Triggers:** |acceptance criteria| > 8 ∨ |slices| > 3.
¬thresholds ∧ ¬structure ⇒ skip → Issue Status.

---

## Issue Status Transitions

```bash
# Gate 1 approved
bun .claude/skills/issue-triage/triage.ts set <N> --status Analysis
# Gate 2 approved
bun .claude/skills/issue-triage/triage.ts set <N> --status Specs
```

## Completion

> α and σ committed incrementally at each gate (1c, 2c). ¬bulk commit.

1. Inform: "Bootstrap complete. Run `/scaffold --spec <N>` to execute."
   Gate 2.5 sub-issues ⇒ "Run `/scaffold --issue <N>` for each sub-issue in dependency order."

> Scaffold guard: unresolved `[NEEDS CLARIFICATION]` → blocks scaffold. Remind user.

¬scaffold. ¬PR. Bootstrap stops at approved spec.

## Edge Cases

Read [references/edge-cases.md](references/edge-cases.md).

$ARGUMENTS
