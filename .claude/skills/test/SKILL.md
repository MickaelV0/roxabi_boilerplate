---
argument-hint: [file | --e2e | --run]
description: Generate tests for changed or specified files, following existing test patterns.
allowed-tools: Bash, AskUserQuestion, Read, Write, Glob, Grep
---

# Test

Generate tests for changed or specified files. Follows existing test patterns in the codebase.

## Usage

```
/test                      → Generate tests for files changed vs main
/test src/auth/login.ts    → Generate tests for a specific file
/test --e2e                → Generate Playwright e2e tests for changed files
/test --run                → Run existing tests (shortcut for bun test)
```

## Instructions

### 1. Handle `--run` Shortcut

If `--run` is passed, skip all generation steps:

```bash
bun test
```

Report results and stop.

### 2. Identify Target Files

**Default (no file argument):**

```bash
git diff staging...HEAD --name-only
```

Filter the output to testable files:
- Include: `.ts`, `.tsx` files
- Exclude: config files (`*.config.ts`, `*.d.ts`), type-only files, test files themselves (`*.test.ts`, `*.spec.ts`)
- Exclude: files with no exports (barrel re-exports are fine)

**Specific file argument:** Use that file directly.

If no testable files are found, inform the user and stop.

### 3. Find Existing Test Patterns (Pattern Discovery)

Before generating anything, understand the codebase's testing conventions:

```bash
# Find existing test files near targets
```

Use **Glob** to search for `*.test.ts` and `*.spec.ts` files in the same or nearby directories.

**Read 1-2 existing test files** to extract:
- Test framework (`bun:test`, `vitest`, etc.)
- Import style (`import { describe, it, expect }` vs global)
- Describe/it nesting structure
- Mocking approach (`mock`, `vi.mock`, manual mocks)
- Assertion style (`expect().toBe()`, `expect().toEqual()`, etc.)
- File naming convention (`login.test.ts` vs `login.spec.ts`)

If no existing tests are found, check `package.json` for test framework configuration. If still unclear, ask the user via **AskUserQuestion** which framework to use.

### 4. Check Existing Test Coverage

For each target file, check if a test file already exists:

```bash
# For src/auth/login.ts, check for:
#   src/auth/login.test.ts
#   src/auth/login.spec.ts
#   src/auth/__tests__/login.test.ts
```

- **No existing tests:** Generate a full test file.
- **Tests already exist:** Read the existing test file, compare with source exports, and offer to add missing coverage rather than overwrite.

### 5. Generate Tests

For each target file:

1. **Read the source file** to understand exports, function signatures, types, and behavior.
2. **Generate tests** covering:
   - Happy path for each exported function/class/component
   - Edge cases (empty input, null, boundary values)
   - Error cases (invalid input, thrown exceptions)
3. **Follow the patterns** discovered in the Pattern Discovery step exactly (framework, structure, naming).
4. **Place test files** adjacent to source: `login.ts` -> `login.test.ts` (or `.spec.ts` if that's the convention).

### 6. Present for Approval

Use **AskUserQuestion** to show the generated tests and ask:
- Approve and write all
- Approve with modifications (let user specify)
- Skip specific files

**NEVER write test files without user approval.**

### 7. Write and Verify

For each approved test file:

1. Write the file using **Write**.
2. Run the test:
   ```bash
   bun test {test_file_path}
   ```
3. Report results (pass/fail with summary).
4. If failures occur, offer to fix via **AskUserQuestion**:
   - Show the failing test and error
   - Propose a fix
   - Re-run after fix

## E2E Mode (`--e2e`)

1. **Check Playwright installation:**
   ```bash
   bunx playwright --version 2>/dev/null
   ```
   If not installed, inform the user:
   > Playwright is not installed. Run `bun add -d @playwright/test && bunx playwright install` to set it up.

   **Stop here.** Skills do not install dependencies.

2. **Generate Playwright tests** in `apps/web/e2e/`:
   - Follow Playwright conventions: `page.goto()`, `expect(page).toHaveURL()`, locators
   - Check for existing e2e tests in that directory and match their patterns
   - Name files: `{feature}.e2e.ts`

3. Follow the same approval and verification flow (steps 6-7).

## Edge Cases

| Scenario | Action |
|----------|--------|
| File has no exports | Skip it. Inform user: "No exports found, may not need tests." |
| Tests already exist | Offer to add missing coverage, not overwrite |
| Test framework not detected | Ask user via AskUserQuestion |
| `--run` flag | Run `bun test` and report results only |
| Source file is a React component | Generate component tests with appropriate rendering approach |
| File is in a monorepo package | Place tests relative to the package, not the root |

## Safety Rules

1. **NEVER overwrite existing test files** without explicit approval
2. **NEVER install dependencies** (inform user and stop)
3. **ALWAYS present generated tests** for approval before writing
4. **ALWAYS run tests** after writing to verify they pass
5. **ALWAYS match existing patterns** - do not impose a different testing style

$ARGUMENTS
