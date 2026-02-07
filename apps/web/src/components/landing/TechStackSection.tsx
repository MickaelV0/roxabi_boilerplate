import { Badge } from '@repo/ui'
import { m } from '@/paraglide/messages'

export function TechStackSection() {
  const techGroups = [
    {
      label: m.tech_frontend(),
      items: [
        'React 19',
        'TanStack Start',
        'TanStack Router',
        'Tailwind CSS 4',
        'Radix UI',
        'Paraglide JS',
      ],
    },
    {
      label: m.tech_backend(),
      items: ['NestJS', 'Fastify', 'Drizzle ORM', 'PostgreSQL', 'Better Auth'],
    },
    {
      label: m.tech_tooling(),
      items: ['Bun', 'TurboRepo', 'Biome', 'Vitest', 'Playwright', 'GitHub Actions'],
    },
  ]

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">{m.tech_title()}</h2>
        <div className="grid gap-12 sm:grid-cols-3">
          {techGroups.map((group) => (
            <div key={group.label} className="text-center">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {group.items.map((tech) => (
                  <Badge key={tech} variant="outline" className="text-sm">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
