#!/usr/bin/env bash
# Install lefthook hooks, then fix core.hooksPath if running inside a worktree.
# When `bun install` runs in a worktree, lefthook install sets core.hooksPath
# relative to the worktree, which is wrong because the worktree shares the main
# repo's .git directory. Unsetting it lets git fall back to the default hooks path.

lefthook install

GIT_DIR=$(git rev-parse --git-dir 2>/dev/null)
GIT_COMMON_DIR=$(git rev-parse --git-common-dir 2>/dev/null)

if [ "$GIT_DIR" != "$GIT_COMMON_DIR" ]; then
  git config --unset-all core.hooksPath 2>/dev/null || true
fi
