# Frontend Dev Memory

## Landing Page Conventions

- `apps/web/src/routes/index.tsx` is NOT self-contained — it composes 7 section components from `@/components/landing/` (Hero, Features, AiTeam, Dx, TechStack, Stats, Cta); every section except Hero is wrapped in `<AnimatedSection>` from `@repo/ui`
- Section data (features, agents, tech groups, stats) is built as a local array INSIDE the component function, not hoisted to a module-top `const ... = [...] as const` — the arrays call `m.xxx()` Paraglide message functions, which must run at render time (only `HeroSection`'s static, non-translated `TERMINAL_LINES` is a module-top `as const` array)
- Sub-component prop types are inline destructured object types extending `React.ComponentProps<'div'>` etc. (e.g. `FeatureCard`, `SectionHeading`), not standalone `type XxxProps = { ... }` declarations
- `cn()` from `@repo/ui` is used only for conditional className composition (e.g. `FeaturesSection`'s docs-link hover state, `SectionHeading`'s `className` override) — static strings don't need it

<!-- 2026-06-15 cleanup: v10 hacker-aesthetic + v13 glassmorphism deleted (one-off dead experiments, no live route); TS Gotchas promoted → roxabi-boilerplate/CLAUDE.md Gotchas -->
