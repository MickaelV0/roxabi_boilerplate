# Roxabi Boilerplate - Vision

> Copied from 2ndBrain/knowledge/ideas/roxabi-boilerplate-1083b6b9.md
> Updated: Linear → GitHub

## Summary

Reusable framework/template for developing SaaS applications with an integrated AI team, solid architecture and automated workflows.

## Context

Create a reusable codebase for all future SaaS projects (Naixian and others), with AI as a development partner.

## Vision

SaaS boilerplate with:

1. Specialized AI agents (dev, review, test, deploy)
2. Custom Claude Code skills
3. Claude Code ↔ GitHub sync for task management
4. Claude Code hooks to automate workflow

## Planned Components

### Integrated AI Team
- Specialized agents (dev, review, test, deploy)
- Claude Code workflows
- Automation of repetitive tasks

### SaaS Architecture
- Authentication (OAuth, magic link...)
- Multi-tenant
- Subscription / billing management
- REST/GraphQL API

## Technical Decisions

Organized by categories for easier reading and progressive development.

### 0. Tooling & Environment ✅ DECIDED

Base project tools.

| Choice | Decision |
|--------|----------|
| **Package manager** | Bun ✓ |
| **Language** | TypeScript 5.x (strict mode) ✓ |
| **Linting/Formatting** | Biome ✓ |
| **Monorepo** | TurboRepo ✓ |

### 1. Core Stack (Foundations) ✅ DECIDED

| Choice | Decision |
|--------|----------|
| **Frontend Framework** | TanStack Start ✓ |
| **Backend Framework** | NestJS + Fastify ✓ |
| **API Style** | To decide (tRPC vs REST vs GraphQL) |

### 2. Data Management (Database)

To decide:

- **Database**: PostgreSQL vs MongoDB vs Supabase
- **ORM**: Prisma vs TypeORM vs Drizzle
  - Drizzle: lightweight perfs, includes Drizzle Studio
- **Caching/Queues**: Redis vs Memcached vs Upstash Redis

### 3. Frontend-Specific (UI/UX)

To decide:

- **FE State Management**: TanStack Query vs Zustand vs Jotai
- **Styling**: Tailwind CSS vs CSS Modules vs UnoCSS
- **UI Components**: Shadcn/UI vs Radix UI vs Headless UI
- **Icons**: Lucide Icons vs Heroicons vs Phosphor
- **Forms & Validation**: React Hook Form + Zod vs Formik + Yup vs Valibot
- **i18n**: i18next vs FormatJS vs Lingui

### 4. Security and Authentication

To decide:

- **Authentication**: Supabase Auth vs Auth0 vs Clerk vs Lucia vs NextAuth vs Better Auth
  - Clerk: serverless simplicity
  - Lucia: lightweight, DB-agnostic
  - Better Auth: modern, type-safe, extensible
- **Sessions**: Redis sessions vs JWT-only
- **Multi-Tenancy**: Custom teams/RBAC vs Built-in

### 5. External Integrations

To decide:

- **Payments**: Stripe vs Paddle vs Lemon Squeezy
- **Emails/Notifications**: Resend vs SendGrid vs Postmark
- **Analytics**: PostHog vs Mixpanel vs Amplitude
- **File Storage**: AWS S3 vs Uploadthing vs Vercel Blob

### 6. Blockchain/DeFi (Optional)

If crypto needed:

- **Blockchain**: ethers.js vs viem vs web3.js
- **Wallet Integration**: WalletConnect vs RainbowKit

### 7. Admin and Internal Tools

- **Admin Dashboard**: AdminJS vs Forest Admin vs Retool

### 8. Tests and Code Quality

To decide:

- **Unit Tests**: Vitest vs Jest
- **E2E Tests**: Playwright vs Cypress
- **API Mocking**: MSW (Mock Service Worker)

### 9. DevOps and Infra

To decide:

