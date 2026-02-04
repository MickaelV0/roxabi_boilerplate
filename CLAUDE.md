# Claude Configuration

## Documentation

| Topic | Documentation |
|-------|---------------|
| Development process | [.claude/processes/dev-process.md](.claude/processes/dev-process.md) |
| Documentation (Fumadocs) | [docs/](docs/) |
| Feature specifications | [docs/specs/](docs/specs/) |

---

## Critical Rules

### 1. Development Process (CRITICAL)

**BEFORE ANY SPEC, CODE CHANGE, OR PR REVIEW: Read [dev-process.md](.claude/processes/dev-process.md) in full.**

This applies to ALL development work: specs, features, bug fixes, refactoring, docs, tests, PR reviews. **NO EXCEPTIONS.**

**Tier determination:**

```
New architecture or system-wide change? ─────────────────► Tier L
More than 10 files? ─────────────────────────────────────► Tier L
More than 3 files? ──────────────────────────────────────► Tier M
Regression risk or complex logic? ───────────────────────► Tier M
Otherwise ───────────────────────────────────────────────► Tier S
```

| Tier | Name | Criteria | Process |
|------|------|----------|---------|
| **L** | Feature/Migration | >10 files, system arch | Full spec + worktree |
| **M** | Feature Light | 3-10 files, local arch | Worktree + light review |
| **S** | Quick Fix | ≤3 files, no arch, no risk | Direct branch + PR |

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
- Types: `feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `test:`, `chore:`
- **NEVER push without explicit request**
- **NEVER use** `--force`, `--hard`, `--amend` (unless explicitly requested)
- If pre-commit hook fails: fix and create a NEW commit (never amend)

---

### 5. Mandatory Worktree (Tier M/L) (CRITICAL)

**BEFORE writing code, determine the tier:**

| Criteria | Tier | Action |
|----------|------|--------|
| ≤3 files, no risk | **S** | Branch + direct PR |
| 3-10 files | **M** | **WORKTREE MANDATORY** |
| >10 files or system arch | **L** | **WORKTREE MANDATORY** |

**If Tier M or L, create worktree BEFORE coding:**

```bash
git worktree add ../roxabi-XXX -b feat/XXX-slug
cd ../roxabi-XXX
```

> XXX = GitHub issue number (e.g., 123), slug = short description

**FORBIDDEN: Modifying more than 3 files on main without worktree.**

---

## Available Skills

| Trigger | Skill | Examples |
|---------|-------|----------|
| issues, list issues | `issues` | "list GitHub issues", "/issues" |
| issue triage, labeling | `issue-triage` | "triage issues", "label open issues" |
| interview, spec | `interview` | "create a spec", "interview for feature" |
| playground, explorer | `playground` | "create a playground", "interactive tool for X" |

**Important notes:**
- ALWAYS use the appropriate skill even if user doesn't explicitly mention the slash command
- Full details: each skill's `SKILL.md` in `.claude/skills/`

---

## Project Overview

Roxabi Boilerplate - SaaS framework with integrated AI team.

## Tech Stack

- **Runtime**: Bun
- **Monorepo**: TurboRepo
- **Language**: TypeScript 5.x (strict mode)
- **Linting/Formatting**: Biome
- **Frontend**: TanStack Start
- **Backend**: NestJS + Fastify

## Conventions

### Code Style

- Use Biome for linting and formatting
- TypeScript strict mode enabled
- Prefer functional patterns where appropriate
- Use named exports over default exports

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `camelCase.types.ts`
- Tests: `*.test.ts` or `*.spec.ts`

### Imports

- Use path aliases (`@/`, `@repo/`)
- Group imports: external, internal, relative
- No circular dependencies

## Commands

```bash
bun install          # Install dependencies
bun dev              # Run all apps in dev mode
bun build            # Build all packages
bun lint             # Run Biome linter
bun format           # Format with Biome
bun typecheck        # TypeScript type checking
bun run test         # Run tests (via turbo + vitest)
bun docs             # Start documentation server (runs apps/web)
```

> **Important**: Use `bun run test` (not `bun test`). The `bun test` command invokes Bun's built-in test runner which ignores vitest configs. The `bun run test` command runs the `test` script which uses turbo to run vitest in each package with proper configuration.

## Monorepo Structure

- `apps/web` - Frontend application (includes documentation at `/docs`)
- `apps/api` - Backend API
- `packages/ui` - Shared UI components
- `packages/config` - Shared configurations
- `packages/types` - Shared TypeScript types
- `docs/` - Documentation content (MDX files)

## Documentation

Documentation uses Fumadocs with MDX format. All docs are in the `docs/` folder.

### Creating Documentation Files

Files must be `.mdx` with frontmatter:

```mdx
---
title: Page Title
description: Brief description for SEO and previews
---

Content here...
```

### Folder Structure

```
docs/
├── index.mdx           # Home page
├── getting-started.mdx # Main docs
├── meta.json           # Navigation order
├── analyses/           # Technical analyses
│   ├── meta.json
│   └── *.mdx
└── specs/              # Feature specifications
    ├── meta.json
    └── *.mdx
```

### Adding New Pages

1. Create `.mdx` file with frontmatter
2. Add filename (without extension) to `meta.json` in the `pages` array
3. Run `bun docs` to preview

### Special Characters in MDX

Escape `<` as `&lt;` to avoid JSX parsing errors (e.g., `&lt;50KB` instead of `<50KB`).

## Hooks

Claude Code hooks are configured in `.claude/settings.json`:

- **Biome**: Auto-format on file changes
- **TypeCheck**: Validate types on file changes
- **Security**: Warn about dangerous patterns
