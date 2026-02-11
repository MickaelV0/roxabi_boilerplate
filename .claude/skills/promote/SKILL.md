---
argument-hint: [--dry-run | --skip-preview]
description: Promote staging to main for production deploy, with preview verification and changelog.
allowed-tools: Bash, AskUserQuestion, Read, Grep
---

# Promote

Promote `staging` to `main` for production deployment. Runs pre-flight checks, optionally triggers a deploy preview, generates a changelog from merged PRs, and creates a staging→main PR.

## Usage

```
/promote                   → Full promotion flow with preview verification
/promote --skip-preview    → Skip deploy preview, go straight to PR creation
/promote --dry-run         → Show what would be promoted without creating anything
```

## Instructions

### 1. Pre-flight Checks

Run all of these and collect the output:

```bash
# Ensure we're on staging and it's up to date
git fetch origin staging main
git checkout staging
git pull origin staging

# Commits on staging that aren't on main
git log main..staging --oneline

# Changed files summary
git diff main...staging --stat

# Check for open PRs targeting staging (unmerged work)
gh pr list --base staging --state open --json number,title,headRefName
```

**Guard rails:**

| Check | Condition | Action |
|-------|-----------|--------|
| **No commits ahead** | `git log main..staging` is empty | **REFUSE.** Nothing to promote. Stop. |
| **Open PRs targeting staging** | `gh pr list --base staging` returns results | **WARN.** Show the list and ask via `AskUserQuestion` whether to continue or wait. |
| **CI status on staging** | Check latest commit status | **WARN** if CI hasn't passed on the latest staging commit. |

Check CI status:

```bash
gh api repos/:owner/:repo/commits/staging/check-runs --jq '[.check_runs[] | {name, conclusion}] | group_by(.conclusion) | map({conclusion: .[0].conclusion, count: length})'
```

### 2. Generate Changelog

Build a changelog from all PRs merged to staging since the last promotion:

```bash
# Find the merge base (last common commit between main and staging)
MERGE_BASE=$(git merge-base main staging)

# List all merge commits (PRs) since the merge base
git log $MERGE_BASE..staging --merges --oneline

# Or list all commits with PR references
git log $MERGE_BASE..staging --oneline --grep="(#"
```

Also fetch merged PRs via GitHub API for richer data:

```bash
# Get PRs merged to staging since the merge base date
SINCE=$(git log -1 --format="%aI" $MERGE_BASE)
gh pr list --base staging --state merged --json number,title,mergedAt,author,labels --jq "[.[] | select(.mergedAt > \"$SINCE\")]"
```

Format as a changelog:

```
## Changes in this release

### Features
- feat(web): add user profile page (#42)
- feat(api): implement email verification (#45)

### Fixes
- fix(api): resolve timeout on large queries (#43)

### Other
- docs: update deployment guide (#44)
- chore(config): update Biome rules (#46)
```

Group by commit type (feat, fix, docs, chore, etc.). Include PR numbers and titles.

### 3. Deploy Preview (unless `--skip-preview`)

If `--skip-preview` was NOT passed:

1. **Trigger the Deploy Preview workflow:**
   ```bash
   gh workflow run deploy-preview.yml --ref staging -f target=both
   ```

2. **Wait for completion** and present the preview URLs:
   ```bash
   # Get the latest run
   sleep 5
   RUN_ID=$(gh run list --workflow=deploy-preview.yml --limit=1 --json databaseId --jq '.[0].databaseId')
   gh run watch $RUN_ID --exit-status
   ```

3. **Ask the user to verify** via `AskUserQuestion`:
   - **Looks good, proceed** — Continue to PR creation
   - **Issues found, abort** — Stop the promotion
   - **Skip preview, proceed anyway** — Continue without verification

If `--skip-preview` was passed, skip this step entirely.

### 4. Present Summary

Show the full promotion summary before creating the PR:

```
Promotion Summary
=================
  Commits:   {N} commits ahead of main
  PRs:       {N} merged PRs
  Files:     {N} files changed
  CI:        {passing/failing/pending}
  Preview:   {verified/skipped}

Changelog:
  {formatted changelog from step 2}
```

If `--dry-run` was passed, stop here. Show the summary and inform the user:

> "Dry run complete. Run `/promote` to create the promotion PR."

### 5. Create Promotion PR

```bash
gh pr create \
  --base main \
  --head staging \
  --title "chore: promote staging to main" \
  --body "$(cat <<'EOF'
## Promotion: staging → main

{changelog from step 2}

## Pre-flight
- [x] CI passing on staging
- [x] No open PRs targeting staging (or acknowledged)
- [{preview_check}] Deploy preview verified

---
Generated with [Claude Code](https://claude.com/claude-code) via `/promote`
EOF
)"
```

After creation, display the PR URL.

### 6. Post-merge Reminder

After the PR is created, inform the user:

> "Promotion PR created: {URL}
>
> After merge:
> 1. Vercel will auto-deploy to production
> 2. Verify production at your domain
> 3. Run `/cleanup` to clean up merged branches"

## Options

| Flag | Description |
|------|-------------|
| (none) | Full flow: pre-flight → changelog → preview → PR |
| `--skip-preview` | Skip deploy preview verification |
| `--dry-run` | Show what would be promoted without creating anything |

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Nothing to promote | Refuse, inform user staging is up to date with main |
| Open PRs on staging | Warn, list them, ask user to proceed or wait |
| CI failing on staging | Warn, show failures, ask user to proceed or fix first |
| Deploy preview fails | Show error, ask user to abort or proceed anyway |
| Promotion PR already exists | Detect via `gh pr list --base main --head staging`, offer to update instead |
| `--dry-run` | Show summary and changelog, do not create PR |

## Safety Rules

1. **NEVER force-push** to main or staging
2. **NEVER merge** the PR automatically — the user merges after review
3. **ALWAYS show the changelog** before creating the PR
4. **ALWAYS check CI status** before promoting
5. **ALWAYS warn about open PRs** targeting staging

$ARGUMENTS
