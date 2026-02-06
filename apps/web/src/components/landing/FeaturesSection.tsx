import { FeatureCard } from '@repo/ui'
import { Bot, Building2, FolderTree, Globe, KeyRound, Layers, ShieldCheck } from 'lucide-react'
import { m } from '@/paraglide/messages'

const features = [
  { icon: Layers, titleKey: 'feature_fullstack_title', descKey: 'feature_fullstack_desc' },
  { icon: ShieldCheck, titleKey: 'feature_auth_title', descKey: 'feature_auth_desc' },
  { icon: Building2, titleKey: 'feature_multitenant_title', descKey: 'feature_multitenant_desc' },
  { icon: KeyRound, titleKey: 'feature_rbac_title', descKey: 'feature_rbac_desc' },
  { icon: ShieldCheck, titleKey: 'feature_typesafe_title', descKey: 'feature_typesafe_desc' },
  { icon: FolderTree, titleKey: 'feature_monorepo_title', descKey: 'feature_monorepo_desc' },
  { icon: Globe, titleKey: 'feature_i18n_title', descKey: 'feature_i18n_desc' },
  { icon: Bot, titleKey: 'feature_ai_title', descKey: 'feature_ai_desc' },
] as const

function msg(key: string): string {
  const fn = (m as unknown as Record<string, (inputs: Record<string, unknown>) => string>)[key]
  return fn?.({}) ?? key
}

export function FeaturesSection() {
  return (
    <section className="border-t border-border bg-muted/30 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">{m.features_title()}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{m.features_subtitle()}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
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
