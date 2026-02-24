---
name: bootstrap
argument-hint: '["idea" | --issue <N> | --spec <N>]'
description: Idea→approved spec pipeline (analysis + spec + 2 approval gates). Triggers: "bootstrap" | "plan feature" | "start feature" | "I have an idea" | "spec from issue".
allowed-tools: Bash, AskUserQuestion, Read, Write, Edit, Glob, Grep, Task
---

# Bootstrap

Orchestrate the planning pipeline from a raw idea (or existing issue/spec) to an approved spec. Drive interviews and write documents directly — no team spawn needed. Spawn expert reviewers (via `Task`) to review analyses and specs before user approval. Enforce two user-approval gates. Stop at the approved spec — execution is handled by `/scaffold`.

## Entry Points

```
/bootstrap "avatar upload"          Start from scratch (idea)
/bootstrap --issue 42               Start from existing GitHub issue
/bootstrap --spec 42                Start from existing spec (skip to plan)
```

| Flag | Starts at | Behavior |
|------|-----------|----------|
| `"idea text"` | Gate 1 (Analysis) | Full pipeline from scratch |
| `--issue N` | Gate 1 (Analysis) | Reads GitHub issue body as starting context |
| `--spec N` | Gate 2 (Spec) | Assumes spec exists at `specs/N-*.mdx`, validates and approves |

## Instructions

### Step 0 -- Parse Arguments and Determine Entry Point

Parse the arguments to determine the entry point:

1. **If bare text** (e.g., `"avatar upload"`): Start at **Gate 1**. The text is the idea seed.
2. **If `--issue N`**: Start at **Gate 1**. Fetch the issue body with `gh issue view N` for starting context.
3. **If `--spec N`**: Start at **Gate 2**. Look for `specs/N-*.mdx` using Glob. If not found, inform the user and suggest starting from scratch with `/bootstrap "idea"` or `/bootstrap --issue N`.

### Step 0b -- Check for Existing Branch / PR

When using `--issue N`, check if the issue already has a branch or open PR **before** proceeding:

```bash
gh pr list --search "N" --json number,title,state,headRefName --jq '.[] | select(.state=="OPEN")'
```

Also check for linked branches via the issue timeline:

```bash
gh api repos/:owner/:repo/issues/N/timeline --jq '.[] | select(.event=="cross-referenced") | .source.issue | select(.pull_request) | {number, title, state}'
```

**If an open PR or branch exists**, stop and present to the user via **AskUserQuestion**:

> "Issue #N already has an open PR: #P (`branch-name`) — `PR title`. Bootstrap is for planning (analysis → spec → plan). This issue appears to already be in progress."

Options:
- **Switch to `/review`** — Review the existing PR instead
- **Switch to `/scaffold`** — Continue implementation work from the existing branch
- **Continue bootstrap anyway** — Proceed with the planning pipeline regardless (e.g., to create missing docs)

**Do not proceed with Gate 1 unless the user explicitly chooses "Continue bootstrap anyway".**

---

### Step 1 -- Scan for Existing Documents

Before starting any gate, check what already exists:

```
analyses/*   -- existing analyses (match by issue number or slug keywords)
specs/*      -- existing specs (match by issue number or slug keywords)
```

Use **Glob** to search for files matching the topic. For `--issue N`, also match by issue number prefix (e.g., `analyses/N-*.mdx`, `specs/N-*.mdx`).

**If a spec already exists** and the entry point is Gate 1: present the existing spec to the user via **AskUserQuestion** and ask whether to reuse it (skip to Gate 2) or start fresh. Do not silently skip.

**If an analysis already exists** and the entry point is Gate 1: present the existing analysis to the user via **AskUserQuestion** and ask whether to reuse it or start fresh. Do not silently skip.

---

### Step 1a -- Complexity Scoring

Skip this step when using `--spec N` (tier was already determined when the spec was created).

Before choosing a tier, score the issue/idea on a 1-10 complexity scale. This informs (but does not dictate) the tier decision.

**Factors (each scored 1-10):**

| Factor | Weight | 1 (Low) | 5 (Medium) | 10 (High) |
|--------|--------|---------|------------|-----------|
| **Files touched** | 20% | 1-3 files | 5-10 files | 15+ files |
| **Technical risk** | 25% | Known patterns, no new tech | New library/pattern in 1 domain | New architecture, untested approach |
| **Architectural impact** | 25% | Single module, no exports | Shared types or 2 modules | Cross-domain, new abstractions |
| **Unknowns count** | 15% | 0 unknowns, fully documented | 1-2 open questions | 3+ unknowns, needs investigation |
| **Domain breadth** | 15% | 1 domain (FE or BE only) | 2 domains (FE + BE) | 3+ domains (FE + BE + infra) |

