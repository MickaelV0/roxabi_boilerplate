import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Separator } from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'
import { Code2, Layers, Zap } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />

        <div className="relative mx-auto max-w-5xl px-6 py-24 sm:py-32 lg:py-40">
          <div className="text-center space-y-8">
            {/* Badge */}
            <Badge variant="secondary" className="px-4 py-1.5 text-sm">
              Production-Ready SaaS Starter
            </Badge>

            {/* Headline */}
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="block">Roxabi</span>
              <span className="block text-muted-foreground">Boilerplate</span>
            </h1>

            {/* Subheadline */}
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Build modern SaaS applications with TanStack Start, NestJS, and TypeScript. Batteries
              included: auth, payments, AI integrations, and more.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <a href="/docs">Get Started</a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a
                  href={import.meta.env.VITE_GITHUB_REPO_URL || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Features Section */}
      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold sm:text-3xl">Built for Developers</h2>
          <p className="mt-2 text-muted-foreground">
            Everything you need to ship fast, without compromising on quality.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Modern Frontend</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                TanStack Start with React 19, file-based routing, server functions, and Tailwind CSS
                for rapid UI development.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-xs">
                  React 19
                </Badge>
                <Badge variant="outline" className="text-xs">
                  TanStack
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Tailwind
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Robust Backend</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                NestJS with Fastify for a scalable, type-safe API layer. Includes typed API client
                with ofetch for seamless frontend integration.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-xs">
                  NestJS
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Fastify
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Typed API
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Code2 className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Developer Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                TypeScript strict mode, Biome for linting/formatting, TurboRepo for monorepo
                management, and comprehensive documentation.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-xs">
                  TypeScript
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Biome
                </Badge>
                <Badge variant="outline" className="text-xs">
                  TurboRepo
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-5xl px-6 text-center text-sm text-muted-foreground">
          <p>
            Roxabi Boilerplate &middot; MIT License &middot;{' '}
            <a href="/docs" className="hover:text-foreground transition-colors">
              Documentation
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
