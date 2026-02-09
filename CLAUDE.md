# Claude Configuration

## Documentation

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
| Contributing & MDX guide | [docs/contributing.mdx](docs/contributing.mdx) |
| Guides | [docs/guides/](docs/guides/) |
| Agent Teams guide | [docs/guides/agent-teams.mdx](docs/guides/agent-teams.mdx) |
| Agent Teams coordination | [AGENTS.md](AGENTS.md) |
| Hooks | [docs/hooks.mdx](docs/hooks.mdx) |

---

## Critical Rules

### 1. Development Process (CRITICAL)

**BEFORE ANY SPEC, CODE CHANGE, OR PR REVIEW: MUST read [dev-process.mdx](docs/processes/dev-process.mdx) in full.**

This applies to ALL development work: specs, features, bug fixes, refactoring, docs, tests, PR reviews. **NO EXCEPTIONS.**

**Tier determination:**

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
- For full Conventional Commits spec: MUST read [docs/contributing.mdx](docs/contributing.mdx)

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
| issue triage, labeling, status update | `issue-triage` | "triage issues", "label open issues", "update issue status" |
| interview, spec, brainstorm, analysis | `interview` | "create a spec", "interview for feature", "brainstorm ideas" |
| cleanup, git cleanup | `cleanup` | "clean branches", "cleanup worktrees", "/cleanup" |
| commit, stage, git commit | `commit` | "commit changes", "commit staged files", "/commit --all" |
| pull request, PR, create PR | `pr` | "create a PR", "open pull request", "/pr --draft" |
| review, code review | `review` | "review my changes", "review PR #42", "/review --fix" |
| test, generate tests | `test` | "write tests", "test this file", "/test --e2e" |
| bootstrap, plan feature, start feature | `bootstrap` | "bootstrap avatar upload", "/bootstrap --issue 42" |
| scaffold, setup feature | `scaffold` | "scaffold from spec", "/scaffold --spec 42" |
| plan, implementation plan | `plan` | "plan the implementation", "/plan --spec 42" |
| 1b1, one by one, walk through | `1b1` | "go through these one by one", "/1b1" |
| adr, architecture decision | `adr` | "create an ADR", "list ADRs", "/adr --list" |
| browser, open website, screenshot | `agent-browser` | "open a website", "take a screenshot", "/agent-browser" |
| documentation, library docs, lookup | `context7` | "look up React docs", "check API reference", "/context7" |

**Important notes:**
- ALWAYS use the appropriate skill even if user doesn't explicitly mention the slash command
- Full details: each skill's `SKILL.md` in `.claude/skills/`

---

## Project Overview

Roxabi Boilerplate - SaaS framework with integrated AI team.

For project vision, principles, and roadmap: see [docs/vision.mdx](docs/vision.mdx).

## Tech Stack

- **Runtime**: Bun
- **Monorepo**: TurboRepo
- **Language**: TypeScript 5.x (strict mode)
- **Linting/Formatting**: Biome
- **Frontend**: TanStack Start
- **Backend**: NestJS + Fastify

For full architecture, monorepo structure, and commands: MUST read [docs/architecture/](docs/architecture/) and [docs/configuration.mdx](docs/configuration.mdx).

## Agent Teams (Experimental)

Specialized agents for multi-agent coordination. Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

### Available Agents

| Agent | Tier | Domain | Tools |
|-------|------|--------|-------|
| `frontend-dev` | Domain | `apps/web`, `packages/ui` | Read, Write, Edit, Glob, Grep, Bash |
| `backend-dev` | Domain | `apps/api`, `packages/types` | Read, Write, Edit, Glob, Grep, Bash |
| `infra-ops` | Domain | `packages/config`, root configs | Read, Write, Edit, Glob, Grep, Bash |
| `reviewer` | Quality | All packages (read-only) | Read, Glob, Grep |
| `tester` | Quality | All packages | Read, Write, Edit, Glob, Grep, Bash |
| `security-auditor` | Quality | All packages | Read, Glob, Grep, Bash |
| `architect` | Strategy | All packages | Read, Glob, Grep, Bash |
| `business-analyst` | Strategy | `docs/` | Read, Glob, Grep, WebSearch |
| `product-manager` | Strategy | `docs/`, GitHub issues | Read, Glob, Grep, Bash |
| `doc-writer` | Strategy | `docs/`, `CLAUDE.md` | Read, Write, Edit, Glob, Grep |

### Routing Decision Tree

> Source of truth: [docs/guides/agent-teams.mdx](docs/guides/agent-teams.mdx). Update the guide first, then sync here.

```
Is this a code change?
├── No (docs only) → doc-writer alone (or single agent)
└── Yes
    ├── Tier S (≤3 files, no arch risk)
    │   └── Single agent session (no agent teams)
    │
    ├── Tier M (3-10 files, local arch)
    │   ├── Frontend only? → frontend-dev + reviewer + tester
    │   ├── Backend only?  → backend-dev + reviewer + tester
    │   ├── Full-stack?    → frontend-dev + backend-dev + reviewer + tester
    │   └── + architect (if design decisions needed)
    │
    └── Tier L (>10 files, system arch)
        └── Full team or near-full team:
            ├── Always: architect + domain agents + reviewer + tester
            ├── If new feature: + business-analyst + product-manager
            ├── If security-sensitive: + security-auditor
            └── If docs impact: + doc-writer
```

Agent definitions: `.claude/agents/*.md`

---

## Hooks

Claude Code hooks are configured in `.claude/settings.json`:

- **Biome**: Auto-format on file changes
- **TypeCheck**: Validate types on file changes
- **Security**: Warn about dangerous patterns
