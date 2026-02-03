# Documentation Server - Fumadocs Implementation

## Context

The Roxabi Boilerplate project needs a local documentation server to view Markdown files in a browser. This solution must:
- Work locally during development
- Be upgradeable to public-facing documentation later
- Integrate into the existing TurboRepo monorepo as `apps/docs`
- Align with the tech stack (Bun, TypeScript, TanStack Start)

After comprehensive research of 10+ solutions (Starlight, VitePress, Docusaurus, Rspress, Docsify, Mintlify, etc.), **Fumadocs** was selected as the optimal choice.

## Objective

Implement Fumadocs as the documentation server for Roxabi Boilerplate, providing:
- Local viewing of existing Markdown documentation
- Foundation for future public SaaS documentation
- API documentation generation from OpenAPI specs

## Why Fumadocs

### Stack Alignment

| Criteria | Fumadocs | Alternatives |
|----------|----------|--------------|
| **TanStack Start** | Official support | None/Limited |
| **React** | Native | Vue (VitePress), Astro (Starlight) |
| **TypeScript** | First-class (77.6% codebase) | Varies |
| **Monorepo** | Works in `apps/docs` | Starlight: root only |
| **Bun** | Compatible | VitePress: partial issues |

### Key Advantages

1. **TanStack Start Support** - Only doc framework with official TanStack integration
2. **OpenAPI Generator** - Built-in support for API documentation (useful for NestJS API)
3. **React Server Components** - Modern server-first architecture
4. **Smallest Bundle** - 161KB vs 200-400KB for alternatives
5. **Active Maintenance** - v16.4.7 released 3 days ago (as of Feb 2026)
6. **Production Users** - Vercel, Unkey, Orama

### Trade-offs Accepted

- Steeper learning curve than Docusaurus
- Not backed by major company (vs Meta for Docusaurus, Cloudflare for Starlight)
- May have performance issues with 500+ MDX files (not a concern for current 13 docs)

### Technical Considerations

**Markdown Compatibility:**
- Existing docs use `.md` extension
- Fumadocs supports both `.md` and `.mdx`
- May need to add frontmatter (title, description) to existing files
- Tables and code blocks should work without changes

## Users & Use Cases

### Primary Users
- **Developers** working on Roxabi Boilerplate
- **AI Agents** referencing documentation for context

### Future Users (Phase 2+)
- **End users** of products built on Roxabi
- **Business stakeholders** reading product documentation

### Use Cases

1. **View architecture docs** - Understand system design
2. **Read getting-started guide** - Onboard new developers
3. **Reference API documentation** - Understand endpoints (future)
4. **Search documentation** - Find specific information quickly

## Expected Behavior

### Happy Path

1. Developer runs `docker compose -f docs/docker-compose.yml up`
2. Fumadocs container starts (isolated from monorepo)
3. Documentation available at `http://localhost:3002` (via `DOCS_PORT`)
4. All Markdown files rendered with auto-generated navigation
5. Full-text search available
6. Dark mode supported
7. Editing `.md` files triggers hot reload

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Invalid Markdown syntax | Show error with file location |
| Missing internal link | Build warning, link marked as broken |
| Large images | Automatic optimization via Next.js Image |
| Non-English content | i18n structure ready (not implemented in Phase 1) |

## Constraints

### Technical
- Must use Bun as package manager
- Must integrate with TurboRepo pipeline
- Must support TypeScript strict mode
- Must pass Biome linting

### Resource
- Phase 1: Local development only
- No external services required (no Algolia, no hosting)

### Compatibility
- Node.js 18+ (Fumadocs requirement)
- React 19.2.0+ (Fumadocs v16 requirement)

## Non-Goals (Phase 1)

- Public deployment
- Custom domain
- Versioned documentation
- Internationalization (i18n)
- API documentation from OpenAPI (Phase 2)
- Analytics

## Technical Decisions

### Project Structure (Updated)

```
roxabi_boilerplate/
├── .env                    # Global env vars (DOCS_PORT, etc.)
├── .claude/                # Claude Code configuration
├── biome.json
├── package.json
├── tsconfig.json
├── turbo.json
│
├── apps/                   # All application code
│   ├── web/               # Frontend (TanStack Start)
│   ├── api/               # Backend (NestJS)
│   └── packages/          # Shared code (moved here)
│       ├── ui/            # Shared UI components
│       ├── config/        # Shared configurations
│       └── types/         # Shared TypeScript types
│
└── docs/                   # Documentation (isolated, Docker-based)
    ├── INDEX.md           # Content
    ├── vision.md
    ├── architecture.md
    ├── getting-started.md
    ├── configuration.md
    ├── hooks.md
    ├── spec/              # Spec files
    ├── analyses/          # Analysis files
    ├── source.config.ts   # Fumadocs configuration
    ├── Dockerfile         # Fumadocs server
    └── docker-compose.yml # Docker orchestration
```

