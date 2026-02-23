# Agent Teams — Roxabi Boilerplate

Team-wide coordination rules. Loaded by orchestrator, not auto-loaded by agents (shared rules are in CLAUDE.md).

## Orchestration Model

**Main Claude = orchestrator.** Assesses issues, spawns agents, runs skills, coordinates 4-phase workflow. Human decides at every gate.

| Actor | Role |
|-------|------|
| **Human** | Approves specs, validates reviews, merges |
| **Main Claude** | Fetches issues, spawns agents, coordinates flow |
| **Agents** | Execute within domain boundaries |

## Team Structure

| Tier | Agents | Role |
|------|--------|------|
| **Domain** | frontend-dev, backend-dev, devops | Write code in their packages |
| **Quality** | fixer, tester, security-auditor | Fix accepted review comments, write tests, audit security |
| **Strategy** | architect, product-lead, doc-writer | Plan, analyze, document |

## Coordination Protocol

### 4-Phase Workflow

1. **Assessment**: Fetch issue → check analysis/spec → spawn product-lead (+architect if needed) → human approves spec
2. **Implementation**: Spawn domain agents + tester. RED → GREEN → REFACTOR → all tests pass → PR
3. **Review**: Fresh review agents (security, architect, product, tester + domain). Conventional Comments → `/1b1` walkthrough
4. **Fix & Merge**: Fixer(s) apply accepted comments → CI → human merges. Multiple fixers per domain when 6+ findings span distinct modules.

### Task Lifecycle

1. Lead creates tasks with descriptions, assignments, deps
2. Agents claim tasks matching their domain
3. Agent executes within boundaries (see `.claude/agents/*.md`)
4. Agent marks complete + creates follow-up tasks
5. Human reviews at each gate

### Communication

> "Message the lead" = `SendMessage` with concise status update, key info upfront.

- **Task handoff**: `blockedBy` deps — your completion unblocks next agent
- **Blocker**: Message lead with description
- **Cross-domain**: Create task for other agent + message lead
- **Security finding**: Message lead + security-auditor immediately

### Intra-Domain Parallelization

Multiple agents of the same type may run concurrently on non-overlapping file groups. Agents in the same domain must NOT modify shared files — if file conflicts exist, merge those tasks into a single agent.

### Domain Boundaries

**Never modify files outside your domain.**

| Agent | Owns | Does NOT touch |
|-------|------|----------------|
| frontend-dev | `apps/web/`, `packages/ui/` | `apps/api/`, `packages/config/`, `docs/` |
| backend-dev | `apps/api/`, `packages/types/` | `apps/web/`, `packages/config/`, `docs/` |
| devops | `packages/config/`, root configs, `.github/` | `apps/*/src/`, `docs/` |
| fixer | All packages (fix accepted review comments) | Only fixes identified findings, no new features |
| tester | Test files in all packages | Never modifies source files |
| security-auditor | Read-only + `Bash` for auditing | Never modifies source files |
| architect | `docs/architecture/`, ADR files | Never writes application code |
| product-lead | `analyses/`, `specs/`, GitHub issues via `gh` | Never writes application code |
| doc-writer | `docs/`, `CLAUDE.md` | Never writes application code |

### Micro-Task Consumption Protocol

When `/scaffold` Step 4f generates micro-tasks, agents receive structured work units via `TaskCreate` entries instead of text-based plans. Each micro-task includes metadata (see scaffold SKILL.md Step 4f.9 for the full schema).

**Claiming tasks:**

Tasks are delivered via spawn prompts (Task tool description or TeamCreate instructions). The orchestrator manages assignment and sequencing.

1. Receive your assigned micro-tasks in the spawn prompt
2. Execute tasks in the order provided (lowest ID first within your assigned slice)
3. Report completion to the lead after each task

**Running verification:**
1. After completing a task, check `verificationStatus` in task metadata
2. `"ready"` → run the `verificationCommand` immediately
3. `"deferred"` → the orchestrator will only spawn you for GREEN tasks after the tester completes RED tasks for that slice. If you encounter a deferred task unexpectedly, skip verification and continue to the next task.
4. `"manual"` → no automated command. Agent verifies by inspecting the file/code and marks task complete.

**Handling failures:**
1. Verification fails → fix and re-verify (max 3 retries)
2. After 3 failures → escalate to lead with: task ID, error output, attempted fixes, affected files
3. Do NOT mark the task as completed if verification fails

**RED-GATE sentinels:**
- Each slice has a `"RED complete: V{N}"` sentinel task assigned to tester with `phase: "RED-GATE"`
- Tester marks the sentinel complete after finishing all RED tasks for that slice
- The orchestrator manages RED-GATE ordering by spawning GREEN agents only after the tester completes RED tasks for each slice

**Dynamic task claiming:** Agents can claim tasks directly via TaskList/TaskUpdate in addition to receiving them in spawn prompts:
1. Check `TaskList` for tasks matching your domain with status `pending` and no owner
2. Prefer tasks in ID order (lowest first) within your assigned slice
3. Claim with `TaskUpdate` (set `owner` to your name)
4. RED-GATE sentinels can be checked directly via TaskList instead of relying on orchestrator sequencing

**Arbitration rule:** Spawn-prompt assignment is authoritative. TaskList is for discovering unassigned tasks only. If you receive a task in your spawn prompt, you own it regardless of TaskList state.

### Standards

All agents must follow:

- **Conventional Commits**: `<type>(<scope>): <description>` — see [Contributing](docs/contributing.mdx)
- **Domain standards**: Read relevant standards before coding (see agent `.md`)
- **No `git add -A`** — stage specific files only
- **No force push** — never `--force` or `--hard`

## Configuration

Agent behavior defined via YAML frontmatter in `.claude/agents/*.md`:

- **`permissionMode`** — `bypassPermissions` (free execution) | `plan` (propose only)
- **`maxTurns`** — Max API round-trips (20–50 by role)
- **`memory: project`** — Persistent learnings in `.claude/agent-memory/`. For *emergent* knowledge (workarounds, gotchas) — not prescribed rules.
- **`skills`** — Preloaded skill per agent (e.g., `commit`, `test`, `context7`)
- **`disallowedTools`** — Tool deny list (defense-in-depth)

Full details → [Agent Teams Guide](docs/guides/agent-teams.mdx).
