# Agent Teams — Roxabi Boilerplate

Team-wide coordination rules for all agents. Every agent reads this file.

## Orchestration Model

**Main Claude is the orchestrator.** It assesses issues, spawns agents, runs skills, and coordinates the 4-phase workflow (Assess, Implement, Review, Fix/Merge). The human is the decision-maker at every gate. Agents are specialists that execute within their domain.

| Actor | Role |
|-------|------|
| **Human** | Decision-maker — approves specs, validates review comments, merges |
| **Main Claude** | Orchestrator — fetches issues, spawns agents, runs skills, coordinates flow |
| **Agents** | Specialists — each executes within its domain boundaries |

## Team Structure

| Tier | Agents | Role |
|------|--------|------|
| **Domain** | frontend-dev, backend-dev, infra-ops | Write code in their packages |
| **Quality** | fixer, tester, security-auditor | Fix accepted review comments, write tests, audit security |
| **Strategy** | architect, product-lead, doc-writer | Plan, analyze, document |

## Coordination Protocol

### 4-Phase Workflow

1. **Phase 1 — Assessment**: Main Claude fetches issue, checks for analysis/spec. If gaps exist, spawns product-lead (and architect if needed). Human approves spec.
2. **Phase 2 — Implementation**: Main Claude spawns domain agents + tester. Test-first: tester writes failing tests (RED), domain agents implement (GREEN), refactor (REFACTOR). All tests pass, PR created.
3. **Phase 3 — Review**: Main Claude spawns fresh review agents (security-auditor, architect, product-lead, tester, plus domain agents matching changed files). Each produces Conventional Comments. Main Claude walks human through findings via `/1b1`.
4. **Phase 4 — Fix and Merge**: Fixer agent applies accepted review comments. CI runs. Human approves merge.

### Task Lifecycle

1. **Main Claude creates tasks** with descriptions, assignments, and dependencies
2. **Agents claim** tasks matching their domain
3. **Agent executes** within its boundaries (see agent-specific `.claude/agents/*.md`)
4. **Agent marks complete** and creates follow-up tasks for the next stage
5. **Human reviews** deliverables at each gate

### Communication

> **"Message the lead"** means outputting a clear status update in your response. The lead session sees all teammate output. Use a prefix like `[BLOCKER]`, `[HANDOFF]`, or `[SECURITY]` so the lead can scan updates quickly.

- **Task handoff**: Use `blockedBy` dependencies — when your task completes, the next agent's task unblocks
- **Blocker**: Message the lead with a clear description of what's blocking you
- **Cross-domain need**: Create a task for the other domain agent and message the lead
- **Security finding**: Message both the lead and security-auditor immediately

### Domain Boundaries

Each agent operates within specific packages. **Never modify files outside your domain.**

| Agent | Owns | Does NOT touch |
|-------|------|----------------|
| frontend-dev | `apps/web/`, `packages/ui/` | `apps/api/`, `packages/config/`, `docs/` |
| backend-dev | `apps/api/`, `packages/types/` | `apps/web/`, `packages/config/`, `docs/` |
| infra-ops | `packages/config/`, root configs, `.github/` | `apps/*/src/`, `docs/` |
| fixer | All packages (fix accepted review comments) | Only fixes identified findings, no new features |
| tester | Test files in all packages | Never modifies source files |
| security-auditor | Read-only + `Bash` for auditing | Never modifies source files |
| architect | `docs/architecture/`, ADR files | Never writes application code |
| product-lead | `docs/analyses/`, `docs/specs/`, GitHub issues via `gh` | Never writes application code |
| doc-writer | `docs/`, `CLAUDE.md` | Never writes application code |

### Standards

Every agent must follow:

- **Conventional Commits**: `<type>(<scope>): <description>` — see [Contributing](docs/contributing.mdx)
- **Domain standards**: Read the relevant standards doc before writing code (see each agent's `.md` file)
- **No `git add -A`**: Always stage specific files
- **No force push**: Never use `--force` or `--hard`

## Configuration

Each agent's `.md` file in `.claude/agents/` defines its behavior through YAML frontmatter:

- **`permissionMode`** — `bypassPermissions` (agent can execute tools freely) or `plan` (agent proposes changes but cannot execute them)
- **`maxTurns`** — Maximum API round-trips before stopping (20-50 depending on role)
- **`memory: project`** — Enables persistent learnings across sessions in `.claude/agent-memory/`
- **`skills`** — Core skill preloaded per agent (e.g., `commit`, `test`, `context7`)
- **`disallowedTools`** — Explicit deny list for tools an agent should never use (defense-in-depth)

See the [Agent Teams Guide](docs/guides/agent-teams.mdx) for full details on each configuration field.

## Getting Started

See the [Agent Teams Guide](docs/guides/agent-teams.mdx) for setup, playbooks, and troubleshooting.
