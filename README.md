# Roxabi Boilerplate

SaaS boilerplate with AI team integration.

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
│   └── types/        # Shared TypeScript types
└── docs/             # Documentation
```

## Git Hooks

Git hooks are configured using [Lefthook](https://github.com/evilmartians/lefthook) and are installed automatically on `bun install`.

| Hook | Purpose | Speed |
|------|---------|-------|
| **Pre-commit** | Auto-format staged files with Biome | &lt;1s |
| **Pre-push** | Full validation (lint, typecheck, tests) | &lt;30s (cached) |

**Bypass for emergencies:** Use `--no-verify` flag (CI is the ultimate enforcement).

## Development Process

```
GitHub Issue → Branch → Implement → PR → Review → Merge
```

## Documentation

See [docs/INDEX.md](docs/INDEX.md) for full documentation.