**Calculate:** `complexity = round(files × 0.20 + risk × 0.25 + arch × 0.25 + unknowns × 0.15 + domains × 0.15)`

**Tier mapping:**

| Score | Tier | Process | Agent Mode |
|-------|------|---------|-----------|
| 1-3 | **S** | Worktree + direct implementation + PR | Single session, no agents |
| 4-6 | **F-lite** | Worktree + subagents + /review | Task subagents (1-2 domain + tester) |
| 7-10 | **F-full** | Bootstrap + worktree + agent team + /review | Task subagents (3+ agents, test-first) |

**Important:** The score is a guide, not a gate. Human judgment overrides. A score of 6 may be F-lite (clear mechanical changes) or F-full (design decisions needed). Present the score and recommended tier to the user via `AskUserQuestion` for validation.

**AskUserQuestion options:**
- **Confirm {tier}** -- "Proceed with {tier} (score: {N}/10)"
- **Override to S** -- "Downgrade to Tier S (quick fix)"
- **Override to F-lite** -- "Use Tier F-lite (feature lite)"
- **Override to F-full** -- "Upgrade to Tier F-full (full bootstrap)"

Reference: [analyses/280-token-consumption.mdx](../../../analyses/280-token-consumption.mdx) for scoring examples and full rubric details.

---

## How It Works (No Team — Direct Orchestration)

The bootstrap orchestrator drives the entire pipeline directly:

- Conduct interviews with the user via `/interview` skill (which uses `AskUserQuestion`)
- Write analysis and spec documents
- Spawn **expert reviewers** via `Task` before each user-approval gate (configurable per document)
- Present gates to the user via `AskUserQuestion`

**Do NOT use `TeamCreate`.**

---

## Gate 1: Analysis

> Skipped when using `--spec`.

### 1a. Generate or Locate Analysis

