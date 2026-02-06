import { FeatureCard } from '@repo/ui'
import { BookOpen, FlaskConical, ShieldCheck, Zap } from 'lucide-react'
import { m } from '@/paraglide/messages'

const dxFeatures = [
  { icon: FlaskConical, titleKey: 'dx_tdd_title', descKey: 'dx_tdd_desc' },
  { icon: ShieldCheck, titleKey: 'dx_quality_title', descKey: 'dx_quality_desc' },
  { icon: BookOpen, titleKey: 'dx_docs_title', descKey: 'dx_docs_desc' },
  { icon: Zap, titleKey: 'dx_tooling_title', descKey: 'dx_tooling_desc' },
] as const

function msg(key: string): string {
  const fn = (m as unknown as Record<string, (inputs: Record<string, unknown>) => string>)[key]
  return fn?.({}) ?? key
}

export function DxSection() {
  return (
    <section className="border-t border-border bg-muted/30 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">{m.dx_title()}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{m.dx_subtitle()}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dxFeatures.map((feature) => (
            <FeatureCard
              key={feature.titleKey}
              icon={<feature.icon className="mb-2 h-8 w-8 text-primary" />}
              title={msg(feature.titleKey)}
              description={msg(feature.descKey)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
