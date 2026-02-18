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
4. **Fix & Merge**: Fixer applies accepted comments → CI → human merges

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
