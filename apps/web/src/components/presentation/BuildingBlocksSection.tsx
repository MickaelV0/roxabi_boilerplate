import { AnimatedSection, Badge, Card, cn } from '@repo/ui'
import { FileText, Shield, Users, Zap } from 'lucide-react'

const skills = [
  'commit',
  'review',
  'bootstrap',
  'scaffold',
  'pr',
  'promote',
  'test',
  'issues',
  'issue-triage',
  'interview',
  'cleanup',
  '1b1',
  'adr',
  'agent-browser',
  'context7',
  'skill-creator',
] as const

const hooks = [
  { name: 'PostToolUse', desc: 'Biome auto-format on every file change' },
  { name: 'PreToolUse', desc: 'Security warnings before file writes' },
  { name: 'pre-commit', desc: 'Lint + format staged files' },
  { name: 'commit-msg', desc: 'Commitlint validates Conventional Commits' },
  { name: 'pre-push', desc: 'Lint, typecheck, and test coverage' },
] as const

const agentFiles = [
  'frontend-dev.md',
  'backend-dev.md',
  'devops.md',
  'tester.md',
  'fixer.md',
  'security-auditor.md',
  'architect.md',
  'product-lead.md',
  'doc-writer.md',
] as const

// Static data — JSX in `visual` is safe at module scope since it contains no hooks or dynamic state
const blocks = [
  {
    icon: FileText,
    title: 'CLAUDE.md',
    subtitle: 'The constitution',
    description:
      'Project-level instructions. Critical rules, coding standards, skill registry, agent definitions.',
    visual: (
      <div className="mt-4 rounded-lg border border-border/30 bg-muted/20 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
        <p className="text-foreground/80"># Claude Configuration</p>
        <p className="mt-1">## TL;DR</p>
        <p>- Before any work: Read dev-process.mdx</p>
        <p>- All code changes require a worktree</p>
        <p>- Always use Conventional Commits</p>
      </div>
    ),
  },
  {
    icon: Zap,
    title: '16 Skills',
    subtitle: 'Slash commands',
    description: 'Reusable workflows: /commit, /review, /bootstrap, /scaffold, /pr, /promote...',
    visual: (
      <div className="mt-4 flex flex-wrap gap-2">
        {skills.map((skill) => (
          <Badge key={skill} variant="outline" className="font-mono text-xs">
            /{skill}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    icon: Shield,
    title: 'Hooks',
    subtitle: 'Auto-enforcement',
    description: 'Biome auto-format on save, security warnings, git pre-commit/push quality gates.',
    visual: (
      <div className="mt-4 space-y-2">
        {hooks.map((hook) => (
          <div key={hook.name} className="flex items-start gap-2 text-sm">
            <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary">
              {hook.name}
            </span>
            <span className="text-muted-foreground">{hook.desc}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Users,
    title: '9 Agent Definitions',
    subtitle: '.claude/agents/',
    description: 'Role-specific .md files defining tools, permissions, domains, and skills.',
    visual: (
      <div className="mt-4 rounded-lg border border-border/30 bg-muted/20 p-3 font-mono text-xs">
        <p className="text-muted-foreground">.claude/agents/</p>
        {agentFiles.map((file) => (
          <p key={file} className="ml-4 text-foreground/70">
            {file}
          </p>
        ))}
      </div>
    ),
  },
] as const

export function BuildingBlocksSection() {
  return (
    <div className="mx-auto max-w-7xl w-full">
      <AnimatedSection>
        <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">Building Blocks</h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Four pillars that transform Claude from a chatbot into a development workforce.
        </p>
      </AnimatedSection>

      {/* Bento grid: featured card spans full width, remaining 3 below in asymmetric sizes */}
      <div className="mt-12 grid gap-6 md:grid-cols-6">
        {blocks.map((block, index) => (
          <AnimatedSection
            key={block.title}
            className={cn(
              // Featured card (CLAUDE.md) spans full width
              index === 0 && 'md:col-span-6',
              // Skills card takes 4 columns (wider — badges need room)
              index === 1 && 'md:col-span-4',
              // Hooks card takes 2 columns
              index === 2 && 'md:col-span-2',
              // Agent definitions centered below
              index === 3 && 'md:col-span-4 md:col-start-2',
              // Stagger animation for rows below the first
              index > 0 && 'md:delay-150'
            )}
          >
            <Card
              variant="subtle"
              className={cn(
                'h-full p-6 lg:p-8',
                // Featured card gets a horizontal layout on desktop
                index === 0 && 'md:flex md:flex-row md:items-start md:gap-8'
              )}
            >
              {/* Text content */}
              <div className={cn(index === 0 && 'md:flex-1')}>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <block.icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{block.title}</h3>
                    <p className="text-sm text-muted-foreground">{block.subtitle}</p>
                  </div>
                </div>
                <p className="mt-4 text-muted-foreground">{block.description}</p>
              </div>
              {/* Visual content — for featured card, sits beside text on desktop */}
              <div className={cn(index === 0 && 'md:flex-1')}>{block.visual}</div>
            </Card>
          </AnimatedSection>
        ))}
      </div>
    </div>
  )
}
