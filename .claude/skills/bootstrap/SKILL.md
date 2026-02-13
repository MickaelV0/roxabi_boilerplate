---
argument-hint: ["idea" | --issue <N> | --spec <N>]
description: Planning orchestrator from idea to approved spec, with two validation gates.
allowed-tools: Bash, AskUserQuestion, Read, Write, Edit, Glob, Grep, Task
---

# Bootstrap

Orchestrate the planning pipeline from a raw idea (or existing issue/spec) to an approved spec. You drive the interviews and write documents directly — no team spawn needed. You may spawn an **architect** subagent (via `Task`) on-demand when you need technical consultation. Enforces two user-approval gates. Stops at the approved spec — execution is handled by `/scaffold`.

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
- **You** present gates to the user via `AskUserQuestion`
- **You** spawn an `architect` subagent via `Task` **only when you need technical consultation** (e.g., trade-off analysis, feasibility check, architecture decisions). Do NOT spawn it upfront.

**Do NOT use `TeamCreate`. Do NOT spawn `product-lead` or `doc-writer` agents.**

---

## Gate 1: Analysis

> Skipped when using `--spec`.

### 1a. Generate or Locate Analysis

- **If an analysis already exists** (found in Step 1): read it and present it to the user.
- **If no analysis exists**: conduct a structured interview with the user (using `/interview` in Analysis mode) to produce `docs/analyses/{slug}.mdx`.
  - If you need technical depth (architecture trade-offs, feasibility, integration concerns), spawn an `architect` subagent via `Task` to research the question and return findings. Use those findings to enrich the analysis.

### 1b. User Approval

Present the analysis to the user via **AskUserQuestion**:

> "Here is the analysis. Please review it."

Options:
- **Approve** -- Proceed to Gate 2 (Spec)
- **Reject** -- Provide feedback and re-enter Gate 1

**If rejected:** Collect user feedback, revise the analysis (spawn architect via `Task` if the feedback requires technical research). Re-present for approval. Do not proceed until approved.

---

## Gate 2: Spec

### 2a. Generate or Locate Spec

- **If a spec already exists** (found in Step 1, or entry point is `--spec N`): read it and present it to the user.
- **If no spec exists**: promote the approved analysis to a spec (using `/interview` with `--promote <path-to-analysis>`) to produce `docs/specs/{issue}-{slug}.mdx`.
  - If you need technical consultation for implementation strategy, spawn an `architect` subagent via `Task`.

### 2b. User Approval

Present the spec to the user via **AskUserQuestion**:

> "Here is the spec. Please review it."

Options:
- **Approve** -- Bootstrap complete, proceed to completion
- **Reject** -- Provide feedback and re-enter Gate 2

**If rejected:** Collect user feedback, revise the spec (spawn architect if needed). Re-present for approval. Do not proceed until approved.

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

**When to update:**
- Only update if a GitHub issue is associated (skip if no issue number exists)
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
| Architect subagent fails | Report the error to the user and continue without technical consultation |
| Issue already has a branch or open PR | Stop and propose `/review` or `/scaffold` instead (Step 0b) |

## Skill Invocation Reference

You use the `/interview` skill directly:

| Sub-skill | Invocation | When |
|-----------|------------|------|
| `/interview` (Analysis) | `skill: "interview", args: "topic text"` | Gate 1, no existing analysis |
| `/interview` (Spec promotion) | `skill: "interview", args: "--promote docs/analyses/{slug}.mdx"` | Gate 2, no existing spec |

## Architect Consultation (On-Demand Only)

When you need technical depth during analysis or spec writing, spawn an architect subagent:

```
Task tool:
  subagent_type: architect
  prompt: "Research and answer: <specific technical question>. Return findings as bullet points."
```

Use this for: trade-off analysis, feasibility checks, architecture decisions, integration concerns.
Do NOT spawn architect upfront — only when a specific technical question arises.

$ARGUMENTS
