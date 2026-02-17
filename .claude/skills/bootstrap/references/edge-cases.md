# Bootstrap Edge Cases

Edge cases handled by the bootstrap skill pipeline.

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
