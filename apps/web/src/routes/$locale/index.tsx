import { createFileRoute, Link } from '@tanstack/react-router'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { useTranslation } from '@/lib/i18n'
import { baseOptions } from '@/lib/layout.shared'

export const Route = createFileRoute('/$locale/')({
  component: LocalizedHome,
})

function LocalizedHome() {
  const { t } = useTranslation('common')
  const { locale } = Route.useParams()

  return (
    <HomeLayout {...baseOptions()}>
      <div className="flex flex-col flex-1 justify-center px-4 py-8 text-center">
        <h1 className="font-medium text-2xl mb-4">{t('app.name', 'Roxabi Boilerplate')}</h1>
        <p className="text-fd-muted-foreground mb-8">
          {t('app.description', 'SaaS framework with integrated AI team')}
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/docs/$"
            params={{ _splat: '' }}
            className="px-4 py-2 rounded-lg bg-fd-primary text-fd-primary-foreground font-medium text-sm"
          >
            {t('nav.docs', 'Documentation')}
          </Link>
          <Link
            to="/$locale/dashboard"
            params={{ locale }}
            className="px-4 py-2 rounded-lg bg-fd-muted text-fd-muted-foreground font-medium text-sm hover:bg-fd-accent"
          >
            {t('nav.dashboard', 'Dashboard')}
          </Link>
        </div>
      </div>
    </HomeLayout>
  )
}
