# Gate 1.5: Investigation (Optional)

After Gate 1 approval. Skip if `--spec`.

## 1.5a. Detect Signals

Read analysis for uncertainty:
- Explicit: "needs testing", "unclear if", "to be validated", "unknown performance"
- Competing approaches: 2+ without clear winner
- External deps: untested API/library
- Shape unknowns: unvalidated integration points in `## Shapes`

¬signals ⇒ skip → Ensure GitHub Issue.

## 1.5b. User Confirmation

∃ signals ⇒ AskUserQuestion: **Investigate** (spike) | **Skip to spec**
Skip ⇒ no worktree, proceed to Ensure GitHub Issue.

## 1.5c. Define Scope

Draft question(s) + done criteria (success/failure conditions). Present via AskUserQuestion.

```
Question: "Can sqlite-vec run on Bun/WSL2 with acceptable latency?"
Success: installs + 10k queries <50ms
Failure: fails to install ∨ latency >500ms
```

## 1.5d. Execute Spike

```bash
# Bare text: no issue# yet
git worktree add ../roxabi-spike-{slug} -b spike/{slug} staging
# --issue N: issue# available
git worktree add ../roxabi-spike-N -b spike/N-{slug} staging
cd ../roxabi-spike-* && bun install   # ¬db:branch:create (feasibility only)
```

Spawn expert via Task (use prompt template from [references/templates.md](references/templates.md)):

| Domain | Subagent |
|--------|----------|
| Arch / library eval | architect |
| Backend / DB / ORM | backend-dev |
| Frontend / UI / browser | frontend-dev |
| CI/CD / deploy / infra | devops |
| Cross-cutting / unclear | architect (default) |

Cross-domain ⇒ parallel subagents (one per domain), merge findings.

## 1.5e. Review Findings

Result: Partial (hit 15-turn limit) ⇒ AskUserQuestion: **Continue** (new subagent) | **Accept partial**

Present findings via AskUserQuestion:
- Question, Result (Success|Failure|Partial), key findings, recommendation

Options: **Approve** (append to analysis) | **Edit** (text corrections only) | **Discard**

## 1.5f. Cleanup

1. Append findings to analysis using template from [references/templates.md](references/templates.md)
2. Guard: verify analysis contains `## Investigation Findings` + `**Approach tested:**`
3. ✓ guard ⇒ delete spike: `git worktree remove ../roxabi-spike-*` + `git branch -D spike/*`
4. ✗ guard ⇒ preserve spike, inform user
5. All approaches failed ⇒ AskUserQuestion: **Revise analysis** (→Gate 1) | **Proceed to spec** | **Abandon**
6. → Ensure GitHub Issue
