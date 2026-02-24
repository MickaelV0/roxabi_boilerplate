---
name: bootstrap
argument-hint: '["idea" | --issue <N> | --spec <N>]'
description: Idea→approved spec pipeline (analysis + spec + 2 approval gates). Triggers: "bootstrap" | "plan feature" | "start feature" | "I have an idea" | "spec from issue".
allowed-tools: Bash, AskUserQuestion, Read, Write, Edit, Glob, Grep, Task
---

# Bootstrap

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

`--issue N` → also check ∃ branch/PR:

```bash
gh pr list --search "N" --json number,title,state,headRefName --jq '.[] | select(.state=="OPEN")'
gh api repos/:owner/:repo/issues/N/timeline --jq '.[] | select(.event=="cross-referenced") | .source.issue | select(.pull_request) | {number, title, state}'
```

∃ open PR ⇒ AskUserQuestion: `/review` | `/scaffold` | continue anyway.
¬proceed unless user picks "continue."

## Step 1 — Scan Existing Docs

Glob `analyses/*`, `specs/*` — match issue# ∨ slug keywords.

- ∃ spec ∧ entry=Gate1 ⇒ AskUserQuestion: reuse (→Gate2) | fresh
- ∃ analysis ∧ entry=Gate1 ⇒ AskUserQuestion: reuse | fresh

## Step 1a — Complexity Score

Skip if `--spec`. Use `/issue-triage` [Complexity Scoring](../issue-triage/SKILL.md#complexity-scoring) rubric (factors, formula, tier mapping).

AskUserQuestion: Confirm {tier} | Override S | Override F-lite | Override F-full.

---

## Gate 1: Analysis

> Skip if `--spec`.

### 1a. Generate

∃ analysis ⇒ read + present.
¬∃ ⇒ `skill: "interview", args: "topic text"` → `analyses/{slug}.mdx`

Interview explores multi-shape approaches (2–3 shapes). Analysis includes `## Shapes` + `## Fit Check`. Tier S may skip these.
Domain expertise needed ⇒ spawn expert via Task. See [references/expert-consultation.md](references/expert-consultation.md).

### 1b. Expert Review

Auto-select (¬ask user):

| Reviewer | When | Focus |
|----------|------|-------|
| doc-writer | Always | Structure, clarity |
| product-lead | Always | Product fit, criteria quality |
| architect | ∃ arch decisions / trade-offs / multi-domain | Technical soundness |
| devops | ∃ CI/CD / deploy / infra | Operational impact |

∀ selected → spawn parallel `Task(subagent_type: "<reviewer>", prompt: "Review analyses/{slug}.mdx for <focus>. Return: good / needs improvement / concerns as bullets.")`.
Incorporate feedback → note unresolved concerns.

### 1c. User Approval

Open the analysis for review: `code analyses/{slug}.mdx`
Present a concise summary of the document: key shapes/approaches explored, main trade-offs, and recommendation.
AskUserQuestion: **Approve** → commit `analyses/{slug}.mdx` + Gate 2 | **Reject** → revise + re-review, loop.

---

## Gate 1.5: Investigation (Optional)

Skip if `--spec`. ∃ technical uncertainty ⇒ read [references/investigation.md](references/investigation.md).
¬signals ⇒ skip → Ensure GitHub Issue.

---

## Ensure GitHub Issue

Required before spec (naming: `{issue}-{slug}.mdx`).

- ∃ issue (`--issue N` ∨ found in scan) ⇒ use it.
- ¬∃ ⇒ draft from analysis → `gh issue create --title "<title>" --body "<body>"` → capture #.

---

## Gate 2: Spec

### 2a. Generate

∃ spec ⇒ read + present.
¬∃ ⇒ `skill: "interview", args: "--promote analyses/{slug}.mdx"` → `specs/{issue}-{slug}.mdx`

Spec includes `## Breadboard` (affordance tables + wiring) + `## Slices` (vertical increments). May contain `[NEEDS CLARIFICATION]` markers (max 3–5). Tier S may skip Breadboard/Slices.

### 2b. Expert Review

Same auto-select rules as 1b. Spec with impl details ⇒ always include architect.

**Pre-check ("unit tests for English"):**

| Check | Rule |
|-------|------|
| Testable criteria | Each binary (pass/fail) |
| No dangling refs | All breadboard IDs (U*/N*/S*) wired |
| Ambiguity budget | ≤5 `[NEEDS CLARIFICATION]` markers |
| Slice coverage | Every affordance in ≥1 slice |
| Edge completeness | Each edge case has handling strategy |

> Skip dangling refs + slice coverage if spec lacks `## Breadboard` ∨ `## Slices`.

≥2 checks fail ⇒ inform user before expert review. User: fix spec ∨ continue.
Spawn parallel reviewers → incorporate feedback.

### 2c. User Approval

Open the spec for review: `code specs/{issue}-{slug}.mdx`
Present a concise summary of the document: scope, key slices, acceptance criteria count, and any `[NEEDS CLARIFICATION]` markers.
AskUserQuestion: **Approve** → commit `specs/{issue}-{slug}.mdx` + Gate 2.5 | **Reject** → revise + re-review, loop.

---

## Gate 2.5: Smart Splitting (Optional)

Skip if Tier S. Read [references/smart-splitting.md](references/smart-splitting.md) for full procedure.

**Triggers:** acceptance criteria > 8 ∨ slices > 3.
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

> Analysis and spec are committed incrementally at each approval gate (1c, 2c). No final bulk commit needed.

1. Inform: "Bootstrap complete. Run `/scaffold --spec <N>` to execute."
   Gate 2.5 sub-issues ⇒ "Run `/scaffold --issue <N>` for each sub-issue in dependency order."

> Scaffold guard: unresolved `[NEEDS CLARIFICATION]` markers block scaffold. Remind user.

¬scaffold. ¬PR. Bootstrap stops at approved spec.

## Edge Cases

Read [references/edge-cases.md](references/edge-cases.md).

$ARGUMENTS
