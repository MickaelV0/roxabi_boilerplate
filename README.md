# Roxabi Boilerplate

SaaS boilerplate with AI team integration.

<!-- TODO: Add demo GIF once seed data is ready — see scripts/record-demo.ts -->

## Stack

| Layer | Technology |
|-------|------------|
| Monorepo | Bun + TurboRepo |
| Language | TypeScript 5.x strict |
| Linting | Biome |
| Frontend | TanStack Start |
| Backend | NestJS + Fastify |

## Quick Start

```bash
# Install dependencies
bun install

# Run development
bun dev

# Lint & format
bun lint
bun format

# Type check
bun typecheck
```

## Structure

```
roxabi_boilerplate/
├── apps/
│   ├── web/          # Frontend (TanStack Start)
│   └── api/          # Backend (NestJS + Fastify)
├── packages/
│   ├── ui/           # Shared UI components
│   ├── config/       # Shared configurations
│   ├── types/        # Shared TypeScript types
│   ├── email/        # Email templates
│   ├── vitest-config/ # Shared Vitest configuration
│   └── playwright-config/ # Shared Playwright configuration
└── docs/             # Documentation
```

## Git Hooks

Git hooks are configured using [Lefthook](https://github.com/evilmartians/lefthook) and are installed automatically on `bun install`.

| Hook | Purpose | Speed |
|------|---------|-------|
| **Commit-msg** | Validate Conventional Commits format | <1s |
| **Pre-commit** | Auto-format staged files with Biome | <1s |
| **Pre-push** | Full validation (lint, typecheck, tests, i18n, license) | <30s (cached) |

**Bypass for emergencies:** Use `--no-verify` flag (CI is the ultimate enforcement).

## Development Process

```
GitHub Issue → Branch → Implement → PR → Review → Merge
```

## Documentation

See [docs/index.mdx](docs/index.mdx) for full documentation.
