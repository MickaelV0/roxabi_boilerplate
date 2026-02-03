# Development Process

Adapts to task complexity through three tiers. **Determine tier before starting.**

## Step 0: Determine Tier

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

## Development Checklist

**CRITICAL: Before considering a development complete, verify ALL applicable items.**

### 1. Source Code

| Artifact | When | Typical files |
|----------|------|---------------|
| Frontend components | UI changes | `apps/web/src/**/*.tsx` |
| Backend modules | API changes | `apps/api/src/**/*.ts` |
| Shared UI | Reusable components | `packages/ui/src/**/*.tsx` |
| Shared types | Type definitions | `packages/types/src/**/*.ts` |

### 2. Tests

| Type | When | Typical files |
|------|------|---------------|
| Unit tests | New function/logic | `**/*.test.ts`, `**/*.spec.ts` |
| E2E tests | User flows | `apps/web/e2e/**/*.spec.ts` |
| API tests | Endpoints | `apps/api/src/**/*.spec.ts` |

**Rule: Any new public function must have at least one test.**

### 3. Documentation

| Artifact | When | Files |
|----------|------|-------|
| Feature spec | New feature | `docs/specs/*.mdx` |
| Architecture | Structure change | `docs/analyses/*.mdx` |
| CLAUDE.md | Critical change | `CLAUDE.md` |

### 4. Configuration

| Artifact | When | Files |
|----------|------|-------|
| Environment variables | New config | `.env.example` |
| Package dependencies | New packages | `package.json`, `bun.lock` |
| TypeScript config | Compiler settings | `tsconfig.json` |

---

## Tier S: Quick Fix

### S.1 — Scope
- Identify files (max 3)
- Confirm no regression risk
- **List all impacted artifacts** (see checklist above)

### S.2 — Validate
- Present approach with `AskUserQuestion`
- Include: files to modify, related artifacts (tests, docs)
- Wait for explicit approval

### S.3 — Implement
Follow this order:

1. **Read** existing files before modifying
2. **Implement** business logic
3. **Update tests**
4. **Run quality checks**: `bun lint && bun typecheck && bun test`
5. **Verify** all checks pass

### S.4 — Branch, Commit & PR

```bash
# 1. Create branch
git checkout -b fix/XXX-description

# 2. Check changes
git status
git diff --stat

# 3. Add files (NEVER git add -A)
git add <file1> <file2> ...

# 4. Commit with standard format
git commit -m "$(cat <<'EOF'
<type>(<scope>): <description>

<optional body>

Co-Authored-By: Claude <model> <noreply@anthropic.com>
EOF
)"

# 5. Create PR
gh pr create --title "<type>: description" --body "Closes #XXX"
```

**Commit types:** `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

---

## Tier M: Feature Light

### M.1 — Scope
- Identify all files (3-10)
- List all impacted artifacts
- Confirm it's not system-wide

### M.2 — Create Worktree

```bash
git worktree add ../roxabi-XXX -b feat/XXX-slug
cd ../roxabi-XXX
```

### M.3 — Validate
- Present approach with `AskUserQuestion`
- Include: files to modify, architecture impact, tests, docs
- Wait for explicit approval

### M.4 — Implement
1. Read existing files
2. Implement in logical order (types → logic → UI)
3. Update/create tests
4. Update documentation if needed
5. Run quality checks: `bun lint && bun typecheck && bun test`

### M.5 — Commit & PR

```bash
git add <files>
git commit -m "$(cat <<'EOF'
feat(<scope>): description

Co-Authored-By: Claude <model> <noreply@anthropic.com>
EOF
)"

gh pr create --title "feat: description" --body "Closes #XXX"
```

### M.6 — Cleanup Worktree (after merge)

```bash
cd /home/mickael/projects/roxabi_boilerplate
git worktree remove ../roxabi-XXX
```

---

## Tier L: Feature/Migration

### L.1 — Scope & Spec
- Create specification in `docs/specs/XXX-slug.mdx`
- Document architecture decisions
- Get spec approval before coding

### L.2 — Create Worktree

```bash
git worktree add ../roxabi-XXX -b feat/XXX-slug
cd ../roxabi-XXX
```

### L.3 — Validate Plan
- Present detailed implementation plan
- Use `AskUserQuestion` for approach validation
- Consider parallel execution for complex tasks

### L.4 — Implement
1. Follow spec step by step
2. Commit atomic changes as you go
3. Update tests for each component
4. Update documentation

### L.5 — Self-Review
- Review all changes: `git diff main...HEAD`
- Verify all checklist items
- Run full test suite: `bun test`

### L.6 — PR & Review

```bash
gh pr create --title "feat: description" --body "Closes #XXX"
```

### L.7 — Cleanup (after merge)

```bash
cd /home/mickael/projects/roxabi_boilerplate
git worktree remove ../roxabi-XXX
```

---

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Branch | `feat/XXX-slug` | `feat/123-user-auth` |
| Branch | `fix/XXX-slug` | `fix/456-login-bug` |
| Spec | `docs/specs/XXX-slug.mdx` | `docs/specs/123-user-auth.mdx` |
| Worktree | `../roxabi-XXX` | `../roxabi-123` |

> XXX = GitHub issue number

---

## Principles

1. **Validate before implementing** — Always get user approval on approach before writing code
2. **Match process to complexity** — Tier S for fixes, Tier L for migrations
3. **Understand before building** — Read code before modifying
4. **Complete the checklist** — Every applicable artifact must be updated
5. **Test new code** — New functions must have tests
6. **Track progress** — Keep GitHub issue updated
7. **Respect patterns** — Use shared packages, follow conventions
8. **No speculative complexity** — Build what's requested
9. **Review depth matches risk** — Light for M, structured for L

---

## Quality Checklist

Before creating PR:
- [ ] Code follows conventions (Biome)
- [ ] Tests pass (`bun test`)
- [ ] Linting passes (`bun lint`)
- [ ] Types check (`bun typecheck`)
- [ ] No console.log or debug code
- [ ] PR description is clear
- [ ] Documentation updated if needed
