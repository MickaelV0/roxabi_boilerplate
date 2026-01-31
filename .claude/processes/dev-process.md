# Development Process

## Workflow

```
GitHub Issue → Branch → Implement → PR → Review → Merge
```

## Steps

### 1. Pick Issue

- Check GitHub Issues for available work
- Assign yourself to the issue
- Understand requirements before starting

### 2. Create Branch

```bash
git checkout -b feature/issue-123-description
# or
git checkout -b fix/issue-123-description
```

Branch naming:
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code improvements
- `docs/` - Documentation

### 3. Implement

- Follow code conventions in CLAUDE.md
- Write tests for new functionality
- Keep commits atomic and well-described
- Run `bun lint` and `bun typecheck` before committing

### 4. Create PR

```bash
gh pr create --title "feat: description" --body "Closes #123"
```

PR title format:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Refactoring
- `docs:` - Documentation
- `chore:` - Maintenance

### 5. Review & Merge

- Address review comments
- Ensure CI passes
- Squash and merge when approved

## Quality Checklist

Before creating PR:
- [ ] Code follows conventions
- [ ] Tests pass (`bun test`)
- [ ] Linting passes (`bun lint`)
- [ ] Types check (`bun typecheck`)
- [ ] No console.log or debug code
- [ ] PR description is clear
