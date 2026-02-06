import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'
import { Bot, Code2, ExternalLink, FolderTree, Globe, Layers, Shield } from 'lucide-react'
import { Footer } from '@/components/Footer'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

const features = [
  { icon: Layers, titleKey: 'feature_fullstack_title', descKey: 'feature_fullstack_desc' },
  { icon: Shield, titleKey: 'feature_typesafe_title', descKey: 'feature_typesafe_desc' },
  { icon: FolderTree, titleKey: 'feature_monorepo_title', descKey: 'feature_monorepo_desc' },
  { icon: Code2, titleKey: 'feature_ui_title', descKey: 'feature_ui_desc' },
  { icon: Globe, titleKey: 'feature_i18n_title', descKey: 'feature_i18n_desc' },
  { icon: Bot, titleKey: 'feature_ai_title', descKey: 'feature_ai_desc' },
] as const

const techStack = [
  'React 19',
  'TanStack Start',
  'TanStack Router',
  'NestJS',
  'Fastify',
  'Bun',
  'TurboRepo',
  'Tailwind CSS 4',
  'Radix UI',
  'Biome',
  'Paraglide JS',
  'Vitest',
]

function msg(key: string): string {
  const fn = (m as unknown as Record<string, (inputs: Record<string, unknown>) => string>)[key]
  return fn?.({}) ?? key
}

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-6 py-24 text-center">
          <Badge variant="secondary" className="mb-6">
            {m.hero_badge()}
          </Badge>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {m.hero_title()}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {m.hero_subtitle()}
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <a href="/docs">{m.hero_cta_start()}</a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a
                href={import.meta.env.VITE_GITHUB_REPO_URL || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                {m.hero_cta_github()}
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-muted/30 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
              {m.features_title()}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.titleKey} className="border-border bg-background">
                  <CardHeader>
                    <feature.icon className="mb-2 h-8 w-8 text-primary" />
                    <CardTitle>{msg(feature.titleKey)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{msg(feature.descKey)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <h2 className="mb-12 text-3xl font-bold tracking-tight">{m.tech_title()}</h2>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {techStack.map((tech) => (
                <Badge key={tech} variant="outline" className="text-sm">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
