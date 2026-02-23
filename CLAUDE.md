# Claude Configuration

## TL;DR

- **Project:** Roxabi Boilerplate — SaaS framework (Bun, TurboRepo, TypeScript, TanStack Start, NestJS, Vercel)
- **Before any work:** Read [dev-process.mdx](docs/processes/dev-process.mdx) to determine tier (S / F-lite / F-full)
- **All code changes** require a worktree — `git worktree add ../roxabi-XXX -b feat/XXX-slug staging`
- **Always** use `AskUserQuestion` for multiple-choice questions — never ask in plain text
- **Never** commit without asking, push without explicit request, or use `--force`/`--hard`/`--amend`
- **Always** use the appropriate skill (see [Skills & Agents](#skills--agents)) even without a slash command
- **Before writing code:** Read the relevant standards doc (see [Rule 8](#8-coding-standards-critical))
- **Orchestrator** delegates all code/docs/deploy changes to agents — only minor fixes directly

---

## Project Overview

Roxabi Boilerplate - SaaS framework with integrated AI team.

Vision, principles, roadmap → [docs/vision.mdx](docs/vision.mdx).

### Tech Stack

- **Runtime**: Bun
- **Monorepo**: TurboRepo
- **Language**: TypeScript 5.x (strict mode)
- **Linting/Formatting**: Biome
- **Frontend**: TanStack Start
- **Backend**: NestJS + Fastify
- **Deployment**: Vercel (both web + API)
- **Code Style**: Biome — single quotes, no semicolons (`asNeeded`), trailing commas (`es5`), 2-space indent, 100-char line width
- **DB/ORM**: Drizzle ORM + PostgreSQL 16 (Docker local, Neon on Vercel)

### Quick Start

```bash
cp .env.example .env && bun install      # first-time setup
bun run db:up                             # start Docker Postgres (requires Docker)
bun run dev                               # start all apps (web :3000, API :4000)
```

Full config → [docs/configuration.mdx](docs/configuration.mdx).

### Monorepo Structure

```
apps/
  web/          @repo/web         TanStack Start + Vite + Tailwind v4
  api/          @repo/api         NestJS + Fastify + Drizzle ORM
packages/
  ui/           @repo/ui          Shared React components (Radix + CVA)
  types/        @repo/types       Shared TypeScript types/interfaces
  config/       @repo/config      Shared Biome/TS/Tailwind config
  vitest-config/ @repo/vitest-config  Shared Vitest configuration
  playwright-config/ @repo/playwright-config  Shared Playwright configuration
```

---

## Commands

| Task | Command | Notes |
|------|---------|-------|
| Dev server | `bun run dev` | Web :3000, API :4000, Nitro :42069 |
| Build | `bun run build` | TurboRepo-cached |
| Lint | `bun run lint` | Biome check |
| Lint + fix | `bun run lint:fix` | Auto-fix safe issues |
| Format | `bun run format` | Biome format |
| Typecheck | `bun run typecheck` | All packages via TurboRepo |
| Test (unit) | `bun run test` | Vitest across all packages |
| Test (watch) | `bun run test:watch` | Vitest watch mode |
| Test (coverage) | `bun run test:coverage` | With v8 coverage |
| Test (e2e) | `bun run test:e2e` | Playwright |
| Kill orphaned ports | `bun run dev:clean` | After Ctrl+C leaves zombies |
| DB start | `bun run db:up` | Docker Postgres 16 |
| DB stop | `bun run db:down` | Stop Docker container |
| DB generate | `bun run db:generate` | Drizzle schema → migration |
| DB migrate | `bun run db:migrate` | Apply migrations |
| DB reset | `bun run db:reset` | Drop + re-migrate + seed |
| DB seed | `bun run db:seed` | Seed dev data |
| DB branch (worktree) | `cd apps/api && bun run db:branch:create --force XXX` | Isolated DB per worktree |
| Clean | `bun run clean` | Remove all build artifacts + node_modules |
| Clean cache | `bun run clean:cache` | Vite + Turbo caches only |
| i18n validate | `bun run i18n:validate` | Check translation completeness |
| Env sync check | `bun run check:env` | Verify .env matches .env.example |
| Typecheck (affected) | `bun run typecheck:affected` | Only packages changed vs main |
| Test (affected) | `bun run test:affected` | Only packages changed vs main |
| License check | `bun run license:check` | Verify dependency licenses |
| Docs server | `bun run docs` | Runs web app for docs preview |
| Issue dashboard | `bun run dashboard` | Live HTML dashboard at :3333 |

---

## Critical Rules

### 1. Development Process (CRITICAL)

**BEFORE ANY SPEC, CODE CHANGE, OR PR REVIEW: MUST read [dev-process.mdx](docs/processes/dev-process.mdx) in full.**

Applies to ALL work: specs, features, fixes, refactoring, docs, tests, reviews. **No exceptions.**

**Tier determination (judgment-based):**

| Tier | Name | Criteria | Process |
|------|------|----------|---------|
| **S** | Quick Fix | <=3 files, no arch, no risk | Worktree + PR |
| **F-lite** | Feature (lite) | Clear scope, documented reqs, single domain | Worktree + agents + /review (skip bootstrap) |
| **F-full** | Feature (full) | New arch, unclear reqs, or >2 domains | Bootstrap + worktree + agents + /review |

---

### 2. AskUserQuestion (CRITICAL)

**ALWAYS use `AskUserQuestion` for:** decisions, multiple-choice (≥2 options), approach proposals, preference questions.

**FORBIDDEN: plain-text questions with choices.** Writing "Do you want...", "Should I...", "Do you prefer..." → **STOP** and use `AskUserQuestion`.

---

### 3. Orchestrator Delegation (CRITICAL)

**Orchestrator must NOT modify code/docs directly.** Delegate:

Frontend → `frontend-dev` | Backend → `backend-dev` | Config/infra/deploy → `devops`
Docs → `doc-writer` | Tests → `tester` | Review fixes → `fixer`

**Exception:** truly minor changes (typo, single-line tweak) — if in doubt, delegate.
**Deployment** → `devops` only, never orchestrator.

---

### 4. Parallel Execution for Large Tasks

≥3 complex tasks → **propose execution mode** via `AskUserQuestion`:
- **Sequential**: one at a time, better control
- **Parallel (Recommended)**: multiple sub-agents, faster

**Intra-domain parallelization:** For Tier F-full, when a domain has 4+ independent tasks (no shared files), spawn multiple agents of the same type (e.g., 2 `frontend-dev` agents on separate file groups). See scaffold Step 2c and review Phases 2 and 4 for thresholds.

---

### 5. Git Commits

- Ask before committing unless explicitly requested
- Format: `<type>(<scope>): <description>` + `Co-Authored-By: Claude <model> <noreply@anthropic.com>`
- Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`, `ci`, `perf`
- NEVER push without explicit request
- NEVER use `--force`, `--hard`, `--amend` (unless explicitly requested)
- Pre-commit hook fails → fix + NEW commit (never amend)
- Full spec → [docs/contributing.mdx](docs/contributing.mdx)

---

### 6. Mandatory Worktree (All Tiers) (CRITICAL)

**ALL code changes require a worktree. Create worktree BEFORE coding:**

```bash
git worktree add ../roxabi-XXX -b feat/XXX-slug staging
cd ../roxabi-XXX
cp .env.example .env && bun install
cd apps/api && bun run db:branch:create --force XXX
```

> XXX = GitHub issue number (e.g., 123), slug = short description

**XS exception:** single file, <1h, zero risk → confirm via `AskUserQuestion`. If approved, direct branch OK.

**Bootstrap exception:** `/bootstrap` commits analyses/specs to staging (doc artifacts, not code).

**Promote exception:** `/promote` commits changelog/release notes to staging (release artifacts, not code).

**FORBIDDEN: Modifying code files on main/staging without a worktree.**

---

### 7. Code Review (CRITICAL)

**When reviewing PRs or code: MUST read [docs/standards/code-review.mdx](docs/standards/code-review.mdx).**

- Use **Conventional Comments** format
- Block only for: security, correctness bugs, standard violations

---

### 8. Coding Standards (CRITICAL)

**Writing code → read relevant standards:**

| Context | MUST read |
|---------|-----------|
| React / TanStack components | [docs/standards/frontend-patterns.mdx](docs/standards/frontend-patterns.mdx) |
| NestJS / API code | [docs/standards/backend-patterns.mdx](docs/standards/backend-patterns.mdx) |
| Tests | [docs/standards/testing.mdx](docs/standards/testing.mdx) |
| Documentation | [docs/contributing.mdx](docs/contributing.mdx) |
| Issues / blockers | [docs/processes/issue-management.mdx](docs/processes/issue-management.mdx) |

---

## Skills & Agents

- **Skills:** ALWAYS use appropriate skill even without slash command. Details → `.claude/skills/*/SKILL.md`.
- **Agents:** Rules → [AGENTS.md](AGENTS.md). Definitions → `.claude/agents/*.md`. Guide → [docs/guides/agent-teams.mdx](docs/guides/agent-teams.mdx).

### Shared Agent Rules (all agents)

- **NEVER commit or push** — the lead handles all git operations
- **NEVER use** `--force`, `--hard`, or `--amend`
- **Stage specific files** — never `git add -A` or `git add .`
- **Escalate blockers** — message the lead with a clear description
- **Claim tasks** from the shared task list matching your domain, mark complete when done
- **Create follow-up tasks** for cross-domain needs or next-stage work
- **Security concerns** — message the lead + security-auditor immediately
- **Message the lead** when all assigned work is complete

---

## Gotchas

- **`bun test` ≠ `bun run test`**: `bun test` → Bun's built-in runner (infinite CPU spin). Use `bun run test` (Vitest). Hook blocks it, but know why.
- **`turbo.jsonc`** not `turbo.json`: JSONC with comments. Tools expecting `.json` miss it.
- **`useImportType: off` for `apps/api/`**: NestJS needs runtime imports for DI. Biome override disables for API only.
- **Node ≥24**: Set in `package.json` engines. Bun 1.3.9 = package manager.
- **Orphaned dev ports**: Ctrl+C may leave zombies. `bun run dev:clean` kills ports 42069/4000/3000.
- **DB branches**: Each worktree → own Postgres schema via `db:branch:create --force XXX`.
- **Paraglide i18n**: Translations compiled during `codegen` task — `src/paraglide/` is gitignored.
- **Biome schema sync**: Upgrading `@biomejs/biome` in `package.json` requires updating `$schema` version in `biome.json` to match.
- **GitHub sub-issues**: Parent/child issue relationships use the `addSubIssue` GraphQL mutation — markdown checklists in the body are not real links. Use `/issue-triage` skill with `--parent` or `--add-child` flags.
- **Post-rebase installs**: After rebasing onto commits that add new package build steps, run `bun install` before pushing or builds may fail with "command not found".

---

## Reference

### Documentation

| Topic | Path |
|-------|------|
| **Getting started** | [docs/getting-started.mdx](docs/getting-started.mdx) |
| **Configuration & setup** | [docs/configuration.mdx](docs/configuration.mdx) |
| **Development process** | [docs/processes/dev-process.mdx](docs/processes/dev-process.mdx) |
| **Issue management** | [docs/processes/issue-management.mdx](docs/processes/issue-management.mdx) |
| **Architecture** | [docs/architecture/](docs/architecture/) |
| **Frontend patterns** | [docs/standards/frontend-patterns.mdx](docs/standards/frontend-patterns.mdx) |
| **Backend patterns** | [docs/standards/backend-patterns.mdx](docs/standards/backend-patterns.mdx) |
| **Testing standards** | [docs/standards/testing.mdx](docs/standards/testing.mdx) |
| **Code review** | [docs/standards/code-review.mdx](docs/standards/code-review.mdx) |
| **Contributing & MDX** | [docs/contributing.mdx](docs/contributing.mdx) |
| **Deployment** | [docs/guides/deployment.mdx](docs/guides/deployment.mdx) |
| **Authentication** | [docs/guides/authentication.mdx](docs/guides/authentication.mdx) |
| **Agent Teams** | [docs/guides/agent-teams.mdx](docs/guides/agent-teams.mdx) + [AGENTS.md](AGENTS.md) |
| **Vision & roadmap** | [docs/vision.mdx](docs/vision.mdx) |
| **Specs & analyses** | [specs/](specs/) + [analyses/](analyses/) |

### Deployment

Push `main` → Vercel production. Push `staging` → preview deploy via CD. Details → [docs/guides/deployment.mdx](docs/guides/deployment.mdx).

| Project | Root Directory | Framework |
|---------|---------------|-----------|
| Web | `apps/web` | TanStack Start / Nitro |
| API | `apps/api` | NestJS (zero-config) |

### Hooks

#### Claude Code Hooks (`.claude/settings.json`)

- **Biome** (PostToolUse): Auto-format + lint on every file Edit/Write (`.ts/.tsx/.js/.jsx/.json`)
- **Security** (PreToolUse): Warn about dangerous patterns before file changes
- **`bun test` blocker** (PreToolUse): Blocks bare `bun test` commands — enforces `bun run test` (Vitest)

#### Git Hooks (Lefthook — `lefthook.yml`)

- **pre-commit**: Biome check + auto-fix on staged files
- **commit-msg**: Commitlint validates Conventional Commits format
- **pre-push**: Full lint, typecheck (`bun run typecheck`), and test coverage
