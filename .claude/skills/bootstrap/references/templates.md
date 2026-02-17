# Bootstrap Templates

## Subagent Investigation Prompt Template

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

## Investigation Findings Template

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
