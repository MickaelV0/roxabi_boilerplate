---
argument-hint: [--branches | --worktrees | --all]
description: Safe git cleanup of branches and worktrees with merge-status verification.
allowed-tools: Bash, AskUserQuestion
---

# Git Cleanup

Safely clean up local git branches and worktrees with **mandatory merge-status verification** before any deletion.

## Instructions

### 1. Gather State

Run all these commands and collect the output:

```bash
# All local branches with tracking info
git branch -vv

# All worktrees
git worktree list

# Open PRs (to avoid cleaning active work)
gh pr list --state open 2>/dev/null || echo "No gh CLI or no remote"

# Current branch
git branch --show-current
```

### 2. Analyze Each Branch

For every branch **except `main`/`master`** and the current branch, determine:

| Check | Command | Safe to delete? |
|-------|---------|-----------------|
| Merged into main? | `git log --oneline main..<branch> \| head -5` | Yes if empty |
| Squash-merged? | `git log --oneline --grep="<branch-or-issue>" main \| head -5` | Yes if found |
| Has open PR? | Check `gh pr list` output | **No** — active work |
| Has worktree? | Check `git worktree list` output | Remove worktree first |
| Last commit age | `git log -1 --format="%cr" <branch>` | Info only |

**CRITICAL**: A branch is only safe to delete if it is **fully merged** (regular or squash merge) AND has **no open PR**.

### 3. Present Summary Table

Display a clear table with ALL branches:

```
Git Cleanup Summary
═══════════════════

Branches:
  Branch              │ Merged │ PR    │ Worktree │ Last Commit  │ Action
  feat/19-auth        │ ✅ yes │ —     │ —        │ 3 days ago   │ 🗑 Safe to delete
  feat/33-i18n        │ ❌ no  │ #42   │ ../rox-33│ 2 hours ago  │ ⚠️ Active work
  fix/old-bug         │ ✅ yes │ —     │ —        │ 2 weeks ago  │ 🗑 Safe to delete
  experiment/test     │ ❌ no  │ —     │ —        │ 1 month ago  │ ⚠️ Unmerged

Worktrees:
  Path                │ Branch          │ Status
  /home/user/project  │ main            │ Main (keep)
  /home/user/rox-33   │ feat/33-i18n    │ Active PR #42

Legend: 🗑 = safe to delete, ⚠️ = needs attention, 🔒 = protected
```

### 4. Ask for Confirmation

Use **AskUserQuestion** to let the user choose what to clean up:

- Present **only safe-to-delete items** as default selections
- Show **unmerged branches separately** with a warning
- **NEVER auto-select unmerged branches**
- Always include a "Skip / Do nothing" option

Example question structure:
- "Which branches should I delete?" (multi-select, safe branches pre-listed)
- If unmerged branches exist: "These branches are NOT merged. Delete anyway?" (separate question, explicit warning)

### 5. Execute Cleanup

For each confirmed deletion:

```bash
# If branch has a worktree, remove worktree FIRST
git worktree remove <path>

# Delete the branch
git branch -d <branch>        # merged branches (safe)
git branch -D <branch>        # unmerged branches (only if explicitly confirmed)

# Prune worktree references
git worktree prune
```

### 6. Final Report

Show what was cleaned up:

```
Cleanup Complete
════════════════
  ✅ Deleted branch: feat/19-auth
  ✅ Deleted branch: fix/old-bug
  ⏭ Skipped: feat/33-i18n (active PR)
  ⏭ Skipped: experiment/test (unmerged, user chose to keep)

  Remaining branches: main, feat/33-i18n, experiment/test
```

## Options

| Flag | Description |
|------|-------------|
| (none) / `--all` | Analyze both branches and worktrees |
| `--branches` | Only analyze branches |
| `--worktrees` | Only analyze worktrees |

## Safety Rules

1. **NEVER delete `main` or `master`**
2. **NEVER delete the current branch**
3. **NEVER delete a branch with an open PR** unless explicitly confirmed
4. **NEVER delete an unmerged branch** without a separate, explicit confirmation
5. **ALWAYS show merge status** before any deletion
6. **ALWAYS use `git branch -d`** (safe delete) for merged branches
7. **ONLY use `git branch -D`** (force delete) when user explicitly confirms unmerged deletion
8. **ALWAYS remove worktree before deleting its branch**

## Edge Cases

- **Squash merges**: `git branch -d` won't detect squash merges as merged. Use `git log --oneline --grep` to check if the branch name or issue number appears in main's history.
- **Remote tracking branches**: After deleting local branches, inform the user they can run `git push origin --delete <branch>` to clean remote, but **do not run it automatically**.
- **Stale worktrees**: If a worktree path no longer exists on disk, `git worktree prune` will clean it up.

$ARGUMENTS
