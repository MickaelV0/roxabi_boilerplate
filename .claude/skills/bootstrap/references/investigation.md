# Gate 1.5: Investigation (Optional)

> Investigation step for the bootstrap pipeline. Runs only after Gate 1 approval. Skipped when using `--spec`.

### 1.5a. Detect Uncertainty Signals

Read the approved analysis and check for uncertainty signals:

- **Explicit uncertainty markers:** "needs testing", "unclear if", "to be validated", "unknown performance", "requires investigation", trade-off sections without a concluded decision
- **Multiple competing approaches:** 2+ approaches listed without a clear winner, or a recommendation "pending validation"
- **External dependency risk:** Reliance on a third-party API, library, or service not yet tested in this project
- **Shape unknowns:** Any shape in the analysis's `## Shapes` section with unvalidated integration points, untested technical approaches, or unknown feasibility (e.g., "trade-offs include unknown performance characteristics")

If no signals detected → skip to "Ensure GitHub Issue."

### 1.5b. User Confirmation

If signals are detected, present via `AskUserQuestion`:

> "The analysis contains technical uncertainty: {detected signals summary}. {If shape unknowns detected: 'The analysis contains N shape(s) with unvalidated technical assumptions that need investigation.'} Would you like to investigate before writing the spec?"

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

   Use the subagent prompt template from [references/templates.md](references/templates.md).

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

1. Append approved findings to the analysis document. Use the findings template from [references/templates.md](references/templates.md).

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
