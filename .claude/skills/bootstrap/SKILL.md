---
argument-hint: ["idea" | --issue <N> | --spec <N>]
description: Planning orchestrator from idea to approved implementation plan, with three validation gates.
allowed-tools: Bash, AskUserQuestion, Read, Write, Glob, Grep, Task
---

# Bootstrap

Orchestrate the full planning pipeline from a raw idea (or existing issue/spec) to an approved implementation plan. Calls `/interview` for analysis and spec creation, and `/plan` for implementation planning. Enforces three user-approval gates. Stops at the approved plan -- execution is handled by `/scaffold`.

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
| `--spec N` | Gate 2 (Spec) | Assumes spec exists at `docs/specs/N-*.mdx`, skips analysis |

## Instructions

### Step 0 -- Parse Arguments and Determine Entry Point

Parse the arguments to determine the entry point:

1. **If bare text** (e.g., `"avatar upload"`): Start at **Gate 1**. The text is the idea seed.
2. **If `--issue N`**: Start at **Gate 1**. Fetch the issue body with `gh issue view N` for starting context.
3. **If `--spec N`**: Start at **Gate 2**. Look for `docs/specs/N-*.mdx` using Glob. If not found, inform the user and suggest starting from scratch with `/bootstrap "idea"` or `/bootstrap --issue N`.

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

## Gate 1: Analysis

> Skipped when using `--spec`.

### 1a. Generate or Locate Analysis

- **If an analysis already exists** (found in Step 1): read it and present it to the user.
- **If no analysis exists**: invoke the `/interview` skill in Analysis mode using the Skill tool.
  - Pass the idea text or issue context as the argument.
  - `/interview` will produce `docs/analyses/{slug}.mdx`.

### 1b. User Approval

Present the analysis to the user via **AskUserQuestion**:

> "Here is the analysis. Please review it."

Options:
- **Approve** -- Proceed to Gate 2 (Spec)
- **Reject** -- Provide feedback and re-enter Gate 1

**If rejected:** Collect user feedback, then re-invoke `/interview` or manually adjust the analysis. Re-present for approval. Do not proceed until approved.

---

## Gate 2: Spec

### 2a. Generate or Locate Spec

- **If a spec already exists** (found in Step 1, or entry point is `--spec N`): read it and present it to the user.
- **If no spec exists**: invoke the `/interview` skill in Spec mode with `--promote` using the Skill tool.
  - Pass `--promote <path-to-analysis>` as the argument so `/interview` uses the approved analysis as the source.
  - `/interview` will produce `docs/specs/{issue}-{slug}.mdx`.

### 2b. User Approval

Present the spec to the user via **AskUserQuestion**:

> "Here is the spec. Please review it."

Options:
- **Approve** -- Proceed to Gate 3 (Implementation Plan)
- **Reject** -- Provide feedback and re-enter Gate 2

**If rejected:** Collect user feedback, adjust the spec or re-run the interview. Re-present for approval. Do not proceed until approved.

---

## Gate 3: Implementation Plan

### 3a. Generate Plan

Invoke the `/plan` skill using the Skill tool:

- Pass `--spec <path-to-spec>` as the argument (use the spec file path from Gate 2).
- `/plan` will read the spec, analyze scope, suggest a tier (S/M/L), and generate an ordered implementation plan.

### 3b. User Approval

The `/plan` skill handles its own presentation and approval flow. Once `/plan` completes with an approved plan, Gate 3 is passed.

**If the user rejects the plan inside `/plan`:** `/plan` handles re-generation. `/bootstrap` waits for `/plan` to finish with an approved result.

---

## Issue Status Transitions

When a GitHub issue is associated with the bootstrap pipeline, update its status on the project board at these points:

| Event | New Status | When |
|-------|-----------|------|
| Gate 1 approved (analysis done) | **Analysis** | After user approves the analysis |
| Gate 2 approved (spec done) | **Specs** | After user approves the spec |

Use the following helper to update the status. Replace `<ISSUE_NUMBER>` with the actual issue number:

```bash
# Get the project item ID for the issue
ITEM_ID=$(gh api graphql -F query=@- -f projectId="PVT_kwHODEqYK84BOId3" <<'GQL' | jq -r --argjson num <ISSUE_NUMBER> '.data.node.items.nodes[] | select(.content.number == $num) | .id'
query($projectId: ID!) {
  node(id: $projectId) {
    ... on ProjectV2 {
      items(first: 100) {
        nodes {
          id
          content { ... on Issue { number } }
        }
      }
    }
  }
}
GQL
)

# Update the Status field (use heredoc to avoid shell expansion of GraphQL $ variables)
gh api graphql -F query=@- \
  -f projectId="PVT_kwHODEqYK84BOId3" \
  -f itemId="$ITEM_ID" \
  -f fieldId="PVTSSF_lAHODEqYK84BOId3zg87HNM" \
  -f optionId="<OPTION_ID>" <<'GQL'
mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
  updateProjectV2ItemFieldValue(input: {projectId: $projectId, itemId: $itemId, fieldId: $fieldId, value: {singleSelectOptionId: $optionId}}) {
    projectV2Item { id }
  }
}
GQL
```

**Status option IDs:**

| Status | Option ID |
|--------|-----------|
| Backlog | `df6ee93b` |
| Analysis | `bec91bb0` |
| Specs | `ad9a9195` |
| In Progress | `331d27a4` |
| Review | `ee30a001` |
| Done | `bfdc35bd` |

**When to update:**
- Only update if a GitHub issue is associated (skip if no issue number exists)
- Gate 1 → set to "Analysis" (`bec91bb0`)
- Gate 2 → set to "Specs" (`ad9a9195`)
- Gate 3 does NOT change status (stays at "Specs" until `/scaffold` moves it to "In Progress")

## Completion

Once all three gates are passed, inform the user:

> "Bootstrap complete. You have an approved analysis, spec, and implementation plan. Run `/scaffold` to begin execution."

**Do not scaffold, commit, or create PRs.** Bootstrap stops at the approved plan.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Issue already has a spec | Skip Gate 1, present existing spec at Gate 2 for validation |
| Issue already has an analysis | Skip analysis generation, present existing analysis at Gate 1 for validation |
| User rejects at any gate | Stop, collect feedback, re-enter the same gate |
| `--spec N` but no spec found | Inform user: "No spec found matching issue #N. Try `/bootstrap --issue N` or `/bootstrap 'your idea'` to start from scratch." |
| Analysis exists but is a brainstorm | Treat as "no analysis" -- invoke `/interview` to promote brainstorm to analysis |
| `/interview` or `/plan` skill fails | Report the error to the user and stop |

## Skill Invocation Reference

When calling sub-skills, use the **Skill** tool:

| Sub-skill | Invocation | When |
|-----------|------------|------|
| `/interview` (Analysis) | `skill: "interview", args: "topic text"` | Gate 1, no existing analysis |
| `/interview` (Spec promotion) | `skill: "interview", args: "--promote docs/analyses/{slug}.mdx"` | Gate 2, no existing spec |
| `/plan` | `skill: "plan", args: "--spec docs/specs/{issue}-{slug}.mdx"` | Gate 3 |

$ARGUMENTS
