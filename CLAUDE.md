# Claude Configuration

## TL;DR

- **Project:** Roxabi Boilerplate — SaaS framework (Bun, TurboRepo, TypeScript, TanStack Start, NestJS, Vercel)
- **Before any work:** Read [dev-process.mdx](docs/processes/dev-process.mdx) to determine tier (S / F-lite / F-full)
- **All code changes** require a worktree — `git worktree add ../roxabi-XXX -b feat/XXX-slug staging`
- **Always** use `AskUserQuestion` for multiple-choice questions — never ask in plain text
- **Never** commit without asking, push without explicit request, or use `--force`/`--hard`/`--amend`
- **Always** use the appropriate skill (see [Available Skills](#available-skills)) even without a slash command
- **Before writing code:** Read the relevant standards doc (see [Rule 7](#7-coding-standards-critical))

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

For full architecture, monorepo structure, and commands: MUST read [docs/architecture/](docs/architecture/) and [docs/configuration.mdx](docs/configuration.mdx).

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

### 3. Parallel Execution for Large Tasks

When detecting a large workload (3+ complex tasks, migrations, or multi-component implementations), **ALWAYS propose execution mode** using `AskUserQuestion`:
- **Sequential**: One task at a time, better control
- **Parallel (Recommended)**: Multiple sub-agents, much faster

---

### 4. Git Commits

- **ALWAYS ask before committing** unless explicitly requested
- Format: `<type>(<scope>): <description>` with `Co-Authored-By: Claude <model> <noreply@anthropic.com>`
- Types: `feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `test:`, `chore:`, `ci:`, `perf:`
- **NEVER push without explicit request**
- **NEVER use** `--force`, `--hard`, `--amend` (unless explicitly requested)
- If pre-commit hook fails: fix and create a NEW commit (never amend)
- For full Conventional Commits spec: MUST read [docs/contributing.mdx](docs/contributing.mdx)

---

### 5. Mandatory Worktree (All Tiers) (CRITICAL)

**ALL code changes require a worktree. Create worktree BEFORE coding:**

```bash
git worktree add ../roxabi-XXX -b feat/XXX-slug staging
cd ../roxabi-XXX
cp .env.example .env && bun install
cd apps/api && bun run db:branch:create --force XXX
```

> XXX = GitHub issue number (e.g., 123), slug = short description

**XS exception:** For Size XS changes (single file, &lt;1h, zero risk), use `AskUserQuestion` to confirm with the lead. If approved, a direct branch from staging is acceptable without worktree.

**Bootstrap exception:** `/bootstrap` commits analysis and spec documents (`docs/analyses/`, `docs/specs/`) directly to staging. These are documentation artifacts, not code changes, and are produced before scaffold creates a worktree.

**FORBIDDEN: Modifying code files on main/staging without a worktree.**

---

### 6. Code Review (CRITICAL)

**When reviewing PRs or code: MUST read [docs/standards/code-review.mdx](docs/standards/code-review.mdx).**

- Use **Conventional Comments** format for all review comments
- Follow the review checklist
- Block only for: security issues, correctness bugs, or documented standard violations

---

### 7. Coding Standards (CRITICAL)

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
| documentation, library docs, lookup | `context7` | "look up React docs", "check API reference", "/context7" |
| promote, release, staging to main, finalize | `promote` | "promote staging", "release to production", "/promote", "/promote --finalize" |
| deploy, vercel deploy | `vercel:deploy` | "deploy to Vercel", "push to production", "go live" |
| vercel setup, configure vercel | `vercel:setup` | "set up Vercel", "configure Vercel", "link to Vercel" |
| vercel logs, check logs | `vercel:logs` | "show Vercel logs", "check deployment logs" |
| frontend design, build UI, create page | `frontend-design` | "design a landing page", "build this component", "/frontend-design" |

**Important notes:**
- ALWAYS use the appropriate skill even if user doesn't explicitly mention the slash command
- Full details: each skill's `SKILL.md` in `.claude/skills/`

---

## Agent Teams (Experimental)

Specialized agents for multi-agent coordination. Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

### Available Agents

| Agent | Tier | Domain | Permission | Tools |
|-------|------|--------|------------|-------|
| `frontend-dev` | Domain | `apps/web`, `packages/ui` | bypassPermissions | Read, Write, Edit, Glob, Grep, Bash, WebSearch, Task, SendMessage |
| `backend-dev` | Domain | `apps/api`, `packages/types` | bypassPermissions | Read, Write, Edit, Glob, Grep, Bash, WebSearch, Task, SendMessage |
| `devops` | Domain | `packages/config`, root configs | bypassPermissions | Read, Write, Edit, Glob, Grep, Bash, WebSearch, Task, SendMessage |
| `fixer` | Quality | All packages | bypassPermissions | Read, Write, Edit, Glob, Grep, Bash, WebSearch, SendMessage |
| `tester` | Quality | All packages | bypassPermissions | Read, Write, Edit, Glob, Grep, Bash, WebSearch, Task, SendMessage |
| `security-auditor` | Quality | All packages | plan | Read, Glob, Grep, Bash, WebSearch, Task, SendMessage |
| `architect` | Strategy | All packages | bypassPermissions | Read, Write, Edit, Glob, Grep, Bash, WebSearch, Task, TeamCreate, TeamDelete, SendMessage |
| `product-lead` | Strategy | `docs/analyses/`, `docs/specs/`, GitHub issues | bypassPermissions | Read, Write, Edit, Glob, Grep, Bash, WebSearch, Task, TeamCreate, TeamDelete, SendMessage |
| `doc-writer` | Strategy | `docs/`, `CLAUDE.md` | bypassPermissions | Read, Write, Edit, Glob, Grep, Bash, WebSearch, Task, SendMessage |

### Routing Decision Tree

> Source of truth: [docs/guides/agent-teams.mdx](docs/guides/agent-teams.mdx). Update the guide first, then sync here.

```
Is this a code change?
├── No (docs only) → doc-writer subagent
└── Yes
    ├── Tier S (<=3 files, no arch risk)
    │   └── Single session + optional tester subagent
    │
    ├── Tier F-lite (clear scope, documented requirements)
    │   ├── /scaffold (spec → PR, skip bootstrap):
    │   │   ├── Single-domain → subagents (Task tool)
    │   │   └── Multi-domain  → Agent Teams (TeamCreate)
    │   │   ├── Frontend? → frontend-dev + tester
    │   │   ├── Backend?  → backend-dev + tester
    │   │   ├── Full-stack? → frontend-dev + backend-dev + tester
    │   │   └── Security-sensitive? → + security-auditor
    │   └── Then /review (fresh domain reviewers + 1b1 + fixer)
    │
    └── Tier F-full (new arch, unclear requirements, >2 domains)
        ├── /bootstrap (idea → spec): direct orchestration + expert review (architect, doc-writer, devops, product-lead — configurable)
        ├── /scaffold (spec → PR):
        │   ├── Single-domain → subagents (Task tool)
        │   └── Multi-domain  → Agent Teams (TeamCreate)
        │   ├── Frontend? → frontend-dev + tester
        │   ├── Backend?  → backend-dev + tester
        │   ├── Full-stack? → frontend-dev + backend-dev + tester
        │   ├── Large scope? → + architect + doc-writer
        │   └── Security-sensitive? → + security-auditor
        └── Then /review (fresh domain reviewers + 1b1 + fixer)
```

Agent definitions: `.claude/agents/*.md`

---

## Reference

### Documentation

| Topic | Documentation |
|-------|---------------|
| Development process | [docs/processes/dev-process.mdx](docs/processes/dev-process.mdx) |
| Issue management | [docs/processes/issue-management.mdx](docs/processes/issue-management.mdx) |
| Processes | [docs/processes/](docs/processes/) |
| Architecture | [docs/architecture/](docs/architecture/) |
| Analyses (pre-spec) | [docs/analyses/](docs/analyses/) |
| Feature specifications | [docs/specs/](docs/specs/) |
| Coding standards | [docs/standards/](docs/standards/) |
| Frontend patterns | [docs/standards/frontend-patterns.mdx](docs/standards/frontend-patterns.mdx) |
| Backend patterns | [docs/standards/backend-patterns.mdx](docs/standards/backend-patterns.mdx) |
| Testing | [docs/standards/testing.mdx](docs/standards/testing.mdx) |
| Code review | [docs/standards/code-review.mdx](docs/standards/code-review.mdx) |
| Vision & roadmap | [docs/vision.mdx](docs/vision.mdx) |
| Configuration & setup | [docs/configuration.mdx](docs/configuration.mdx) |
| Getting started | [docs/getting-started.mdx](docs/getting-started.mdx) |
| Contributing & MDX guide | [docs/contributing.mdx](docs/contributing.mdx) |
| Guides | [docs/guides/](docs/guides/) |
| Authentication guide | [docs/guides/authentication.mdx](docs/guides/authentication.mdx) |
| Agent Teams guide | [docs/guides/agent-teams.mdx](docs/guides/agent-teams.mdx) |
| Agent Teams coordination | [AGENTS.md](AGENTS.md) |
| Troubleshooting | [docs/guides/troubleshooting.mdx](docs/guides/troubleshooting.mdx) |
| Hooks | [docs/hooks.mdx](docs/hooks.mdx) |
| Deployment | [docs/guides/deployment.mdx](docs/guides/deployment.mdx) |

### Deployment

Both apps deploy to **Vercel** automatically on push to `main`. See [docs/guides/deployment.mdx](docs/guides/deployment.mdx) for full setup.

| Project | Root Directory | Framework |
|---------|---------------|-----------|
| Web | `apps/web` | TanStack Start / Nitro |
| API | `apps/api` | NestJS (zero-config) |

#### Vercel CLI

The `vercel` CLI is available for deployment management:

```bash
vercel ls                        # List deployments
vercel env ls                    # List environment variables
vercel env add SECRET_NAME       # Add environment variable
vercel logs <url>                # View deployment logs
vercel inspect <url>             # Inspect a deployment
vercel promote <url>             # Promote to production
vercel redeploy                  # Trigger a redeploy
```

**Prefer Vercel CLI over browser automation** for deployment tasks (env vars, redeploys, logs, rollbacks). When browser interaction is needed (e.g., initial project creation, visual verification), use the `/agent-browser` skill.

### Hooks

#### Claude Code Hooks (`.claude/settings.json`)

- **Biome** (PostToolUse): Auto-format + lint on every file Edit/Write (`.ts/.tsx/.js/.jsx/.json`)
- **Security** (PreToolUse): Warn about dangerous patterns before file changes

#### Git Hooks (Lefthook — `lefthook.yml`)

- **pre-commit**: Biome check + auto-fix on staged files
- **commit-msg**: Commitlint validates Conventional Commits format
- **pre-push**: Full lint, typecheck (`bun run typecheck`), and test coverage
