import { AnimatedSection, Card } from '@repo/ui'
import { Link } from '@tanstack/react-router'
import { BookOpen, GitFork, Terminal } from 'lucide-react'
import type { ComponentType } from 'react'
import { m } from '@/paraglide/messages'

type CtaCard = {
  icon: ComponentType<{ className?: string }>
  label: () => string
  href?: string
  external?: boolean
}

export function ClosingSection() {
  const ctas: ReadonlyArray<CtaCard> = [
    {
      icon: BookOpen,
      label: m.talk_closing_cta_docs,
      href: '/docs/$',
    },
    {
      icon: GitFork,
      label: m.talk_closing_cta_repo,
      href: 'https://github.com/MickaelV0/roxabi_boilerplate',
      external: true,
    },
    {
      icon: Terminal,
      label: m.talk_closing_cta_try,
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
            {m.talk_closing_title()}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{m.talk_closing_subtitle()}</p>
        </div>
      </AnimatedSection>

      {/* CTA cards */}
      <AnimatedSection className="mt-12">
        <div className="grid gap-6 sm:grid-cols-3">
          {ctas.map((cta) => {
            const content = (
              <Card
                variant="subtle"
                className="group flex flex-col items-center gap-4 p-8 text-center transition-colors hover:border-primary/30 cursor-pointer"
              >
                <div className="rounded-xl bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
                  <cta.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-base font-semibold">{cta.label()}</p>
              </Card>
            )

            if (cta.external) {
              return (
                <a key={cta.label()} href={cta.href} target="_blank" rel="noopener noreferrer">
                  {content}
                </a>
              )
            }

            if (cta.href) {
              return (
                <Link key={cta.label()} to="/docs/$" params={{ _splat: 'getting-started' }}>
                  {content}
                </Link>
              )
            }

            return <div key={cta.label()}>{content}</div>
          })}
        </div>
      </AnimatedSection>

      {/* Tagline */}
      <AnimatedSection className="mt-12">
        <p className="text-center text-lg italic text-muted-foreground">
          {m.talk_closing_tagline()}
        </p>
      </AnimatedSection>
    </div>
  )
}
