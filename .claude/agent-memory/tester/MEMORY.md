# Tester Agent Memory

## Project: Roxabi Boilerplate

### Key Patterns

- Test runner: `bun run test` (NOT `bun test`) — runs Vitest in `apps/api` or `apps/web`
- Run a specific test file from package dir: `cd apps/api && bun run test src/path/to/file.test.ts`
- All imports use `.js` extension in ESM (e.g., `from './myFile.js'`)
- Always import from `vitest` explicitly: `import { describe, it, expect, vi } from 'vitest'`

### Controller Test Pattern (admin controllers)

- Mock services as module-level `const` with `vi.fn()`, cast `as unknown as ServiceType`
- Instantiate controller directly: `new Controller(mockService1, mockService2)`
- `beforeEach(() => { vi.restoreAllMocks() })` — no setup in beforeEach
- Decorator verification: use `new Reflector()` + `reflector.get('ROLES', ControllerClass)`
- `@Roles('superadmin')` sets metadata key `'ROLES'`, `@SkipOrg()` sets `'SKIP_ORG'`

### Service Test Pattern (Drizzle DB mock)

- Mock entire Drizzle chain with factory helpers (`createMockDb()`)
- Select chain: `select().from().where().limit()` — override terminal fn per test
- Update chain: `update().set().where().returning()`
- `vi.fn().mockResolvedValueOnce([])` for multi-call sequences

### Exception Pattern

- Exceptions extend `Error`, set `this.name`, carry `errorCode` from `ErrorCode` enum
- Path: `apps/api/src/admin/exceptions/*.exception.ts`

### Admin Settings (Issue #358)

- Controller: `AdminSettingsController` at `apps/api/src/admin/adminSettings.controller.ts`
- Exceptions: `settingNotFound.exception.ts`, `settingValidation.exception.ts`
- `batchUpdate` returns `{ updated: SystemSetting[], beforeState: Record<string, unknown> }`
- `settingsUpdateSchema`: Zod, requires non-empty `updates` array with `key` (non-empty string) + `value`
- Audit action for settings changes: `'settings.updated'`, resource: `'system_setting'`