- **If an analysis already exists** (found in Step 1): read it and present it to the user.
- **If no analysis exists**: conduct a structured interview with the user (using `/interview` in Analysis mode) to produce `analyses/{slug}.mdx`.
  - If domain expertise is needed during writing, spawn the relevant expert subagent via `Task` (see [Expert Consultation](#expert-consultation)).

> **Shaping patterns:** The interview skill now explores multi-shape architecture approaches (2-3 mutually exclusive shapes) during Phase 3 depth questions. The resulting analysis should include `## Shapes` and `## Fit Check` sections. These are populated from the interview — no separate step is needed. For Tier S, shapes and fit check may be skipped.

### 1b. Expert Review

After generating the analysis, decide which expert reviewers to spawn based on the document content. Do NOT ask the user — apply these rules automatically:

| Reviewer | Auto-select when | Focus area |
|----------|-----------------|------------|
| **doc-writer** | **Always** | Document structure, clarity, completeness |
| **product-lead** | **Always** | Product fit, acceptance criteria quality |
| **architect** | Analysis contains architecture decisions, trade-offs, multi-domain concerns, or new patterns | Technical soundness, feasibility |
| **devops** | Analysis mentions CI/CD, deployment, infrastructure, or environment config | Infra feasibility, operational impact |

**Selection logic:** Read the analysis content. Always include **doc-writer** and **product-lead**. Add other reviewers only when their domain is clearly present. When in doubt, include the reviewer — an extra review is cheap.

**For each selected reviewer**, spawn a subagent via the `Task` tool:

```
Task(
  description: "Review analysis - <reviewer>",
  subagent_type: "<reviewer>",  // e.g., "architect", "doc-writer", "product-lead"
  prompt: "Review this analysis document for <focus area>. Return feedback as bullet points: what's good, what needs improvement, and any concerns. Document path: analyses/{slug}.mdx"
)
```

Spawn all selected reviewers **in parallel** (multiple Task calls in a single message). Collect their feedback, incorporate improvements into the analysis, and note any unresolved concerns for the user.

### 1c. User Approval

Present the analysis (with expert feedback summary) to the user via **AskUserQuestion**:

> "Here is the analysis, reviewed by {reviewer list}. Key expert feedback: {summary}. Please review."

Options:
- **Approve** -- Proceed to Gate 2 (Spec)
- **Reject** -- Provide feedback and re-enter Gate 1

**If rejected:** Collect user feedback, revise the analysis (re-run expert review if the changes are substantial). Re-present for approval. Do not proceed until approved.

---

## Gate 1.5: Investigation (Optional)

> Runs only after Gate 1 approval. Skipped when using `--spec`.

When the approved analysis contains technical uncertainty (explicit markers like "needs testing", competing approaches without a clear winner, or untested external dependencies), offer the user an optional investigation spike before writing the spec.

**Steps:** Detect signals → User confirms → Define scope → Execute spike on throwaway branch → Review findings → Append to analysis and cleanup.

For the full procedure (steps 1.5a–1.5f), see [references/investigation.md](references/investigation.md).

If no signals are detected, skip directly to "Ensure GitHub Issue."

---

## Ensure GitHub Issue (Between Gate 1 and Gate 2)

A GitHub issue is **required** before creating a spec (specs use the `{issue}-{slug}.mdx` naming pattern). After Gate 1 approval and before entering Gate 2, ensure an issue exists:

### When an issue already exists

- **`--issue N` entry point**: Issue already exists — use N.
- **Bare text entry point with existing issue found** (e.g., discovered during Step 1 scan): use that issue number.

### When no issue exists

If the bootstrap was started from bare text and no matching issue was found:

1. **Draft the issue** from the approved analysis:
   - **Title**: Conventional format (e.g., `feat: avatar upload for user profiles`)
   - **Body**: Summary from the analysis + key requirements as a checklist
2. **Create the issue**:
   ```bash
   gh issue create --title "<title>" --body "<body>"
   ```
3. **Capture the issue number** from the output.
4. **Inform the user**: "Created GitHub issue #N: `<title>`"

The issue number is then used for:
- Spec filename: `specs/{issue}-{slug}.mdx`
- Issue status transitions (Gate 1 → Analysis, Gate 2 → Specs)
- Downstream `/scaffold` linking

---

## Gate 2: Spec

### 2a. Generate or Locate Spec

- **If a spec already exists** (found in Step 1, or entry point is `--spec N`): read it and present it to the user.
- **If no spec exists**: promote the approved analysis to a spec (using `/interview` with `--promote <path-to-analysis>`) to produce `specs/{issue}-{slug}.mdx`.
  - If domain expertise is needed during writing, spawn the relevant expert subagent via `Task` (see [Expert Consultation](#expert-consultation)).

> **Shaping patterns:** The spec template now includes `## Breadboard` (UI->Code->Data affordance tables with wiring) and `## Slices` (demo-able vertical increments). These are populated during spec writing from the selected shape in the analysis. The spec may also contain inline `[NEEDS CLARIFICATION: description]` markers for unresolved ambiguity (max 3-5 per spec). For Tier S, Breadboard and Slices may be skipped.

### 2b. Expert Review

After generating the spec, decide which expert reviewers to spawn — same auto-selection rules as Gate 1b. Do NOT ask the user.

Apply the same reviewer table (always **doc-writer** + **product-lead**, add **architect** / **devops** when their domain is present in the spec). Specs with implementation details should always include **architect**.

**Requirement-quality pre-check ("unit tests for English"):**

Before spawning expert reviewers, validate the spec against this checklist:

| Check | Validation |
|-------|-----------|
| **Testable criteria** | Each success criterion is binary (pass/fail), not subjective |
| **No dangling references** | All breadboard IDs (U1, N1, S1) are wired — no orphan affordances |
| **Ambiguity budget** | Max 3-5 `[NEEDS CLARIFICATION]` markers; if more, return to interview |
| **Slice coverage** | Every breadboard affordance appears in at least one slice |
| **Edge case completeness** | Each edge case has a defined handling strategy |

> **Note:** If the spec lacks `## Breadboard` or `## Slices` sections (e.g., Tier S or pre-enrichment specs), skip the "No dangling references" and "Slice coverage" checks.

If 2+ checks fail, inform the user before proceeding with expert review. The user can choose to fix the spec or continue with review as-is.

Spawn selected reviewers **in parallel** via `Task`. Each reviewer receives the spec path and reviews from their focus area. Incorporate feedback and note unresolved concerns.

### 2c. User Approval

Present the spec (with expert feedback summary) to the user via **AskUserQuestion**:

> "Here is the spec, reviewed by {reviewer list}. Key expert feedback: {summary}. Please review."

Options:
- **Approve** -- Proceed to Gate 2.5 (smart splitting) or completion
- **Reject** -- Provide feedback and re-enter Gate 2

**If rejected:** Collect user feedback, revise the spec (re-run expert review if substantial changes). Re-present for approval. Do not proceed until approved.

---

## Gate 2.5: Smart Splitting (Optional)

> Runs only after Gate 2 approval. Skipped for Tier S specs.

After spec approval, evaluate whether the feature should be decomposed into sub-issues before handoff to scaffold. Splitting is **always optional** — the user can skip it.

### 2.5a. Detect Splitting Signals

**First check:** If the tier is **S**, skip Gate 2.5 entirely. Proceed to Issue Status Transitions and Completion.

**Pre-check for existing sub-issues:**

Before evaluating splitting signals, check if the parent issue already has sub-issues:

```bash
gh api graphql -f query='{ repository(owner: "{owner}", name: "{repo}") { issue(number: {N}) { subIssues(first: 10) { nodes { number title state } } } } }'
```

**If sub-issues already exist**, present them to the user via **AskUserQuestion**:

> "Issue #{N} already has {count} sub-issues: {list}."

Options:
- **Keep existing** — Skip Gate 2.5 entirely
- **Replace** — Close existing sub-issues and create new ones
- **Add additional** — Create new sub-issues alongside existing ones

Read the approved spec and count:

1. **Acceptance criteria count:** Count `- [ ]` checkboxes in `## Success Criteria`
2. **Slice count:** Count rows in the `## Slices` table (if present)

**Trigger thresholds:** Propose splitting when ANY of:
- Acceptance criteria > 8
- Slices > 3

**If no thresholds are met:** Skip Gate 2.5 entirely. Proceed to Issue Status Transitions and Completion.

**If the spec lacks `## Slices` and `## Success Criteria`:** Skip Gate 2.5 (not enough structure to split).

### 2.5b. Propose Sub-Issues

Analyze the spec to identify natural split boundaries. Use these heuristics in order:

1. **Implementation phases** (if present): Each phase is a natural sub-issue.
2. **Vertical slices** (if present): Each slice or group of related slices is a sub-issue.
3. **Domain boundaries:** Group acceptance criteria by domain (frontend, backend, infra) into sub-issues.

For each proposed sub-issue, determine:

| Field | How to derive |
|-------|---------------|
| **Title** | Conventional format: `feat(<scope>): <phase/slice description>` |
| **Scope** | Which slices, affordances, or acceptance criteria it covers |
| **Dependencies** | Which other sub-issues must complete first (infer from slice order or phase dependencies) |
| **Estimated tier** | Score using the complexity rubric from Step 1a |
| **Size label** | XS/S/M/L/XL based on estimated tier |
| **Priority** | Inherit from parent issue. If the parent has no priority, default to Medium |

### 2.5c. Present to User

Present the proposed split via **AskUserQuestion**:

```
Smart Split Proposal: {Spec Title}
Parent issue: #{issue_number}
Trigger: {N} acceptance criteria / {N} slices / {N} phases

Proposed sub-issues:
  1. {title} — {scope summary} [Size: {S/M/L}]
     Dependencies: none
  2. {title} — {scope summary} [Size: {S/M/L}]
     Dependencies: #1
  3. {title} — {scope summary} [Size: {S/M/L}]
     Dependencies: #1
```

Options:
- **Approve** — Create sub-issues on GitHub with parent link
- **Adjust** — Modify the split (user provides feedback, re-propose)
- **Skip** — No split. Proceed with single spec → single scaffold.

### 2.5d. Create Sub-Issues

If approved, create each sub-issue using the issue-triage script:

```bash
bun .claude/skills/issue-triage/triage.ts create \
  --title "<title>" \
  --body "<body>" \
  --parent <parent_issue_number> \
  --size <XS|S|M|L|XL> \
  --priority <Urgent|High|Medium|Low>
```

**Sub-issue body template:**

```markdown
## Scope

{Which slices/affordances/criteria this sub-issue covers}

**Parent spec:** specs/{issue}-{slug}.mdx
**Parent issue:** #{parent_issue_number}

## Acceptance Criteria

{Subset of criteria from the parent spec that this sub-issue covers}

## Dependencies

{List of sibling sub-issues that must complete first, if any}
```

**Track created issue numbers:**

After each `triage.ts create` call, parse the output to capture the created issue number. The output format is: `Created #N: <title>`. Store a mapping of sub-issue title → issue number for use in dependency wiring.

After creating all sub-issues, set dependency relationships between them:

```bash
# If sub-issue #B depends on sub-issue #A
bun .claude/skills/issue-triage/triage.ts set <B> --blocked-by <A>
```

**Inform the user:**

> "Created {N} sub-issues under #{parent_issue_number}. Each can be scaffolded independently with `/scaffold --issue <N>`."

**Generate sub-specs:**

After creating all sub-issues, generate a lightweight spec file for each sub-issue so that `/scaffold --issue <N>` can find it:

```bash
# For each sub-issue:
cat > specs/{sub_issue_number}-{sub_slug}.mdx << 'SPEC_EOF'
---
title: "{sub-issue title}"
parent_spec: "specs/{parent_issue}-{parent_slug}.mdx"
parent_issue: {parent_issue_number}
---

## Scope

{Subset of slices/affordances/criteria from parent spec for this sub-issue}

## Success Criteria

{Subset of acceptance criteria from parent spec for this sub-issue}

## Reference

Full spec: [specs/{parent_issue}-{parent_slug}.mdx](../specs/{parent_issue}-{parent_slug}.mdx)
SPEC_EOF
```

These sub-specs are lightweight references to the parent spec. Scaffold uses them as entry points.

### 2.5e. Edge Cases

| Scenario | Behavior |
|----------|----------|
| Spec has phases but no slices | Split by phases |
| Spec has slices but no phases | Split by slices (group related slices if >5) |
| Spec has neither phases nor slices | Split by domain boundaries using acceptance criteria |
| Only 1 sub-issue would result | Skip split — no value in a single sub-issue |
| User adjusts then re-adjusts | Re-propose each time. No limit on adjustment rounds. |
| Sub-issue creation fails (GitHub API) | Report error, ask user to retry or skip |
| Circular dependencies detected | Reject the split proposal. Inform user: "Circular dependency detected between sub-issues. Adjust the split to remove cycles." |
| Partial sub-issue creation failure | Report which sub-issues were created and which failed. Ask user: "Retry failed creations?" or "Continue with partial split?" Already-created sub-issues are NOT rolled back. |
| Spec revised after split (stale sub-issues) | Warn user that existing sub-issues may be stale. Offer to re-run Gate 2.5 to regenerate the split. |
| All criteria tightly coupled (cannot meaningfully split) | Proactively recommend "Skip" option. Inform user: "Criteria appear tightly coupled — splitting may not add value." |

---

## Issue Status Transitions

When a GitHub issue is associated with the bootstrap pipeline, update its status on the project board at these points:

| Event | New Status | When |
|-------|-----------|------|
| Gate 1 approved (analysis done) | **Analysis** | After user approves the analysis |
| Gate 2 approved (spec done) | **Specs** | After user approves the spec |

Use the triage helper to update status. Replace `<ISSUE_NUMBER>` with the actual issue number:

```bash
# Gate 1 → Analysis
bun .claude/skills/issue-triage/triage.ts set <ISSUE_NUMBER> --status Analysis

# Gate 2 → Specs
bun .claude/skills/issue-triage/triage.ts set <ISSUE_NUMBER> --status Specs
```

**When to update:** (an issue is always available — see [Ensure GitHub Issue](#ensure-github-issue-between-gate-1-and-gate-2))
- Gate 1 → set to "Analysis"
- Gate 2 → set to "Specs"

## Completion

Once all gates are passed (Gate 1 + Gate 2 + optional Gate 2.5):

1. **Commit** all documents together:
   ```bash
   git add analyses/<slug>.mdx \
           specs/<issue>-<slug>.mdx
   git commit -m "$(cat <<'EOF'
   docs(<scope>): add analysis and spec for <feature>

   Refs #<issue_number>

   Co-Authored-By: Claude <model> <noreply@anthropic.com>
   EOF
   )"
   ```
   Only include the files that were actually created or modified (e.g., if only an analysis was produced, omit the spec files).

2. **Inform the user (plain text):**

> "Bootstrap complete. You have an approved analysis and spec (committed). Run `/scaffold --spec <N>` to execute."

If Gate 2.5 created sub-issues:

> "Bootstrap complete with {N} sub-issues created under #{parent_issue_number}. Run `/scaffold --issue <N>` for each sub-issue in dependency order. The parent spec remains as the reference document."

> **Scaffold guard:** When the user runs `/scaffold`, a pre-flight check will verify no unresolved `[NEEDS CLARIFICATION]` markers remain in the spec. Unresolved markers block scaffold execution. Remind the user to resolve any markers before scaffolding.

**Do not scaffold or create PRs.** Bootstrap stops at the approved spec.

## Edge Cases

For the full edge case table, see [references/edge-cases.md](references/edge-cases.md).

## Skill Invocation Reference

Use the `/interview` skill directly:

| Sub-skill | Invocation | When |
|-----------|------------|------|
| `/interview` (Analysis) | `skill: "interview", args: "topic text"` | Gate 1, no existing analysis |
| `/interview` (Spec promotion) | `skill: "interview", args: "--promote analyses/{slug}.mdx"` | Gate 2, no existing spec |

## Expert Consultation

For expert consultation patterns during document writing and at review gates, see [references/expert-consultation.md](references/expert-consultation.md).

$ARGUMENTS
