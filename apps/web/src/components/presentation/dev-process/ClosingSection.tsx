import { AnimatedSection, Card, cn } from '@repo/ui'
import { Link } from '@tanstack/react-router'
import { BookOpen, GitFork, Terminal } from 'lucide-react'
import type { ComponentType } from 'react'
import { m } from '@/paraglide/messages'

type CtaCard = {
  id: string
  icon: ComponentType<{ className?: string }>
  label: () => string
  description: () => string
  href?: string
  splat?: string
  external?: boolean
}

export function ClosingSection() {
  const ctas: ReadonlyArray<CtaCard> = [
    {
      id: 'docs',
      icon: BookOpen,
      label: m.talk_dp_closing_docs,
      description: m.talk_dp_closing_docs_desc,
      href: '/docs/$',
      splat: '',
    },
    {
      id: 'fork',
      icon: GitFork,
      label: m.talk_dp_closing_fork,
      description: m.talk_dp_closing_fork_desc,
      href: 'https://github.com/MickaelV0/roxabi_boilerplate',
      external: true,
    },
    {
      id: 'try',
      icon: Terminal,
      label: m.talk_dp_closing_try,
      description: m.talk_dp_closing_try_desc,
    },
  ]

  return (
    <div className="relative mx-auto max-w-7xl w-full">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10" />
      </div>

      <AnimatedSection>
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">
            {m.talk_dp_closing_title()}
          </h2>
        </div>
      </AnimatedSection>

      {/* CTA cards */}
      <AnimatedSection className="mt-12">
        <div className="grid gap-6 sm:grid-cols-3">
          {ctas.map((cta) => {
            const content = (
              <Card
                variant="subtle"
                className={cn(
                  'group flex flex-col items-center gap-4 p-8 text-center transition-colors',
                  cta.href && 'cursor-pointer hover:border-primary/30'
                )}
              >
                <div className="rounded-xl bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
                  <cta.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-base font-semibold">{cta.label()}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{cta.description()}</p>
                </div>
              </Card>
            )

            if (cta.external) {
              return (
                <a key={cta.id} href={cta.href} target="_blank" rel="noopener noreferrer">
                  {content}
                </a>
              )
            }

            if (cta.href && cta.splat !== undefined) {
              return (
                <Link key={cta.id} to={cta.href} params={{ _splat: cta.splat }}>
                  {content}
                </Link>
              )
            }

            return <div key={cta.id}>{content}</div>
          })}
        </div>
      </AnimatedSection>
    </div>
  )
}
