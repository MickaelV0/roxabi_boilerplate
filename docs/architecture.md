# Architecture

## Monorepo Structure

```
roxabi_boilerplate/
├── apps/
│   ├── web/              # Frontend application
│   └── api/              # Backend API
├── packages/
│   ├── ui/               # Shared UI components
│   ├── config/           # Shared configurations
│   └── types/            # Shared TypeScript types
├── docs/                 # Documentation
└── .claude/              # Claude Code configuration
```

## Applications

### Web (`apps/web`)

Frontend application built with TanStack Start.

- Server-side rendering
- File-based routing
- TypeScript strict mode

### API (`apps/api`)

Backend API built with NestJS and Fastify.

- REST + optional GraphQL
- Modular architecture
- OpenAPI documentation

## Packages

### UI (`packages/ui`)

Shared UI component library.

- React components
- Design system primitives
- Exported from `@repo/ui`

### Config (`packages/config`)

Shared configurations.

- TypeScript configs
- Biome configs
- Exported from `@repo/config`

### Types (`packages/types`)

Shared TypeScript type definitions.

- Domain models
- API contracts
- Exported from `@repo/types`

## Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Web App   │────▶│   API       │
│   Browser   │◀────│ (TanStack)  │◀────│  (NestJS)   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  packages/  │     │  Database   │
                    │  ui, types  │     │             │
                    └─────────────┘     └─────────────┘
```

## Build System

TurboRepo handles:

- Parallel task execution
- Dependency-aware builds
- Caching for faster rebuilds

Build order: `packages/* → apps/*`
