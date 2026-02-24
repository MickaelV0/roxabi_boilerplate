# Claude Configuration

## TL;DR

- **Project:** Roxabi Boilerplate — SaaS framework (Bun, TurboRepo, TypeScript, TanStack Start, NestJS, Vercel)
- **Before work:** Read [dev-process.mdx](docs/processes/dev-process.mdx) → determine tier (S / F-lite / F-full)
- **All code changes** → worktree: `git worktree add ../roxabi-XXX -b feat/XXX-slug staging`
- **Always** `AskUserQuestion` for choices — ¬plain-text questions
- **¬commit** without asking, **¬push** without request, **¬**`--force`/`--hard`/`--amend`
- **Always** use appropriate skill even without slash command
- **Before code:** Read relevant standards doc (see [Rule 8](#8-coding-standards))
- **Orchestrator** delegates to agents — only minor fixes directly

## Project Overview

SaaS framework with integrated AI team. Vision → [docs/vision.mdx](docs/vision.mdx).

**Stack:** Bun | TurboRepo | TypeScript 5.x strict | Biome | TanStack Start | NestJS + Fastify | Vercel | Drizzle ORM + PostgreSQL 16
**Style:** single quotes, no semicolons, trailing commas (es5), 2-space indent, 100-char width

```bash
cp .env.example .env && bun install && bun run db:up && bun run dev  # web:3000 api:4000 email:3001
```

```
apps/web   @repo/web    TanStack Start + Vite + Tailwind v4
apps/api   @repo/api    NestJS + Fastify + Drizzle ORM
packages/  ui(@repo/ui) types(@repo/types) config(@repo/config) vitest-config playwright-config
```

## Commands

| Task | Command | Notes |
|------|---------|-------|
| Dev | `bun run dev` | web:3000, api:4000, email:3001, nitro:42069 |
| Build | `bun run build` | TurboRepo-cached |
| Lint / fix | `bun run lint` / `lint:fix` | Biome |
| Format | `bun run format` | Biome |
| Typecheck | `bun run typecheck` | All packages |
| Test | `bun run test` | Vitest (¬`bun test`) |
| Test watch / coverage / e2e | `test:watch` / `test:coverage` / `test:e2e` | |
| Affected only | `typecheck:affected` / `test:affected` | Changed vs main |
| Kill ports | `bun run dev:clean` | Orphaned 42069/4000/3000/3001 |
| DB up/down | `db:up` / `db:down` | Docker Postgres 16 |
| DB generate/migrate/reset/seed | `db:generate` / `db:migrate` / `db:reset` / `db:seed` | |
| DB branch | `cd apps/api && bun run db:branch:create --force XXX` | Per-worktree |
| Clean | `bun run clean` / `clean:cache` | Artifacts / caches |
| i18n | `bun run i18n:validate` | Translation completeness |
| Env check | `bun run check:env` | .env ↔ .env.example |
| License | `bun run license:check` | Dependency licenses |
| Docs / Dashboard | `bun run docs` / `bun run dashboard` | Preview / :3333 |

## Critical Rules

### 1. Dev Process

**MUST read [dev-process.mdx](docs/processes/dev-process.mdx) before any work.** No exceptions.

| Tier | Criteria | Process |
|------|----------|---------|
| **S** | ≤3 files, no arch, no risk | Worktree + PR |
| **F-lite** | Clear scope, single domain | Worktree + agents + /review |
| **F-full** | New arch, unclear reqs, >2 domains | Bootstrap + worktree + agents + /review |

### 2. AskUserQuestion

Always `AskUserQuestion` for: decisions, choices (≥2 options), approach proposals.
**¬** plain-text "Do you want..." / "Should I..." → use the tool.

### 3. Orchestrator Delegation

Orchestrator ¬modify code/docs. Delegate: FE→`frontend-dev` | BE→`backend-dev` | Infra→`devops` | Docs→`doc-writer` | Tests→`tester` | Fixes→`fixer`. Exception: typo/single-line. Deploy→`devops` only.

### 4. Parallel Execution

≥3 complex tasks → AskUserQuestion: Sequential | Parallel (Recommended).
F-full + ≥4 independent tasks in 1 domain → multiple same-type agents on separate file groups.

### 5. Git

Format: `<type>(<scope>): <desc>` + `Co-Authored-By: Claude <model> <noreply@anthropic.com>`
Types: feat|fix|refactor|docs|style|test|chore|ci|perf
¬push without request. ¬force/hard/amend. Hook fail → fix + NEW commit.
Full spec → [docs/contributing.mdx](docs/contributing.mdx)

### 6. Mandatory Worktree

```bash
git worktree add ../roxabi-XXX -b feat/XXX-slug staging
cd ../roxabi-XXX && cp .env.example .env && bun install
cd apps/api && bun run db:branch:create --force XXX
```

Exceptions: XS (confirm via AskUserQuestion) | /bootstrap (doc artifacts) | /promote (release artifacts).
**¬code on main/staging without worktree.**

### 7. Code Review

MUST read [code-review.mdx](docs/standards/code-review.mdx). Conventional Comments. Block only: security, correctness, standard violations.

### 8. Coding Standards

| Context | Read |
|---------|------|
| React / TanStack | [frontend-patterns.mdx](docs/standards/frontend-patterns.mdx) |
| NestJS / API | [backend-patterns.mdx](docs/standards/backend-patterns.mdx) |
| Tests | [testing.mdx](docs/standards/testing.mdx) |
| Docs | [contributing.mdx](docs/contributing.mdx) |
| Issues | [issue-management.mdx](docs/processes/issue-management.mdx) |

## Skills & Agents

Skills: always use appropriate skill. Defs → `.claude/skills/*/SKILL.md`.
Agents: rules → [AGENTS.md](AGENTS.md). Defs → `.claude/agents/*.md`. Guide → [agent-teams.mdx](docs/guides/agent-teams.mdx).

**Shared agent rules:** ¬commit/push (lead handles git) | ¬force/hard/amend | stage specific files only | escalate blockers → lead | claim tasks from shared list | create follow-up tasks | security → lead + security-auditor | message lead on completion.

## Gotchas

- `bun test` ≠ `bun run test` — former = Bun runner (CPU spin), latter = Vitest. Hook blocks it.
- `turbo.jsonc` ¬`turbo.json` — JSONC with comments.
- `useImportType: off` for `apps/api/` — NestJS DI needs runtime imports.
- Node ≥24, Bun 1.3.9 = pkg manager.
- Orphaned ports → `bun run dev:clean`.
- DB branches: worktree → own schema via `db:branch:create --force XXX`.
- Paraglide i18n: compiled during codegen, `src/paraglide/` gitignored.
- Biome upgrade → sync `$schema` version in `biome.json`.
- Sub-issues: `addSubIssue` GraphQL mutation, ¬markdown checklists. Use `/issue-triage --parent`.
- Post-rebase: `bun install` before push if new build steps added.

## Reference

| Topic | Path |
|-------|------|
| Getting started | [getting-started.mdx](docs/getting-started.mdx) |
| Config | [configuration.mdx](docs/configuration.mdx) |
| Dev process | [dev-process.mdx](docs/processes/dev-process.mdx) |
| Issues | [issue-management.mdx](docs/processes/issue-management.mdx) |
| Architecture | [docs/architecture/](docs/architecture/) |
| FE / BE / Test / Review | [frontend-patterns](docs/standards/frontend-patterns.mdx) / [backend-patterns](docs/standards/backend-patterns.mdx) / [testing](docs/standards/testing.mdx) / [code-review](docs/standards/code-review.mdx) |
| Contributing | [contributing.mdx](docs/contributing.mdx) |
| Deploy / Auth / Agents | [deployment](docs/guides/deployment.mdx) / [authentication](docs/guides/authentication.mdx) / [agent-teams](docs/guides/agent-teams.mdx) |
| Vision | [vision.mdx](docs/vision.mdx) |
| Specs / Analyses | [specs/](specs/) / [analyses/](analyses/) |

**Deploy:** `main` → Vercel prod. `staging` → preview. Web=`apps/web` (TanStack/Nitro). API=`apps/api` (NestJS).

**Hooks (Claude Code):** Biome auto-format (PostToolUse) | Security warn (PreToolUse) | `bun test` blocker (PreToolUse)
**Hooks (Git/Lefthook):** pre-commit (Biome) | commit-msg (Commitlint) | pre-push (lint+typecheck+tests)
