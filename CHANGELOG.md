# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries are generated automatically by `/promote` and committed to staging before the promotion PR.

## [v0.2.0] - 2026-02-14

### Added
- feat(ui,web): Claude Code presentation page + design system expansion (#145)
- feat(api): rate limiting with Upstash Redis & Swagger gating (#148)
- feat(db): local database isolation per worktree (#162)
- feat(ui,web): UX & Design Audit — 41 findings implemented (#177)
- feat(web): internationalize Claude Code presentation and demo routes
- feat(web): add i18n page titles and design-system translation keys
- feat(api): implement database seed script for dev essentials
- feat(web): add catch-all route to render 404 page for unmatched paths
- feat(issue-triage): add create command, parent/child management

### Fixed
- fix: resolve 25 review findings across backend, frontend, devops, and tests (#149)
- fix(web): prioritize cookie and browser language over URL for locale detection
- fix: replace dev trap with explicit dev:clean script for port cleanup
- fix(web): exclude internal docs from production build to fix OOM
- fix(web): preserve selected theme when editing non-color settings
- fix: update license to BSL 1.1 and fix GitHub link in prod

### Changed
- perf(web): switch to async MDX loading and Rolldown bundler to fix OOM
- refactor(web): overhaul presentation sections layout and content
- refactor(agents): rename infra-ops to devops, add expert review to bootstrap
- refactor(bootstrap): remove team spawn, use direct orchestration
- refactor(promote): move changelog generation before merge to fix deploy race

### Documentation
- docs(architecture): add frontend, CI/CD, multi-tenant, auth-security, RBAC subsystem docs (#169)
- docs(security): add analysis and spec for rate limiting & API security
- docs(presentation): add analysis and spec for Claude Code talk page
- docs(db): integrate branch database scripts into project documentation

### Chores
- chore(deps): update outdated dependencies (#161)
- chore(config): align Biome schema version with CLI 2.3.15

## [v0.1.0] - 2026-02-13

### Added
- feat(api,web): add auth + users with Better Auth (#73)
- feat(api): add multi-tenant RLS infrastructure (#111)
- feat(api): implement RBAC roles and permissions (#116)
- feat(auth): implement auth UI/UX pages and flows (#108)
- feat(auth): conditionally show OAuth buttons based on provider config (#123)
- feat(web): setup API client (#62)
- feat(web): migrate i18n from i18next to Paraglide JS (#66)
- feat(web): clean TanStack Start installation with landing page (#67)
- feat(design-system): add theme engine, presets, and design system page (#83)
- feat(deploy): deployment setup with Vercel (#100)
- feat(claude): implement 9 Claude Code skills for full dev lifecycle (#74)
- feat(agents): implement 10-agent team architecture (#79)
- feat(license-checker): add dependency license compliance scanner (#82)
- feat(promote): add release notes system with --finalize flag (#138)
- feat: UI component migration and monorepo cleanup (#69)

### Fixed
- fix(web): resolve i18n Suspense/hydration loop issues (#63)
- fix(config): align ports, env vars, and runtime versions (#98)
- fix(auth): reject default BETTER_AUTH_SECRET in production (#99)
- fix(auth): add error handling to ResendEmailProvider.send() (#102)
- fix(api): add security headers and explicit column selection (#104)
- fix(api): add CORS credentials, database-unavailable filter, error boundary (#120)
- fix(api): resolve Biome lint warnings in RBAC service (#124)
- fix(i18n): backend error messages are not translated on frontend (#128)
- fix(agents): agent team & process audit (#129)
- fix(api): run drizzle-kit through tsx to resolve ESM .js extensions (#139)

### Changed
- refactor(api): migrate correlation ID from interceptor to nestjs-cls middleware (#103)
- refactor: code quality fixes from project audit (#110)
- test: increase coverage to meet 70% thresholds (#76)
- test: close critical test coverage gaps from audit (#134)
- ci(e2e): add auto-trigger, browser caching, and production server (#81)
- ci: add staging branch and on-demand preview deploys (#115)
- ci(api): run Drizzle DB migrations in CI/CD pipeline (#142)
- docs(standards): add coding standards & best practices (#65)
- docs: fix stale docs and add missing guides from audit (#107)
- docs: fix stale documentation from freshness audit (#122)
- docs(processes): overhaul dev process and agent coordination (#125)
- chore(process): overhaul dev workflow with multi-domain review and fixer agent (#133)
- chore(infra): improve Turbo cache hits and align Biome versions (#97)
- chore(security): pre-production security hardening (#105)
- chore: resolve low-priority audit backlog (#109)
- chore: tech debt remediation from project audit (#112)
- chore(web): align demo pages with design system (#113)
- chore(deps): monorepo hygiene fixes from health audit (#121)
