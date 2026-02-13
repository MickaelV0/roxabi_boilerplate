---
argument-hint: [--all | -m "message"]
description: Commit staged changes with Conventional Commits validation and guard rails.
allowed-tools: Bash, AskUserQuestion, Read, Grep
---

# Commit

Enforce commit conventions and guard against common mistakes. Automates the mechanical parts of committing while keeping the user in control.

## Usage

```
/commit                    → Interactive commit of staged changes
/commit --all              → Stage all modified tracked files, then commit
/commit -m "message"       → Commit with provided message (used as-is)
```

## Instructions

### 1. Gather State

Run these commands and collect the output:

```bash
# Current branch
git branch --show-current

# Staged and unstaged changes
git status

# Summary of what will be committed
git diff --cached --stat

# Recent commits for style reference
git log --oneline -5
```

**If nothing is staged and `--all` was NOT passed:** warn the user and ask what to stage via `AskUserQuestion`. Do NOT proceed with an empty commit.

**If `--all` was passed:** run `git add -u` (tracked files only, never `git add -A`) before continuing.

### 2. Guard Rails

Run these checks on staged files before generating a commit message. If any check fails, report ALL failures together (do not stop at the first one).

#### Scope check

If staged changes span **more than 3 files** and the working directory is NOT a worktree (i.e., the main repo checkout):

> "You're modifying {N} files on `{branch}`. Consider using a worktree (required for Tier F)."

Present this as a **warning** via `AskUserQuestion` with options to continue or abort. Do NOT block.

Detect worktree: `test "$(git rev-parse --git-dir)" != ".git"` — returns true when inside a worktree.

#### Debug check

Scan staged files for leftover debug artifacts:

```bash
git diff --cached -G '(console\.log|debugger|\.only\()' --name-only
```

If matches found, warn:

> "Debug artifacts found in: {files}. `console.log`, `debugger`, or `.only()` detected."

Ask the user to confirm or abort via `AskUserQuestion`.

#### Secret file check

**Block** the commit if any of these patterns appear in staged file paths:

- `.env` (exact or prefix, e.g., `.env.local`, `.env.production`)
- `credentials.json`
- `*.pem`, `*.key`
- `secret*`, `*secret*`

```bash
git diff --cached --name-only | grep -iE '(\.env|credentials\.json|\.pem$|\.key$|secret)'
```

If found, **refuse to commit** and tell the user to unstage those files. Do NOT offer to continue.

> Note: In-code secret patterns (API keys, tokens) are handled by pre-commit hooks, not this skill.

#### Merge conflict check

Scan staged files for unresolved conflict markers:

```bash
git diff --cached -S '<<<<<<< ' --name-only
```

If found, **refuse to commit**:

> "Unresolved merge conflict markers found in: {files}. Resolve conflicts before committing."

### 3. Generate Commit Message

If the user passed `-m "message"`, use that message as-is.

If no message was provided, generate one:

#### Determine type

Analyze the diff to determine the commit type:

| Type | When |
|------|------|
| `feat` | New functionality, new files with business logic |
| `fix` | Bug fixes, error corrections |
| `refactor` | Code restructuring, no behavior change |
| `docs` | Documentation only (`.md`, `.mdx`, `SKILL.md`, etc.) |
| `style` | Formatting, whitespace, linting fixes |
| `test` | Adding or updating tests |
| `chore` | Config, dependencies, tooling |
| `ci` | CI/CD pipeline changes |
| `perf` | Performance improvements |

#### Determine scope

Detect scope from file paths:

| Path prefix | Scope |
|-------------|-------|
| `apps/web/` | `web` |
| `apps/api/` | `api` |
| `packages/ui/` | `ui` |
| `packages/types/` | `types` |
| `packages/config/` | `config` |
| `.claude/` | `claude` |
| `docs/` | `docs` |

If files span multiple scopes, pick the dominant one. If truly mixed, omit the scope.

#### Detect linked issue

Extract issue number from the branch name:

```bash
# Branch patterns: feat/42-auth, fix/15-login, hotfix/42-urgent-fix
git branch --show-current | grep -oP '\d+' | head -1
```

If found, include `Refs #<issue>` in the commit footer.

#### Format

```
<type>(<scope>): <description>

<optional body — only if the diff is non-trivial>

Refs #<issue>

Co-Authored-By: Claude <model> <noreply@anthropic.com>
```

Rules:
- Description is imperative mood, lowercase, no period at end
- Description under 72 characters
- Body wraps at 72 characters
- One blank line between sections

### 4. Commit

**Display the commit message** to the user, then commit immediately without asking for confirmation.

Execute the commit using HEREDOC format:

```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <description>

<body>

Refs #<issue>

Co-Authored-By: Claude <model> <noreply@anthropic.com>
EOF
)"
```

Replace `<model>` with the actual model name (e.g., `Claude Opus 4.6`).

**After commit:** run `git log --oneline -1` to confirm and show the result to the user.

### 5. Handle Pre-commit Hook Failure

If the commit fails due to a pre-commit hook:

1. Read the hook error output carefully
2. Identify what failed (lint, format, type check, etc.)
3. Offer to fix the issues via `AskUserQuestion`
4. If user agrees: fix the files, re-stage with `git add <specific files>`, and create a **NEW commit** (same message)
5. **NEVER use `git commit --amend`** — the failed commit did not happen, so amending would modify the previous commit

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Nothing staged, no `--all` | Warn, ask what to stage |
| Nothing staged, `--all` but no changes | Inform user "nothing to commit", stop |
| Pre-commit hook failure | Fix, re-stage, NEW commit (never amend) |
| Merge conflict markers in staged files | Block commit, list affected files |
| Branch has no issue number | Omit `Refs #` footer line |
| User passes `-m` with non-conforming message | Use as-is |

## Safety Rules

1. **NEVER run `git add -A` or `git add .`** — always add specific files or use `git add -u` for `--all`
2. **NEVER use `git commit --amend`** unless the user explicitly requests it
3. **NEVER commit secret files** (`.env`, `credentials.json`, `*.pem`, `*.key`)
4. **NEVER push** — committing is the only action; pushing is a separate concern
5. **ALWAYS use HEREDOC** for commit messages to preserve formatting

$ARGUMENTS
