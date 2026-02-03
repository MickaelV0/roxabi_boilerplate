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

## Git Hooks

Pre-push hooks run automatically to ensure code quality:

- **Lint**: Biome checks all files
- **Typecheck**: TypeScript validation (affected packages only)
- **Tests**: Vitest unit tests (affected packages only)

Hooks are installed automatically via `bun install`. To bypass in emergencies: `LEFTHOOK=0 git push`

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

## Development Process

```
GitHub Issue → Branch → Implement → PR → Review → Merge
```

## Documentation

See [docs/INDEX.md](docs/INDEX.md) for full documentation.
