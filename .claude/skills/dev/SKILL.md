---
name: dev
argument-hint: '[#N | "idea" | --from <step>]'
description: Workflow orchestrator — single entry point for the full dev lifecycle. Triggers: "dev" | "start working on" | "work on issue" | "develop".
allowed-tools: Bash, AskUserQuestion, Read, Write, Edit, Glob, Grep, Task, Skill
---

# Dev

Let:
  N    := issue number
  slug := kebab-case title slug
  τ    := tier (S | F-lite | F-full)
  Σ    := state map (step → bool)
  S*   := next step to execute

Single entry point for the full dev lifecycle. Scans artifacts → detects state → shows progress → delegates to step skill → loops.
¬rewrites logic of step skills. ¬auto-advances phases. AskUserQuestion at each gate.

## Entry

```
/dev #42             → resume/start from issue number
/dev "dark mode"     → find or create issue, then start
/dev #42 --from spec → jump to specific step (warn if deps missing)
```

**Deprecated aliases (emit notice + redirect):**
```
/bootstrap "idea"     → /dev "idea"
/bootstrap --issue N  → /dev #N
/bootstrap --spec N   → /dev #N --from spec
/scaffold --spec N    → /dev #N --from plan
/scaffold --issue N   → /dev #N --from plan
```

∀ deprecated alias ⇒ output: "Warning: /{alias} is deprecated. Use /dev instead." then proceed.

## Step 0 — Parse Input

`#N` ⇒ fetch issue:
```bash
gh issue view N --json number,title,labels,state
```
¬∃ issue ⇒ AskUserQuestion: **Create issue** | **Proceed without issue** (frame-only mode).

Free text ⇒ slug from text. Search for matching issue:
```bash
gh issue list --search "{text}" --json number,title,state --jq '.[:3]'
```
∃ match ⇒ AskUserQuestion: **Use #{N}: {title}** | **Create new issue** | **Proceed without issue**.

`--from <step>` ⇒ record override. Warn if prerequisite artifacts missing.

## Step 1 — Scan State (parallel, &lt;3s)

Run all checks in parallel via Bash:

```bash
# Issue
gh issue view N --json state 2>/dev/null && echo "triage=true"

# Frame
ls artifacts/frames/ 2>/dev/null | grep -i "{slug}"

# Analysis
ls artifacts/analyses/ 2>/dev/null | grep -E "^{N}-|{slug}"

# Spec
ls artifacts/specs/ 2>/dev/null | grep "^{N}-"

# Plan
ls artifacts/plans/ 2>/dev/null | grep "^{N}-"

# Worktree
git worktree list | grep "roxabi-{N}"

# Branch
git branch -a | grep "{N}-{slug}"

# PR
gh pr list --search "#{N}" --json number,state,reviewDecision,merged --jq '.[]'
```

Read frontmatter of φ (frame) if ∃ → extract `status`, `tier`.

Σ = {
  triage:    issue ∃,
  frame:     φ ∃ ∧ φ.status == 'approved',
  analyze:   analysis artifact ∃,
  spec:      spec artifact ∃,
  plan:      plan artifact ∃,
  implement: worktree ∃ ∧ branch has commits beyond staging,
  pr:        PR ∃,
  validate:  null,         # always re-run
  review:    PR ∃ ∧ PR.reviewDecision ∈ ('APPROVED','CHANGES_REQUESTED'),
  fix:       PR ∃ ∧ ¬open_review_threads(PR),
  promote:   PR.merged,
  cleanup:   ¬worktree ∃ ∧ ¬stale_branch ∃,
}

τ = φ.tier || issue_size_label_to_tier(issue.labels) || null

## Step 2 — Determine Tier

τ already set ⇒ skip.
¬τ ⇒ AskUserQuestion: **S** (≤3 files, no arch) | **F-lite** (clear scope, 1 domain) | **F-full** (complex, multi-domain).

## Step 3 — Progress Display

Render progress bar to user:

```
## {title} (#{N})  [{τ}]

  Frame    {bar}  {step statuses}
  Shape    {bar}  {step statuses}
  Build    {bar}  {step statuses}
  Verify   {bar}  {step statuses}
  Ship     {bar}  {step statuses}

→ Next: {S*} — {one-line description}
```

Bar: `██` per completed/skipped step, `░░` per pending. Phase steps:
- Frame:  triage, frame
- Shape:  analyze, spec
- Build:  plan, implement, pr
- Verify: validate, review, fix
- Ship:   promote, cleanup

Step status: `✓ {name}` (done) | `skipped` | `pending` | `→ next`.

## Step 4 — Skip Logic

```
should_skip(step, τ, Σ):
  triage   ∧ Σ.triage                    → skip (already done)
  frame    ∧ τ == S                       → skip
  analyze  ∧ τ ∈ {S, F-lite}             → skip (frame sufficient)
  spec     ∧ τ == S                       → skip
  plan     ∧ τ == S                       → skip
  fix      ∧ Σ.fix                        → skip (no open findings)
  promote  ∧ ¬needs_release()             → skip (already merged ∨ S-tier no tag needed)
  cleanup  ∧ ¬has_stale(N)               → skip
  default                                 → false
```

