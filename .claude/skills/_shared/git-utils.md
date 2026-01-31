# Git Utilities

## Branch Naming

Format: `{type}/{issue}-{description}`

Types:
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code improvements
- `docs/` - Documentation

## Commit Message Format

```
{type}: {description}

{body}

{footer}
```

Types: feat, fix, refactor, docs, chore, test

## Common Commands

```bash
# Create branch from issue
git checkout -b feature/123-add-auth

# Stage and commit
git add -A
git commit -m "feat: add authentication"

# Create PR
gh pr create --title "feat: add authentication" --body "Closes #123"
```
