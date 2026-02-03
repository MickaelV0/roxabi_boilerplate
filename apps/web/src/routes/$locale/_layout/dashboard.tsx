import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { HreflangTags, loadI18nNamespaces, useLocale, useTranslation } from '@/lib/i18n'
import type { RouterContext } from '@/router'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$locale/_layout/dashboard')({
  loader: async ({ context }) => {
    const ctx = context as RouterContext
    await loadI18nNamespaces(ctx.i18n, ['dashboard'])

    return {
      stats: { users: 1234, revenue: 56789 },
    }
  },
  head: ({ params }) => ({
    meta: [{ title: `Dashboard | Roxabi (${params.locale.toUpperCase()})` }],
  }),
  component: Dashboard,
})

function Dashboard() {
  const { t } = useTranslation('dashboard')
  const { formatNumber, formatCurrency } = useLocale()
  const { stats } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-fd-background">
      <HreflangTags path="/dashboard" />

      <header className="border-b border-fd-border px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('title', 'Dashboard')}</h1>
        <LanguageSwitcher variant="buttons" />
      </header>

      <main className="p-6">
        <p className="text-fd-muted-foreground mb-6">
          {t('overview.subtitle', 'Welcome to your dashboard')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <div className="p-6 rounded-lg border border-fd-border bg-fd-card">
            <span className="text-sm text-fd-muted-foreground">
              {t('stats.total_users', 'Total users')}
            </span>
            <strong className="block text-3xl font-bold mt-1">{formatNumber(stats.users)}</strong>
          </div>
          <div className="p-6 rounded-lg border border-fd-border bg-fd-card">
            <span className="text-sm text-fd-muted-foreground">
              {t('stats.revenue', 'Revenue')}
            </span>
            <strong className="block text-3xl font-bold mt-1">
              {formatCurrency(stats.revenue, 'EUR')}
            </strong>
          </div>
        </div>
      </main>
    </div>
  )
}