`--from <step>` ⇒ force-mark all prior steps as skipped for this run (warn user once).

## Step 5 — Walk Steps + Find Next

```
STEPS = [
  (Frame,  triage,    issue-triage),
  (Frame,  frame,     frame),
  (Shape,  analyze,   analyze),
  (Shape,  spec,      spec),
  (Build,  plan,      plan),
  (Build,  implement, implement),
  (Build,  pr,        pr),
  (Verify, validate,  validate),
  (Verify, review,    review),
  (Verify, fix,       fix),
  (Ship,   promote,   promote),
  (Ship,   cleanup,   cleanup),
]
```

Walk STEPS:
- Σ[step] == true ∨ should_skip(step) ⇒ mark done/skipped, continue
- First non-done, non-skipped ⇒ S* = step, stop walk

∀ steps done ⇒ display completion banner, exit loop.

## Step 6 — Gate Check

Before invoking S*, check if arriving at a gate:

| Gate trigger | Behavior |
|-------------|----------|
| S* == frame (Σ.triage && ¬Σ.frame) | Show frame doc if ∃ draft, ask approval |
| S* == spec (Σ.frame && ¬Σ.spec) | Will gate after spec runs |
| S* == plan (Σ.spec && ¬Σ.plan) | Will gate after plan runs |
| S* == pr (Σ.implement && ¬Σ.pr) | Confirm ready for PR |
| S* == review | Post-review gate handled inside /review |

## Step 7 — AskUserQuestion Loop

AskUserQuestion:
- **Continue → {S*}** ({one-line description})
- **Skip to...** → {list of remaining non-skipped steps}
- **Stop** → save progress (artifacts persist), exit

**Continue** ⇒ invoke step skill:
```
skill: "{S*}", args: "--issue N {any extra args}"
```

∀ step skills receive `--issue N` ∧ relevant artifact paths as context where applicable.

**Skip to X** ⇒ warn if prerequisite artifacts for X are missing, then confirm:
AskUserQuestion: **Proceed anyway** | **Cancel skip**.
Proceed ⇒ mark all steps before X as skipped for this run, set S* = X, loop to Step 7.

**Stop** ⇒ inform: "Stopped at {S*}. Run `/dev #N` to resume from this point."

## Step 8 — Post-skill Re-scan

After skill completes → goto Step 1 (re-scan artifacts).
Gates (frame, spec, plan, post-implement) ⇒ re-scan will detect updated artifact state → show updated progress → loop.
¬auto-advance past a phase gate without AskUserQuestion.

## Phases + Gate Summary

| Phase | Steps | Gate after |
|-------|-------|-----------|
| Frame | triage → frame | frame approval (status: approved) |
| Shape | analyze → spec | spec approval |
| Build | plan → implement → pr | plan approval; post-implement confirm |
| Verify | validate → review → fix | post-review: fix/merge/stop |
| Ship | promote → cleanup | — (auto-advance within Ship) |

## Tier Skip Matrix

| Step | S | F-lite | F-full |
|------|---|--------|--------|
| triage | run | run | run |
| frame | skip | run + gate | run + gate |
| analyze | skip | skip | run |
| spec | skip | run + gate | run + gate |
| plan | skip | run + gate | run + gate |
| implement | run | run | run |
| pr | run | run | run |
| validate | run | run | run |
| review | run | run | run |
| fix | cond | cond | cond |
| promote | cond | cond | cond |
| cleanup | cond | cond | cond |

cond = run only if applicable (see skip logic).

## Completion

All steps done/skipped ⇒

```
## Done — {title} (#{N})

  Frame    ██████████  ✓
  Shape    ██████████  ✓ (analyze skipped)
  Build    ██████████  ✓
  Verify   ██████████  ✓
  Ship     ██████████  ✓

Issue #{N} closed. Worktree cleaned up.
```

## Edge Cases

- Session dies mid-step → re-run `/dev #N`. Re-scan detects partial state. If artifact was half-written, step skill handles it (checks ∃ + status).
- `--from <step>` with missing deps → warn once: "Step X normally requires {dep artifact}. Proceeding anyway may produce incomplete output." AskUserQuestion: **Proceed** | **Cancel**.
- Issue ¬exists + free text → proceed in frame-only mode. After frame approved, AskUserQuestion: **Create GitHub issue now** | **Continue without issue**.
- S* == validate → always re-run even if previously passed (validate: null in Σ).
- Multiple open PRs for same issue → show list, AskUserQuestion: select which PR to track.
- Deprecated `/bootstrap` ∨ `/scaffold` input → emit deprecation notice, then map to equivalent `/dev` entry and proceed.

$ARGUMENTS
