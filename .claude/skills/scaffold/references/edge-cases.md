# Scaffold Edge Cases

| Scenario | Behavior |
|----------|----------|
| No spec found | Suggest `/bootstrap`. Stop. |
| Size XS confirmed by lead | Skip worktree, direct branch |
| Typecheck fails during impl | Agents fix in-loop. 3✗ → escalate to lead |
| Issue already exists | Use existing, inform user |
| Branch already exists | Warn, ask: reuse ∨ recreate |
| Worktree dir exists | Warn, ask: reuse ∨ cleanup |
| Spec has no file list | Infer from feature description |
| Tests fail during impl | Agents fix + re-test loop |
| Pre-commit hook failure | Fix, re-stage, NEW commit (¬amend) |
| Agent blocked | Report to user for guidance |
| Unresolved `[NEEDS CLARIFICATION]` | Pre-flight warns. User: resolve ∨ bootstrap ∨ proceed |
| No Breadboard ∧ no Success Criteria | Skip 4f, warn, use text tasks from 2d |
| Task count > 30 | Warn, show full list, suggest splitting |
| Multi-slice spec | Step 2e: select slices. Default 1/run. Re-run for rest. |
| All slices implemented | Detect via code/tests. Suggest `/review`. |
| Consistency 0 coverage | Block agents. Return to spec. |
| Verify cmd references missing file | Mark deferred. Post-RED fail → escalate. |
| Affordance > 5 min | Split into 2-3 sub-tasks |
| Session interrupted after plan commit | Resume: re-read plan, reconstruct TaskCreate, skip consistency |
| User wants to regenerate tasks | New commit (¬amend). Latest plan = authoritative. |
| `plans/` dir missing | Create on first use (4f.8) |