- **FE Deployment**: Vercel vs Netlify vs AWS Amplify
- **BE Deployment**: Render vs Fly.io vs Railway vs AWS Lambda
- **CI/CD**: GitHub Actions ✓
- **Monitoring**: Sentry vs Datadog vs LogRocket

### 10. Documentation and Versioning

- **Documentation**: Docusaurus vs MkDocs vs Swagger
- **Versioning/Changelogs**: Semantic-release vs Changesets

### 11. Claude Code Integration ✅ IN PROGRESS

AI-as-teammate configuration for development.

- **CLAUDE.md**: ✅ Created
- **Claude Code Hooks**: ✅ Configured
  - Biome auto-format
  - Security check
- **Custom Skills**: ✅ Structure created
  - `_shared/` - Shared modules
  - `skill-creator/` - Skill creator
- **Specialized Agents**: To implement
  - Dev agent (implementation)
  - Review agent (code review)
  - Test agent (writing/running tests)
  - Deploy agent (CI/CD)

### 12. Architecture & Design Patterns

Code conventions:

- **Code Structure**: Feature-based (by functionality)
- **Design Patterns**: Repository, Service layer, DI (NestJS native)
- **SOLID Principles**: Applied
- **Naming Conventions**:
  - camelCase: variables, functions
  - PascalCase: classes, components, types
  - SCREAMING_SNAKE: constants
  - kebab-case: files, folders

### 13. Claude Code ↔ GitHub Sync

Bidirectional synchronization between Claude todos and GitHub Issues.

- **Implementation Options**:
  - Post-tool-call hook on TodoWrite → create/update issue
  - Dedicated sync-github skill
  - Integrated gh CLI
- **Status Mapping**:
  - pending → Open
  - in_progress → In Progress (project board)
  - completed → Closed
- **Metadata to Sync**:
  - Title, description
  - Labels (bug, feature, refactor...)
  - Assignee
  - Project board status

### 14. Feature Workflow (Idea → PR)

```
Idea → GitHub Issue → Branch → Dev → PR → Review → Merge → Deploy → Close
         ↓              ↓       ↓      ↓       ↓
      [Backlog]    [TodoWrite] [Commits] [AI Review] [CI/CD]
```

**Phase 1: Ideation**
- Capture idea (GitHub Issue, note)
- Prioritization (project board)
- Assignment (human or Claude)

**Phase 2: Planning**
- Claude reads issue via gh CLI
- Context analysis (codebase, docs)
- Plan proposal (TodoWrite)
- Human validation of plan

**Phase 3: Implementation**
- Create feature branch (`feat/feature-name`)
- Dev agent implements (code, tests)
- Atomic commits with conventional messages
- Continuous sync with GitHub (in_progress status)

**Phase 4: Review**
- PR created automatically
- Review agent analyzes code
- Improvement suggestions
- Human validates or requests changes

**Phase 5: Merge & Deploy**
- Squash merge to main
- CI/CD triggered (GitHub Actions)
- E2E tests pass
- Deploy to staging then prod

**Phase 6: Closure**
- GitHub issue closed automatically
- Changelog updated (Semantic Release)
- Team notification
- Documentation updated if needed

---

## Development Tips

**Recommended Decision Order**:
1. Core Stack → 2. Data Management → 3. Security → 4. Frontend-Specific → 5. Integrations → 9. DevOps

**Tips**:
- Track final choices with pros/cons
- Aim for 1-2 PoCs per group if hesitating
- If DeFi-heavy: prioritize group 6
- If international: boost i18n early

---

## Next Steps

- [x] Create repo and initial structure
- [x] Configure Claude Code hooks
- [ ] Choose detailed tech stack (DB, Auth, etc.)
- [ ] Define AI agents - What roles, what skills each
- [ ] Implement frontend (TanStack Start)
- [ ] Implement backend (NestJS)
- [ ] PoC GitHub sync - Test TodoWrite → GitHub Issue hook
- [ ] List essential SaaS features
