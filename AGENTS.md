# Agent Teams

Coordination rules for orchestrator. Agents get shared rules from CLAUDE.md.

## Model

Main Claude = orchestrator. Assesses issues, spawns agents, runs skills, coordinates workflow.
Human approves at every gate.

## Team

| Tier | Agents | Role |
|------|--------|------|
| Domain | frontend-dev, backend-dev, devops | Write code in their packages |
| Quality | fixer, tester, security-auditor | Fix findings, write tests, audit |
| Strategy | architect, product-lead, doc-writer | Plan, analyze, document |

## 4-Phase Workflow

1. **Assessment:** Fetch issue → check analysis/spec → spawn product-lead (+architect) → human approves
2. **Implementation:** Domain agents + tester. RED→GREEN→REFACTOR → tests ✓ → PR
3. **Review:** Fresh agents (security, architect, product, tester + domain). Conventional Comments → `/1b1`
4. **Fix & Merge:** Fixer(s) apply accepted comments → CI → human merges. ≥6 findings spanning distinct modules → multiple fixers.

## Task Lifecycle

Lead creates tasks → agents claim by domain → execute → mark complete + follow-ups → human reviews at gates.

## Communication

"Message the lead" = `SendMessage` with concise status, key info upfront.
Blocker → lead. Cross-domain → create task + message lead. Security → lead + security-auditor.
Task handoff via `blockedBy` deps.

## Domain Boundaries

¬modify files outside your domain.

| Agent | Owns | ¬Touch |
|-------|------|--------|
| frontend-dev | `apps/web/`, `packages/ui/` | api, config, docs |
| backend-dev | `apps/api/`, `packages/types/` | web, config, docs |
| devops | `packages/config/`, root configs, `.github/` | `apps/*/src/`, docs |
| fixer | All packages (accepted findings only) | ¬new features |
| tester | Test files in all packages | ¬source files |
| security-auditor | Read-only + Bash | ¬source files |
| architect | `docs/architecture/`, ADRs | ¬app code |
| product-lead | `analyses/`, `specs/`, `gh` CLI | ¬app code |
| doc-writer | `docs/`, `CLAUDE.md` | ¬app code |

Intra-domain parallel: multiple same-type agents on non-overlapping files OK. Shared files → merge into single agent.

## Micro-Task Protocol

When `/scaffold` 4f generates micro-tasks, agents receive structured work units via TaskCreate.

**Claim:** Spawn-prompt assignment = authoritative. Also check TaskList for unassigned tasks (lowest ID first).

**Verify:** After each task, check `verificationStatus`:
- `ready` → run command now
- `deferred` → GREEN agents only spawned after RED-GATE complete. Unexpected deferred → skip verify, continue.
- `manual` → inspect file/code, mark complete

**Fail loop:** verify ✗ → fix + re-verify (max 3) → 3✗ → escalate to lead (task ID, error, fixes tried, files).

**RED-GATE:** Sentinel per slice assigned to tester (`phase: RED-GATE`). Tester marks complete after all RED tasks done → orchestrator spawns GREEN agents.

## Config

Agent behavior via YAML frontmatter in `.claude/agents/*.md`:
`permissionMode` (bypassPermissions|plan) | `maxTurns` (20-50) | `memory: project` (.claude/agent-memory/) | `skills` (preloaded) | `disallowedTools` (deny list)

Full → [agent-teams.mdx](docs/guides/agent-teams.mdx).
