# Claude Code Instructions

## Project Overview

Roxabi Boilerplate - SaaS framework with integrated AI team.

## Tech Stack

- **Runtime**: Bun
- **Monorepo**: TurboRepo
- **Language**: TypeScript 5.x (strict mode)
- **Linting/Formatting**: Biome
- **Frontend**: TanStack Start
- **Backend**: NestJS + Fastify

## Conventions

### Code Style

- Use Biome for linting and formatting
- TypeScript strict mode enabled
- Prefer functional patterns where appropriate
- Use named exports over default exports

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `camelCase.types.ts`
- Tests: `*.test.ts` or `*.spec.ts`

### Imports

- Use path aliases (`@/`, `@repo/`)
- Group imports: external, internal, relative
- No circular dependencies

## Commands

```bash
bun install          # Install dependencies
bun dev              # Run all apps in dev mode
bun build            # Build all packages
bun lint             # Run Biome linter
bun format           # Format with Biome
bun typecheck        # TypeScript type checking
bun test             # Run tests
bun docs             # Start documentation server (Docker)
```

## Monorepo Structure

- `apps/web` - Frontend application
- `apps/api` - Backend API
- `apps/packages/ui` - Shared UI components
- `apps/packages/config` - Shared configurations
- `apps/packages/types` - Shared TypeScript types
- `docs/` - Documentation (Docker-based Fumadocs server)

## Development Process

1. Pick GitHub Issue
2. Create feature branch
3. Implement changes
4. Create PR
5. Review & merge

## Hooks

Claude Code hooks are configured in `.claude/settings.json`:

- **Biome**: Auto-format on file changes
- **TypeCheck**: Validate types on file changes
- **Security**: Warn about dangerous patterns
