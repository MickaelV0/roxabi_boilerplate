import { BookOpen, FlaskConical, ShieldCheck, Zap } from 'lucide-react'
import { FeatureCard } from '@/components/FeatureCard'
import { SectionHeading } from '@/components/landing/SectionHeading'
import { m } from '@/paraglide/messages'

export function DxSection() {
  const dxFeatures = [
    { icon: FlaskConical, title: m.dx_tdd_title(), description: m.dx_tdd_desc() },
    { icon: ShieldCheck, title: m.dx_quality_title(), description: m.dx_quality_desc() },
    { icon: BookOpen, title: m.dx_docs_title(), description: m.dx_docs_desc() },
    { icon: Zap, title: m.dx_tooling_title(), description: m.dx_tooling_desc() },
  ]

  return (
    <section className="border-t border-border bg-muted/30 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading title={m.dx_title()} subtitle={m.dx_subtitle()} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dxFeatures.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={<feature.icon className="mb-2 h-8 w-8 text-primary" />}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
