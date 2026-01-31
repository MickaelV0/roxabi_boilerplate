# Roxabi Boilerplate - Vision

## 1. Purpose ✅

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

- ❌ Not a CMS
- ❌ Not an e-commerce platform
- ❌ Not for mobile native apps
- ❌ Not a marketplace builder

### Success Criteria

> *"When I build my first business feature, it just works."*

- Auth, billing, multi-tenant: ready out of the box
- Developer experience: smooth, no friction
- Code patterns: clear, consistent, scalable

---

## 2. Principles

> TODO: Define North Stars, trade-offs, and non-negotiables.
> See GitHub Issue for details.

---

## 3. AI Team & Skills

> TODO: Define agent taxonomy, skills catalog, and interactions.
> See GitHub Issue for details.

### Initial Thoughts

- Skills are the execution layer of documentation/methodology
- Need to identify trusted skill marketplaces or build our own
- Agents: dev, review, test, deploy (+ domain-specific?)

---

## 4. Developer Experience

> TODO: Define code methodology, quality gates, testing philosophy, documentation standards.
> See GitHub Issue for details.

### Initial Thoughts

- Documentation is a core pillar, not an afterthought
- Skills apply and enforce the methodology
- Template modules for common patterns

---

## 5. Architecture

> TODO: Define monorepo structure, multi-tenant model, API design.
> See GitHub Issue for details.

### Multi-Tenant Model (Initial)

```
META Organization (super admin)
└── Organization
    └── Child Organization(s)
        └── Users
```

- Inheritance of rights/roles/scopes
- Need to decide: DB per tenant vs schema per tenant vs row-level security

---

## 6. Workflows

> TODO: Define feature dev, hotfix, release, hooks orchestration.
> See GitHub Issue for details.

### Current Workflow

```
Idea → GitHub Issue → Branch → Dev → PR → Review → Merge → Deploy → Close
```

---

## 7. Roadmap

> TODO: Define MVP scope, phases, success metrics.
> See GitHub Issue for details.

---

## Technical Decisions (Reference)

### Decided ✅

| Category | Choice |
|----------|--------|
| Package manager | Bun |
| Language | TypeScript 5.x (strict) |
| Linting | Biome |
| Monorepo | TurboRepo |
| Frontend | TanStack Start |
| Backend | NestJS + Fastify |
| CI/CD | GitHub Actions |

### To Decide

| Category | Options |
|----------|---------|
| API Style | tRPC vs REST vs GraphQL |
| Database | PostgreSQL vs Supabase |
| ORM | Prisma vs Drizzle |
| Auth | Clerk vs Lucia vs Better Auth |
| Payments | Stripe vs Paddle vs Lemon Squeezy |
| UI | Shadcn/UI vs Radix UI |
| State | TanStack Query vs Zustand |
| Tests | Vitest vs Jest, Playwright vs Cypress |
| Monitoring | Sentry vs PostHog |
