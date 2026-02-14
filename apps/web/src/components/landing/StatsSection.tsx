import { StatCounter } from '@repo/ui'
import { m } from '@/paraglide/messages'

export function StatsSection() {
  const stats = [
    { value: 15, suffix: '+', label: m.stats_features() },
    { value: 100, suffix: '%', label: m.stats_typesafe() },
    { value: 10, suffix: '+', label: m.stats_components() },
    { value: 5, suffix: '', label: m.stats_integrations() },
  ]

  return (
    <section className="border-t border-border py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCounter
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