### Architecture Rationale

| Directory | Purpose | Runtime |
|-----------|---------|---------|
| `apps/` | All application code | Bun/Node via TurboRepo |
| `docs/` | Documentation (content + server) | Docker (isolated) |

**Benefits:**
- Clear separation: code vs documentation
- Fumadocs isolated in Docker (no dependency conflicts)
- `docs/` is self-contained and portable
- No pollution of monorepo with Fumadocs dependencies

### Port Allocation (via .env)

```bash
# .env (root)
WEB_PORT=3000
API_PORT=3001
DOCS_PORT=3002
```

### Docker Configuration

```yaml
# docs/docker-compose.yml
services:
  docs:
    build: .
    ports:
      - "${DOCS_PORT:-3002}:3000"
    volumes:
      - .:/app:ro
    environment:
      - NODE_ENV=development
```

```dockerfile
# docs/Dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install Fumadocs dependencies
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Copy content and config
COPY . .

EXPOSE 3000
CMD ["bun", "run", "dev"]
```

```json
// docs/package.json
{
  "name": "roxabi-docs",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "fumadocs-core": "^16.0.4",
    "fumadocs-ui": "^16.4.7",
    "fumadocs-mdx": "^14.2.5",
    "next": "^15.x",
    "react": "^19.x",
    "react-dom": "^19.x"
  }
}
```

**Fumadocs Configuration:**
```typescript
// docs/source.config.ts
import { defineDocs } from 'fumadocs-mdx/config';

export const docs = defineDocs({
  dir: '.', // Content is in the same directory
});
```

### TurboRepo Configuration Update

```json
// turbo.json (updated workspaces)
{
  "workspaces": ["apps/*", "apps/packages/*"]
}
```

```json
// package.json (root - updated workspaces + docs script)
{
  "workspaces": ["apps/*", "apps/packages/*"],
  "scripts": {
    "docs": "docker compose -f docs/docker-compose.yml up",
    "docs:build": "docker compose -f docs/docker-compose.yml build"
  }
}
```

### Usage

```bash
# Start docs server
bun docs

# Or directly
docker compose -f docs/docker-compose.yml up

# Build docs image
bun docs:build
```

### Dependencies

```json
{
  "dependencies": {
    "fumadocs-core": "^16.0.4",
    "fumadocs-ui": "^16.4.7",
    "fumadocs-mdx": "^14.2.5",
    "next": "^15.x",
    "react": "^19.x",
    "react-dom": "^19.x"
  },
  "devDependencies": {
    "@types/react": "^19.x",
    "typescript": "^5.x"
  }
}
```

### TurboRepo Integration

```json
// turbo.json addition
{
  "pipeline": {
    "docs#dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "docs#build": {
      "dependsOn": ["^build"],
      "outputs": ["apps/docs/.next/**"]
    }
  }
}
```

## Success Criteria

- [ ] `docker compose -f docs/docker-compose.yml up` starts docs server
- [ ] All existing 13 Markdown files rendered correctly
- [ ] Navigation sidebar auto-generated from file structure
- [ ] Full-text search functional
- [ ] Dark mode toggle works
- [ ] Docker build completes without errors
- [ ] Hot reload works when editing Markdown files

## Resolved Questions

1. **Keep original `docs/` folder?** → **YES** - Fumadocs runs directly in `docs/`
2. **Spec files location** → Keep in `docs/spec/`, rendered as a section
3. **Analysis files** → Keep in `docs/analyses/`, rendered as a section
4. **Integration with monorepo** → **Docker isolation** - no TurboRepo integration needed
5. **packages/ location** → Moved to `apps/packages/`

## Implementation Steps

### Phase 1: Documentation Server
1. Create `docs/package.json` with Fumadocs dependencies
2. Create `docs/source.config.ts` for content configuration
3. Create `docs/Dockerfile` for containerized server
4. Create `docs/docker-compose.yml` with port from `.env`
5. Add Fumadocs Next.js app structure in `docs/`
6. Configure navigation (sections for spec/, analyses/)
7. Handle `.md` → Fumadocs compatibility (frontmatter)
8. Test with `docker compose up`

### Phase 2: Monorepo Restructure (separate task)
1. Move `packages/` to `apps/packages/`
2. Update `turbo.json` workspaces
3. Update root `package.json` workspaces
4. Update import paths if needed
5. Verify TurboRepo still works

## References

- [Fumadocs Documentation](https://www.fumadocs.dev/)
- [Fumadocs GitHub](https://github.com/fuma-nama/fumadocs)
- [TurboRepo Docs](https://turborepo.dev/docs)
- Research: `/tmp/claude-1001/.../tasks/*.output` (7 agent reports)
