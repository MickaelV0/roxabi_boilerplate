---
argument-hint: '["idea" | --issue <N> | --spec <N>]'
description: This skill should be used when the user wants to bootstrap a feature, plan a feature, start a new feature from an idea, or create an analysis and spec. Triggers include "bootstrap avatar upload", "plan feature", "start feature", "I have an idea for", "create a spec from issue", and "/bootstrap --issue 42". Orchestrates from raw idea to approved spec through two validation gates.
allowed-tools: Bash, AskUserQuestion, Read, Write, Edit, Glob, Grep, Task
---

# Bootstrap

Orchestrate the planning pipeline from a raw idea (or existing issue/spec) to an approved spec. You drive the interviews and write documents directly — no team spawn needed. You may spawn expert reviewers (via `Task`) to review analyses and specs before user approval. Enforces two user-approval gates. Stops at the approved spec — execution is handled by `/scaffold`.

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
| `--spec N` | Gate 2 (Spec) | Assumes spec exists at `docs/specs/N-*.mdx`, validates and approves |

## Instructions

### Step 0 -- Parse Arguments and Determine Entry Point

Parse the arguments to determine the entry point:

1. **If bare text** (e.g., `"avatar upload"`): Start at **Gate 1**. The text is the idea seed.
2. **If `--issue N`**: Start at **Gate 1**. Fetch the issue body with `gh issue view N` for starting context.
3. **If `--spec N`**: Start at **Gate 2**. Look for `docs/specs/N-*.mdx` using Glob. If not found, inform the user and suggest starting from scratch with `/bootstrap "idea"` or `/bootstrap --issue N`.

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
docs/analyses/*   -- existing analyses (match by issue number or slug keywords)
docs/specs/*      -- existing specs (match by issue number or slug keywords)
```

Use **Glob** to search for files matching the topic. For `--issue N`, also match by issue number prefix (e.g., `docs/analyses/N-*.mdx`, `docs/specs/N-*.mdx`).

**If a spec already exists** and the entry point is Gate 1: present the existing spec to the user via **AskUserQuestion** and ask whether to reuse it (skip to Gate 2) or start fresh. Do not silently skip.

**If an analysis already exists** and the entry point is Gate 1: present the existing analysis to the user via **AskUserQuestion** and ask whether to reuse it or start fresh. Do not silently skip.

---

## How It Works (No Team — Direct Orchestration)

You (the bootstrap orchestrator) drive the entire pipeline yourself:

- **You** conduct interviews with the user via `/interview` skill (which uses `AskUserQuestion`)
- **You** write analysis and spec documents
- **You** spawn **expert reviewers** via `Task` before each user-approval gate (configurable per document)
- **You** present gates to the user via `AskUserQuestion`

**Do NOT use `TeamCreate`.**

---

## Gate 1: Analysis

> Skipped when using `--spec`.

### 1a. Generate or Locate Analysis

- **If an analysis already exists** (found in Step 1): read it and present it to the user.
- **If no analysis exists**: conduct a structured interview with the user (using `/interview` in Analysis mode) to produce `docs/analyses/{slug}.mdx`.
  - If you need domain expertise during writing, spawn the relevant expert subagent via `Task` (see [Expert Consultation](#expert-consultation-on-demand)).

### 1b. Expert Review

After generating the analysis, **you decide** which expert reviewers to spawn based on the document content. Do NOT ask the user — apply these rules automatically:

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
  prompt: "Review this analysis document for <focus area>. Return feedback as bullet points: what's good, what needs improvement, and any concerns. Document path: docs/analyses/{slug}.mdx"
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

### 1.5a. Detect Uncertainty Signals

Read the approved analysis and check for uncertainty signals:

- **Explicit uncertainty markers:** "needs testing", "unclear if", "to be validated", "unknown performance", "requires investigation", trade-off sections without a concluded decision
- **Multiple competing approaches:** 2+ approaches listed without a clear winner, or a recommendation "pending validation"
- **External dependency risk:** Reliance on a third-party API, library, or service not yet tested in this project

If no signals detected → skip to "Ensure GitHub Issue."

### 1.5b. User Confirmation

If signals are detected, present via `AskUserQuestion`:

> "The analysis contains technical uncertainty: {detected signals summary}. Would you like to investigate before writing the spec?"

Options:
- **Investigate** — Spike the uncertain areas before speccing
- **Skip to spec** — Proceed directly to Gate 2

If user skips → skip to "Ensure GitHub Issue." No spike worktree or branch is created.

### 1.5c. Define Scope

Draft investigation question(s) and done criteria (success and failure conditions). Present to user via `AskUserQuestion` for confirmation before the spike begins.

**Example:**

```
Question: "Can sqlite-vec run on Bun/WSL2 with acceptable query latency?"

Done criteria:
- Success: sqlite-vec installs, 10k vector queries complete in <50ms
- Failure: sqlite-vec fails to install on Bun, or query latency >500ms
```

### 1.5d. Execute Spike

1. Create spike branch and install dependencies:
   ```bash
   # Bare-text bootstrap (no issue number yet):
   git worktree add ../roxabi-spike-{slug} -b spike/{slug} staging
   cd ../roxabi-spike-{slug} && bun install

   # --issue N bootstrap (issue number available):
   git worktree add ../roxabi-spike-XXX -b spike/XXX-{slug} staging
   cd ../roxabi-spike-XXX && bun install
   ```

   No `db:branch:create` is needed — spikes are for feasibility testing, not full feature development.

2. Spawn the appropriate domain expert subagent(s) via the `Task` tool:

   > **Important:** The investigation question and done criteria passed to the subagent must be orchestrator-authored text confirmed by the user in step 1.5c. Do not interpolate raw analysis content into the prompt — the subagent reads the analysis file independently via the provided path.

   | Uncertainty domain | Subagent |
   |-------------------|----------|
   | Architecture, feasibility, library evaluation | `architect` |
   | Backend API, database, ORM | `backend-dev` |
   | Frontend rendering, UI library, browser APIs | `frontend-dev` |
   | CI/CD, deployment, infrastructure | `devops` |
   | Cross-cutting or unclear | `architect` (default) |

   **Subagent prompt template:**

   ```
   You are investigating a technical question for the bootstrap pipeline.

   **Analysis document:** {path to analysis}
   **Working directory:** {spike worktree path}

   ## Investigation Question

   {question text}

   ## Done Criteria

   - **Success:** {success conditions}
   - **Failure:** {failure conditions}

   ## Instructions

   1. Read the analysis document for full context.
   2. Work in the spike worktree to test the approach.
   3. If the initial approach FAILS the done criteria, pivot to alternative
      approaches listed in the analysis. Do NOT invent new approaches.
   4. **Self-monitoring:** If you reach 15 tool calls without meeting done
      criteria, STOP and return your partial findings immediately.
   5. Report findings using this structure:

      **Approach tested:** {what you tested}
      **Result:** Success | Failure | Partial
      **Findings:** (bullet points with key observations, data, errors)
      **Recommendation:** {what this means for the spec}

   If you tested multiple approaches, report each separately.
   ```

> **Note:** Self-monitoring is best-effort — subagents may occasionally exceed 15 tool calls. The instruction provides a reliable soft limit, not a hard cutoff.

3. For cross-domain investigations, spawn parallel subagents (one per domain) and merge findings into sub-headings per question.

### 1.5e. Review Findings

**Partial findings guard:** If the subagent returned `Result: Partial` (hit the 15-turn self-monitoring limit), present a continuation prompt via `AskUserQuestion` before the standard review:

> "The investigation returned partial findings (subagent reached the 15-turn limit). How would you like to proceed?"

Options:
- **Continue investigation** — Spawn a new subagent to pick up where the previous one left off
- **Accept partial findings** — Proceed to review with what we have

If the user chooses "Continue investigation," spawn a new subagent with the same prompt template plus a summary of prior partial findings. Then return to this step with the new results. If the user accepts, proceed to the review flow below.

Present findings to user via `AskUserQuestion`:

> "Investigation findings for: {question}
> Result: {Success | Failure | Partial}
>
> Key findings:
> - {finding 1}
> - {finding 2}
>
> Recommendation: {what this means for the spec}"

Options:
- **Approve findings** — Append to analysis as-is
- **Edit findings** — Collect user corrections (text only, not re-investigation), re-present for final approval. This is a text-correction loop only — do not re-run expert review or re-enter Gate 1.
- **Discard findings** — Proceed without appending

### 1.5f. Append and Cleanup

1. Append approved findings to the analysis document using this template:

   ```mdx
   ## Investigation Findings

   > Investigation conducted on {YYYY-MM-DD} by {subagent_type} subagent.
   > Branch: `{spike branch name}` (deleted after findings extraction).

   ### Question 1: {investigation question}

   **Approach tested:** {what was tested}

   **Result:** {Success | Failure | Partial}

   **Findings:**
   - {Key finding 1}
   - {Key finding 2}
   - {Performance data, compatibility notes, etc.}

   **Recommendation:** {What this means for the spec}
   ```

2. No `meta.json` update needed — findings are appended to the existing analysis in place.

3. **Guard:** Verify findings were written (analysis contains "## Investigation Findings" with at least one `**Approach tested:**` entry below the heading).

4. **If guard passes:** Delete spike branch and worktree:
   ```bash
   # Bare-text bootstrap:
   git worktree remove ../roxabi-spike-{slug}
   git branch -D spike/{slug}

   # --issue N bootstrap:
   git worktree remove ../roxabi-spike-XXX
   git branch -D spike/XXX-{slug}
   ```

   > Use the same branch name and worktree path chosen in step 1.5d. `git branch -D` is pre-approved for throwaway spike branches.

5. **If guard fails:** Preserve the spike branch and worktree. Inform the user that findings were not successfully written and they can manually extract findings or retry.

6. **If all approaches failed** → present via `AskUserQuestion`:

   > "Investigation found all approaches infeasible. Findings have been appended to the analysis. How would you like to proceed?"

   Options:
   - **Revise analysis** — Return to Gate 1 with new direction
   - **Proceed to spec anyway** — Accept the risk and write the spec with current findings
   - **Abandon** — Stop the bootstrap pipeline

   **"Revise analysis"** re-enters the Gate 1a → 1b → 1c cycle. The user provides new direction, the orchestrator revises the analysis (keeping investigation findings as evidence), re-runs expert review, and re-presents for approval. After re-approval, the pipeline proceeds normally (and may trigger investigation again if new uncertainties are present).

7. Continue to "Ensure GitHub Issue."

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
- Spec filename: `docs/specs/{issue}-{slug}.mdx`
- Issue status transitions (Gate 1 → Analysis, Gate 2 → Specs)
- Downstream `/scaffold` linking

---

## Gate 2: Spec

### 2a. Generate or Locate Spec

- **If a spec already exists** (found in Step 1, or entry point is `--spec N`): read it and present it to the user.
- **If no spec exists**: promote the approved analysis to a spec (using `/interview` with `--promote <path-to-analysis>`) to produce `docs/specs/{issue}-{slug}.mdx`.
  - If you need domain expertise during writing, spawn the relevant expert subagent via `Task` (see [Expert Consultation](#expert-consultation-on-demand)).

### 2b. Expert Review

After generating the spec, **you decide** which expert reviewers to spawn — same auto-selection rules as Gate 1b. Do NOT ask the user.

Apply the same reviewer table (always **doc-writer** + **product-lead**, add **architect** / **devops** when their domain is present in the spec). Specs with implementation details should always include **architect**.

Spawn selected reviewers **in parallel** via `Task`. Each reviewer receives the spec path and reviews from their focus area. Incorporate feedback and note unresolved concerns.

### 2c. User Approval

Present the spec (with expert feedback summary) to the user via **AskUserQuestion**:

> "Here is the spec, reviewed by {reviewer list}. Key expert feedback: {summary}. Please review."

Options:
- **Approve** -- Bootstrap complete, proceed to completion
- **Reject** -- Provide feedback and re-enter Gate 2

**If rejected:** Collect user feedback, revise the spec (re-run expert review if substantial changes). Re-present for approval. Do not proceed until approved.

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
.claude/skills/issue-triage/triage.sh set <ISSUE_NUMBER> --status Analysis

# Gate 2 → Specs
.claude/skills/issue-triage/triage.sh set <ISSUE_NUMBER> --status Specs
```

**When to update:** (an issue is always available — see [Ensure GitHub Issue](#ensure-github-issue-between-gate-1-and-gate-2))
- Gate 1 → set to "Analysis"
- Gate 2 → set to "Specs"

## Completion

Once both gates are passed:

1. **Update `meta.json` and `index.mdx`** for each new document:

   For each new analysis (`docs/analyses/<slug>.mdx`):
   - Add `"<slug>"` to `docs/analyses/meta.json` → `pages` array
   - Add a link entry to `docs/analyses/index.mdx` under the appropriate category section

   For each new spec (`docs/specs/<issue>-<slug>.mdx`):
   - Add `"<issue>-<slug>"` to `docs/specs/meta.json` → `pages` array
   - Add a link entry to `docs/specs/index.mdx` under the appropriate category section

   Follow the existing format in each file. Place new entries in a logical position within their category.

2. **Commit** all documents together:
   ```bash
   git add docs/analyses/<slug>.mdx docs/analyses/meta.json docs/analyses/index.mdx \
           docs/specs/<issue>-<slug>.mdx docs/specs/meta.json docs/specs/index.mdx
   git commit -m "$(cat <<'EOF'
   docs(<scope>): add analysis and spec for <feature>

   Refs #<issue_number>

   Co-Authored-By: Claude <model> <noreply@anthropic.com>
   EOF
   )"
   ```
   Only include the files that were actually created or modified (e.g., if only an analysis was produced, omit the spec files).

3. **Inform the user:**

> "Bootstrap complete. You have an approved analysis and spec (committed). Run `/scaffold --spec <N>` to execute."

**Do not scaffold or create PRs.** Bootstrap stops at the approved spec.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Issue already has a spec | Skip Gate 1, present existing spec at Gate 2 for validation |
| Issue already has an analysis | Skip analysis generation, present existing analysis at Gate 1 for validation |
| User rejects at any gate | Stop, collect feedback, re-enter the same gate |
| `--spec N` but no spec found | Inform user: "No spec found matching issue #N. Try `/bootstrap --issue N` or `/bootstrap 'your idea'` to start from scratch." |
| Analysis exists but is a brainstorm | Treat as "no analysis" -- promote brainstorm to analysis |
| Expert reviewer subagent fails | Report the error to the user and continue without that expert's review |
| Bare text entry, no existing issue | Create a GitHub issue from the approved analysis before entering Gate 2 |
| Issue already has a branch or open PR | Stop and propose `/review` or `/scaffold` instead (Step 0b) |

## Skill Invocation Reference

You use the `/interview` skill directly:

| Sub-skill | Invocation | When |
|-----------|------------|------|
| `/interview` (Analysis) | `skill: "interview", args: "topic text"` | Gate 1, no existing analysis |
| `/interview` (Spec promotion) | `skill: "interview", args: "--promote docs/analyses/{slug}.mdx"` | Gate 2, no existing spec |

## Expert Consultation (On-Demand)

### During Document Writing

When you need domain expertise while writing the analysis or spec, spawn the relevant expert subagent:

```
Task(
  description: "Expert consultation - <topic>",
  subagent_type: "architect" | "doc-writer" | "devops" | "product-lead",
  prompt: "Research and answer: <specific question>. Return findings as bullet points."
)
```

| Expert | Use for |
|--------|---------|
| **architect** | Trade-off analysis, feasibility checks, architecture decisions, integration concerns |
| **doc-writer** | Document structure advice, MDX conventions, clarity feedback |
| **devops** | CI/CD feasibility, deployment strategy, infrastructure requirements |
| **product-lead** | Product fit, acceptance criteria, user story validation |

Do NOT spawn experts upfront — only when a specific question arises during writing.

### At Review Gates (1b, 2b)

Expert review at gates is auto-selected by you based on document content (see Gate 1b and Gate 2b above). Spawn all selected reviewers in parallel for maximum speed.

$ARGUMENTS
