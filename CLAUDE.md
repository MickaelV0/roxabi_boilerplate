# Claude Configuration

## TL;DR

- **Project:** Roxabi Boilerplate — SaaS framework (Bun, TurboRepo, TypeScript, TanStack Start, NestJS, Vercel)
- **Before any work:** Read [dev-process.mdx](docs/processes/dev-process.mdx) to determine tier (S / F-lite / F-full)
- **All code changes** require a worktree — `git worktree add ../roxabi-XXX -b feat/XXX-slug staging`
- **Always** use `AskUserQuestion` for multiple-choice questions — never ask in plain text
- **Never** commit without asking, push without explicit request, or use `--force`/`--hard`/`--amend`
- **Always** use the appropriate skill (see [Available Skills](#available-skills)) even without a slash command
- **Before writing code:** Read the relevant standards doc (see [Rule 8](#8-coding-standards-critical))
- **Orchestrator** delegates all code/docs/deploy changes to agents — only minor fixes directly

---

## Project Overview

Roxabi Boilerplate - SaaS framework with integrated AI team.

For project vision, principles, and roadmap: see [docs/vision.mdx](docs/vision.mdx).

### Tech Stack

- **Runtime**: Bun
- **Monorepo**: TurboRepo
- **Language**: TypeScript 5.x (strict mode)
- **Linting/Formatting**: Biome
- **Frontend**: TanStack Start
- **Backend**: NestJS + Fastify
- **Deployment**: Vercel (both web + API)
- **Code Style**: Biome — single quotes, no semicolons, 2-space indent, 100-char line width
- **DB/ORM**: Drizzle ORM + PostgreSQL 16 (Docker local, Neon on Vercel)

### Quick Start

```bash
cp .env.example .env && bun install      # first-time setup
bun run dev                               # start all apps (web :3000, API :4000)
```

For full environment and configuration details: see [docs/configuration.mdx](docs/configuration.mdx).

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

---

## Critical Rules

### 1. Development Process (CRITICAL)

**BEFORE ANY SPEC, CODE CHANGE, OR PR REVIEW: MUST read [dev-process.mdx](docs/processes/dev-process.mdx) in full.**

This applies to ALL development work: specs, features, bug fixes, refactoring, docs, tests, PR reviews. **NO EXCEPTIONS.**

**Tier determination (judgment-based):**

| Tier | Name | Criteria | Process |
|------|------|----------|---------|
| **S** | Quick Fix | <=3 files, no arch, no risk | Worktree + PR |
| **F-lite** | Feature (lite) | Clear scope, documented requirements, single domain | Worktree + agents + /review (skip bootstrap) |
| **F-full** | Feature (full) | New arch concepts, unclear requirements, or >2 domain boundaries | Bootstrap + worktree + agents + /review |

---

### 2. AskUserQuestion (CRITICAL)

**ALWAYS use the `AskUserQuestion` tool when:**

1. Asking multiple-choice questions (2+ options)
2. Requesting a decision or validation
3. Proposing multiple approaches/solutions
4. Asking for preferences or priorities

**FORBIDDEN: Asking multiple-choice questions in plain text**

If you find yourself writing "Do you want me to...", "Should I...", "Do you prefer..." or any question with choices, **STOP** and use `AskUserQuestion` immediately.

---

### 3. Orchestrator Delegation (CRITICAL)

**The orchestrator (main Claude session) must NOT directly modify code or documentation files.** Delegate all changes to the appropriate specialized agent:

- **Frontend code** → `frontend-dev`
- **Backend code** → `backend-dev`
- **Configuration / infra / deployment** → `devops`
- **Documentation** → `doc-writer`
- **Tests** → `tester`
- **Review fixes** → `fixer`

**Exception:** Truly minor changes (typo fix, single-line config tweak) may be done directly by the orchestrator when spawning an agent would be disproportionate overhead. Use judgment — if in doubt, delegate.

**Deployment tasks** (preview deploys, production deploys, env var management) **MUST be handled by the `devops` agent**, never by the orchestrator directly.

---

### 4. Parallel Execution for Large Tasks

When detecting a large workload (3+ complex tasks, migrations, or multi-component implementations), **ALWAYS propose execution mode** using `AskUserQuestion`:
- **Sequential**: One task at a time, better control
- **Parallel (Recommended)**: Multiple sub-agents, much faster

---

### 5. Git Commits

- **ALWAYS ask before committing** unless explicitly requested
- Format: `<type>(<scope>): <description>` with `Co-Authored-By: Claude <model> <noreply@anthropic.com>`
- Types: `feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `test:`, `chore:`, `ci:`, `perf:`
- **NEVER push without explicit request**
- **NEVER use** `--force`, `--hard`, `--amend` (unless explicitly requested)
- If pre-commit hook fails: fix and create a NEW commit (never amend)
- For full Conventional Commits spec: MUST read [docs/contributing.mdx](docs/contributing.mdx)

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

**XS exception:** For Size XS changes (single file, &lt;1h, zero risk), use `AskUserQuestion` to confirm with the lead. If approved, a direct branch from staging is acceptable without worktree.

**Bootstrap exception:** `/bootstrap` commits analysis and spec documents (`analyses/`, `specs/`) directly to staging. These are documentation artifacts, not code changes, and are produced before scaffold creates a worktree.

**Promote exception:** `/promote` commits changelog and release notes (`CHANGELOG.md`, `docs/changelog/`) directly to staging before creating the staging→main promotion PR. These are release artifacts, not code changes.

**FORBIDDEN: Modifying code files on main/staging without a worktree.**

---

### 7. Code Review (CRITICAL)

**When reviewing PRs or code: MUST read [docs/standards/code-review.mdx](docs/standards/code-review.mdx).**

- Use **Conventional Comments** format for all review comments
- Follow the review checklist
- Block only for: security issues, correctness bugs, or documented standard violations

---

### 8. Coding Standards (CRITICAL)

**When writing or modifying code: MUST read the relevant standards doc.**

| Context | MUST read |
|---------|-----------|
| React / TanStack components | [docs/standards/frontend-patterns.mdx](docs/standards/frontend-patterns.mdx) |
| NestJS / API code | [docs/standards/backend-patterns.mdx](docs/standards/backend-patterns.mdx) |
| Writing or modifying tests | [docs/standards/testing.mdx](docs/standards/testing.mdx) |
| Creating or editing documentation | [docs/contributing.mdx](docs/contributing.mdx) |
| Managing issues or blockers | [docs/processes/issue-management.mdx](docs/processes/issue-management.mdx) |

---

## Available Skills

| Trigger | Skill | Examples |
|---------|-------|----------|
| issues, list issues | `issues` | "list GitHub issues", "/issues" |
| issue triage, create issue, parent/child, blocked by | `issue-triage` | "triage issues", "create issue", "set parent", "add child", "blocked by" |
| interview, spec, brainstorm, analysis | `interview` | "create a spec", "interview for feature", "brainstorm ideas" |
| cleanup, git cleanup | `cleanup` | "clean branches", "cleanup worktrees", "/cleanup" |
| commit, stage, git commit | `commit` | "commit changes", "commit staged files", "/commit --all" |
| pull request, PR, create PR | `pr` | "create a PR", "open pull request", "/pr --draft" |
| review, code review | `review` | "review my changes", "review PR #42", "/review" |
| test, generate tests | `test` | "write tests", "test this file", "/test --e2e" |
| bootstrap, plan feature, start feature | `bootstrap` | "bootstrap avatar upload", "/bootstrap --issue 42" |
| scaffold, execute feature, implement | `scaffold` | "scaffold from spec", "/scaffold --spec 42", "/scaffold --issue 42" |
| 1b1, one by one, walk through | `1b1` | "go through these one by one", "/1b1" |
| adr, architecture decision | `adr` | "create an ADR", "list ADRs", "/adr --list" |
| browser, open website, screenshot | `agent-browser` | "open a website", "take a screenshot", "/agent-browser" |
| documentation, library docs, lookup | `context7` (plugin) | "look up React docs", "check API reference", "/context7" |
| promote, release, staging to main, finalize | `promote` | "promote staging", "release to production", "/promote", "/promote --finalize" |
| frontend design, build UI, create page | `frontend-design` | "design a landing page", "build this component", "/frontend-design" |
| retro, session intelligence, analyze sessions | `retro` | "analyze sessions", "search findings", "/retro --recap" |

**Important notes:**
- ALWAYS use the appropriate skill even if user doesn't explicitly mention the slash command
- Full details: each skill's `SKILL.md` in `.claude/skills/`

---

## Agent Teams

Multi-agent coordination for Tier F-lite/F-full features. Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

| Tier | Agents | Role |
|------|--------|------|
| **Domain** | `frontend-dev`, `backend-dev`, `devops` | Write code in their packages |
| **Quality** | `fixer`, `tester`, `security-auditor` | Fix, test, audit |
| **Strategy** | `architect`, `product-lead`, `doc-writer` | Plan, analyze, document |

**Routing**: See the [Routing Decision Tree](#critical-rules) in the dev process, or the full [Agent Teams Guide](docs/guides/agent-teams.mdx).

Agent definitions: `.claude/agents/*.md` | Coordination rules: [AGENTS.md](AGENTS.md)

---

## Gotchas

- **`bun test` ≠ `bun run test`**: Bare `bun test` invokes Bun's built-in test runner, causing infinite CPU spin. Always use `bun run test` (which runs Vitest). A PreToolUse hook blocks this, but know why.
- **`turbo.jsonc`** not `turbo.json`: TurboRepo config uses JSONC (with comments). Tools expecting `.json` will miss it.
- **`useImportType: off` for `apps/api/`**: NestJS requires runtime imports for dependency injection. Biome override disables this rule for the API package only.
- **Node >=24 required**: Set in `package.json` engines. Bun 1.3.9 is the package manager.
- **Orphaned dev ports**: After Ctrl+C, Nitro/Vite may leave zombie processes. Run `bun run dev:clean` to kill ports 42069/4000/3000.
- **DB branches for worktrees**: Each worktree gets its own Postgres schema via `bun run db:branch:create --force XXX` to avoid cross-contamination.
- **Paraglide i18n codegen**: `apps/web` uses `@inlang/paraglide-js`. Translations are compiled during the `codegen` TurboRepo task — generated files in `src/paraglide/` are gitignored.

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

Both apps deploy to **Vercel** automatically on push to `main`. Preview deploys are triggered by pushing to `staging` via the GitHub CD pipeline. See [docs/guides/deployment.mdx](docs/guides/deployment.mdx) for full setup.

| Project | Root Directory | Framework |
|---------|---------------|-----------|
| Web | `apps/web` | TanStack Start / Nitro |
| API | `apps/api` | NestJS (zero-config) |

### Hooks

#### Claude Code Hooks (`.claude/settings.json`)

- **Biome** (PostToolUse): Auto-format + lint on every file Edit/Write (`.ts/.tsx/.js/.jsx/.json`)
- **Security** (PreToolUse): Warn about dangerous patterns before file changes

#### Git Hooks (Lefthook — `lefthook.yml`)

- **pre-commit**: Biome check + auto-fix on staged files
- **commit-msg**: Commitlint validates Conventional Commits format
- **pre-push**: Full lint, typecheck (`bun run typecheck`), and test coverage
