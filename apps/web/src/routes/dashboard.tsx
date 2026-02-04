import { createFileRoute } from '@tanstack/react-router'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useLocaleFormatters } from '@/lib/locale-utils'
import { HreflangTags } from '@/lib/seo'
import * as m from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'

export const Route = createFileRoute('/dashboard')({
  head: () => ({
    meta: [{ title: `Dashboard | Roxabi (${getLocale().toUpperCase()})` }],
  }),
  component: Dashboard,
})

function Dashboard() {
  const { formatNumber, formatCurrency } = useLocaleFormatters()
  const stats = { users: 1234, revenue: 56789 }

  return (
    <div className="min-h-screen bg-fd-background">
      <HreflangTags path="/dashboard" />

      <header className="border-b border-fd-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{m.dashboard_title()}</h1>
        <LanguageSwitcher variant="buttons" />
      </header>

      <main className="p-6">
        <p className="text-fd-muted-foreground mb-6">{m.dashboard_overview_subtitle()}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <div className="p-6 rounded-lg border border-fd-border bg-fd-card">
            <span className="text-sm text-fd-muted-foreground">
              {m.dashboard_stats_total_users()}
            </span>
            <strong className="block text-3xl font-bold mt-1">{formatNumber(stats.users)}</strong>
          </div>
          <div className="p-6 rounded-lg border border-fd-border bg-fd-card">
            <span className="text-sm text-fd-muted-foreground">{m.dashboard_stats_revenue()}</span>
            <strong className="block text-3xl font-bold mt-1">
              {formatCurrency(stats.revenue, 'EUR')}
            </strong>
          </div>
        </div>
      </main>
    </div>
  )
}
