# Roxabi Boilerplate - Vision

## 1. Purpose

### Why

Skip infrastructure setup. Focus directly on business features.

> *"The house foundations. Build whatever you want on top."*

### For Whom

- Solo developers
- Small teams (2-3 devs)
- Early-stage startups

### Target Products

- **B2B**: Internal tools, dashboards, admin panels
- **B2C**: Basic user-facing apps
- **Long-term focus**: Built for scalability, not throwaway MVPs

### Non-Goals

- Not a CMS
- Not an e-commerce platform
- Not for mobile native apps
- Not a marketplace builder

### Success Criteria

> *"When I build my first business feature, it just works."*

- Auth, billing, multi-tenant: ready out of the box
- Developer experience: smooth, no friction
- Code patterns: clear, consistent, scalable

**Measurable:**
- **Time to first feature**: Minimal time to add a business feature
- **Zero config**: Clone → dev in less than 5 minutes
- **Production-ready**: Deployable to prod without modifications

---

## 2. Principles

### North Stars

1. **Simplicité d'abord** - Moins de features mais qui marchent parfaitement
2. **Scalabilité** - Construit pour grandir, pas pour jeter
3. **Convention over configuration** - Opinions fortes, moins de décisions à prendre

### Trade-offs

| Choix | Préférence |
|-------|------------|
| Simple vs Flexible | **Flexible** (architecture modulaire avec defaults opinionés mais extensibles) |
| Convention vs Liberté | **Opt-out explicite** (possible de déroger mais doit être justifié/documenté) |
| Dette technique | **Zéro tolérance** (on ne shippe pas de code "temporaire") |

### Non-Negotiables

- TypeScript strict mode everywhere
- TDD: tests écrits avant le code
- Tous les quality gates doivent passer avant merge
- Documentation maintenue comme le code

---

## 3. AI Team & Skills

### Agent Taxonomy

**Core Agents (Boilerplate)**
| Agent | Rôle |
|-------|------|
| Dev | Implémentation de features |
| Review | Code review, qualité |
| Test | Écriture et maintenance des tests |
| Deploy | CI/CD, déploiements |
| Product | Specs, product ownership |
| Ops/Infra | Monitoring, infrastructure |
| Frontend | Spécialiste UI/UX |
| Backend | Spécialiste API/DB |

**Domain Agents (App-specific)**
- Agents métier créés selon le domaine de l'app
- Personas génériques pour tester les flux utilisateurs

### Skills Organization

| Source | Usage |
|--------|-------|
| Built-in | Skills inclus dans le boilerplate |
| Marketplace | Registry centralisé avec review/qualité |
| Git-based | Import exceptionnel depuis repos Git |

### Orchestration

- **Workflow-driven**: Workflows prédéfinis chaînent les agents
- **Event-driven**: Agents réagissent aux événements (hooks, PR, etc.)
- **Autonomie**: Agents autonomes, humain review a posteriori

---

## 4. Developer Experience

### Code Methodology

- **TDD strict**: Tests écrits avant le code, toujours
- Functional patterns where appropriate
- Named exports over default exports
- No circular dependencies

### Quality Gates (All Required for Merge)

- [ ] Lint clean (Biome)
- [ ] TypeScript sans erreur
- [ ] Tous les tests passent
- [ ] Seuil minimum de coverage atteint
- [ ] Review approuvée (humaine ou AI)

### Documentation Strategy

| Aspect | Approche |
|--------|----------|
| Format | Docs-as-code (Markdown dans le repo) |
| API | Swagger/OpenAPI auto-généré |
| Ownership | Agent AI dédié génère, humain review |
| Versioning | Documenté avec le code |

### Testing Philosophy

- **Unit/Integration**: Vitest
- **E2E**: Playwright
- **Coverage**: Seuil minimum enforced
- **TDD**: Test first, implementation second

---

## 5. Architecture

### Monorepo Structure

```
roxabi_boilerplate/
├── apps/
│   ├── web/              # Frontend (TanStack Start)
│   └── api/              # Backend (NestJS + Fastify)
├── packages/
│   ├── ui/               # Shared UI (Shadcn/UI)
│   ├── config/           # Shared configurations
│   └── types/            # Shared TypeScript types
├── docs/                 # Documentation
└── .claude/              # Claude Code configuration
```

### Multi-Tenant Model

```
META Organization (super admin)
└── Organization
    └── Child Organization(s)
        └── Users
```

**Strategy**: Row-Level Security (RLS)
- Une seule base de données
- Isolation par `tenant_id` + PostgreSQL RLS
- Performant, simple à maintenir

### API Design

- **Style**: REST
- **Documentation**: OpenAPI/Swagger auto-généré
- **Contracts**: Types partagés via `@repo/types`

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Web App   │────▶│   API       │
│   Browser   │◀────│ (TanStack)  │◀────│  (NestJS)   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  packages/  │     │  PostgreSQL │
                    │  ui, types  │     │   (RLS)     │
                    └─────────────┘     └─────────────┘
```

---

## 6. Workflows

### Branching Strategy

**GitHub Flow**
- `main` = production-ready
- Feature branches pour chaque changement
- PR required pour merge

### Development Workflow

```
Idea → GitHub Issue → Branch → Dev → PR → Review → Merge → Deploy → Close
```

### Automations (Hooks)

| Trigger | Action |
|---------|--------|
| Pre-push | Tests run |
| PR opened | CI complète (lint, types, tests, coverage) |
| Post-merge | Deploy auto + notifications |

### Deployment Strategy

**Continuous Deployment**
- Merge to main = deploy automatique en production
- Feature flags pour rollouts progressifs (via PostHog)

### Hotfix Process

- Commit direct sur `main` avec validation post-deploy
- Rollback automatique si health checks échouent

---

## 7. Roadmap

### Phase 1: MVP

**Scope**
- [ ] Auth + Users (Better Auth)
- [ ] Multi-tenant (RLS)
- [ ] RBAC (rôles et permissions)
- [ ] Admin panel
- [ ] i18n (internationalisation)
- [ ] Audit logs
- [ ] Notifications (emails + in-app)

**Success Criteria**
- Clone → dev en moins de 5 min
- Première feature métier ajoutée rapidement
- Déployable en production sans modifications

### Phase 2+: Backlog

À prioriser ultérieurement:
- [ ] Billing (Stripe/Paddle/Lemon Squeezy via abstraction)
- [ ] Analytics dashboard
- [ ] Webhooks
- [ ] API publique
- [ ] OAuth providers additionnels
- [ ] Plugins/extensions system
- [ ] Themes
- [ ] Marketplace

---

## 8. Technical Decisions

### Decided

| Category | Choice |
|----------|--------|
| Package manager | Bun |
| Language | TypeScript 5.x (strict) |
| Linting | Biome |
| Monorepo | TurboRepo |
| Frontend | TanStack Start |
| Backend | NestJS + Fastify |
| CI/CD | GitHub Actions |
| Database | PostgreSQL |
| ORM | Drizzle |
| Auth | Better Auth |
| UI | Shadcn/UI |
| Tests | Vitest + Playwright |
| Monitoring | PostHog |
| API Style | REST + OpenAPI |
| Multi-tenant | Row-Level Security |

### Abstracted (Implementation at Deploy)

| Category | Interface Ready | Options |
|----------|-----------------|---------|
| Payments | Yes | Stripe, Paddle, Lemon Squeezy |
