---
argument-hint: ["idea" | --issue <N> | --spec <N>]
description: Planning orchestrator from idea to approved spec, with two validation gates.
allowed-tools: Bash, AskUserQuestion, Read, Write, Glob, Grep, Task, TeamCreate, TeamDelete, SendMessage
---

# Bootstrap

Orchestrate the planning pipeline from a raw idea (or existing issue/spec) to an approved spec. Spawns a planning team (product-lead + architect + doc-writer) to produce analysis and spec documents. Enforces two user-approval gates. Stops at the approved spec -- execution is handled by `/scaffold`.

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

## Spawn Planning Team

Before entering any gate, create the planning team:

1. **Create team** using `TeamCreate` with name `bootstrap-{issue-or-slug}`.
2. **Spawn agents** using the `Task` tool with `team_name`:

| Agent | Role | Spawned as |
|-------|------|------------|
| **product-lead** | Leads interviews, writes analysis and spec, interacts with human | Active — starts working immediately |
| **architect** | Available for technical consultation (depth, trade-offs, architecture) | Idle — product-lead messages when needed |
| **doc-writer** | Available for documentation quality review | Idle — product-lead messages when needed |

3. **Create tasks** for the team:
   - Task for Gate 1 (analysis) assigned to product-lead
   - Task for Gate 2 (spec) assigned to product-lead, blocked by Gate 1

Product-lead uses `/interview` skill internally to conduct structured interviews with the human. When product-lead needs technical depth, it messages architect via `SendMessage`. When it needs doc review, it messages doc-writer.

---

## Gate 1: Analysis

> Skipped when using `--spec`.

### 1a. Generate or Locate Analysis

- **If an analysis already exists** (found in Step 1): read it and present it to the user.
- **If no analysis exists**: product-lead conducts a structured interview with the human (using `/interview` in Analysis mode) to produce `docs/analyses/{slug}.mdx`.
  - Product-lead may consult architect for technical depth or trade-off analysis.

### 1b. User Approval

Present the analysis to the user via **AskUserQuestion**:

> "Here is the analysis. Please review it."

Options:
- **Approve** -- Proceed to Gate 2 (Spec)
- **Reject** -- Provide feedback and re-enter Gate 1

**If rejected:** Collect user feedback, product-lead revises the analysis (may consult architect/doc-writer). Re-present for approval. Do not proceed until approved.

---

## Gate 2: Spec

### 2a. Generate or Locate Spec

- **If a spec already exists** (found in Step 1, or entry point is `--spec N`): read it and present it to the user.
- **If no spec exists**: product-lead promotes the approved analysis to a spec (using `/interview` with `--promote <path-to-analysis>`) to produce `docs/specs/{issue}-{slug}.mdx`.
  - Product-lead may consult architect for implementation strategy and doc-writer for spec quality.

### 2b. User Approval

Present the spec to the user via **AskUserQuestion**:

> "Here is the spec. Please review it."

Options:
- **Approve** -- Bootstrap complete, proceed to completion
- **Reject** -- Provide feedback and re-enter Gate 2

**If rejected:** Collect user feedback, product-lead revises the spec (may consult team). Re-present for approval. Do not proceed until approved.

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

1. **Commit** the analysis and spec documents:
   ```bash
   git add docs/analyses/<slug>.mdx docs/specs/<issue>-<slug>.mdx
   git commit -m "$(cat <<'EOF'
   docs(<scope>): add analysis and spec for <feature>

   Refs #<issue_number>

   Co-Authored-By: Claude <model> <noreply@anthropic.com>
   EOF
   )"
   ```
   Include `meta.json` files if they were updated.

2. **Inform the user:**

> "Bootstrap complete. You have an approved analysis and spec (committed). Run `/scaffold --spec <N>` to execute."

**Do not scaffold or create PRs.** Bootstrap stops at the approved spec.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Issue already has a spec | Skip Gate 1, present existing spec at Gate 2 for validation |
| Issue already has an analysis | Skip analysis generation, present existing analysis at Gate 1 for validation |
| User rejects at any gate | Stop, collect feedback, re-enter the same gate |
| `--spec N` but no spec found | Inform user: "No spec found matching issue #N. Try `/bootstrap --issue N` or `/bootstrap 'your idea'` to start from scratch." |
| Analysis exists but is a brainstorm | Treat as "no analysis" -- product-lead promotes brainstorm to analysis |
| Agent fails or is unresponsive | Report the error to the user and stop |
| Issue already has a branch or open PR | Stop and propose `/review` or `/scaffold` instead (Step 0b) |

## Team Teardown

After completion (or early exit), shut down the planning team:

1. Send `shutdown_request` to all agents (product-lead, architect, doc-writer)
2. Wait for shutdown confirmations
3. Call `TeamDelete` to clean up

## Skill Invocation Reference

Product-lead uses the `/interview` skill internally:

| Sub-skill | Invocation | When |
|-----------|------------|------|
| `/interview` (Analysis) | `skill: "interview", args: "topic text"` | Gate 1, no existing analysis |
| `/interview` (Spec promotion) | `skill: "interview", args: "--promote docs/analyses/{slug}.mdx"` | Gate 2, no existing spec |

$ARGUMENTS
