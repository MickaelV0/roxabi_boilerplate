import { createFileRoute, Outlet, redirect, useRouteContext } from '@tanstack/react-router'
import i18next from 'i18next'
import { useMemo } from 'react'
import { I18nextProvider } from 'react-i18next'
import {
  DEFAULT_LOCALE,
  getServerConfig,
  isValidLocale,
  type Locale,
  loadI18nNamespaces,
  type Namespace,
} from '@/lib/i18n'
import type { RouterContext } from '@/router'

export const Route = createFileRoute('/$locale/_layout')({
  beforeLoad: async ({ params, context }) => {
    const { locale } = params
    const ctx = context as RouterContext

    if (!isValidLocale(locale)) {
      throw redirect({
        to: '/$locale',
        params: { locale: DEFAULT_LOCALE },
        replace: true,
      })
    }

    await loadI18nNamespaces(ctx.i18n, ['common'])
  },
  component: LocaleLayout,
})

function LocaleLayout() {
  const { locale } = Route.useParams()
  const context = useRouteContext({ from: '/$locale/_layout' }) as unknown as RouterContext

  const i18nInstance = useMemo(() => {
    const namespaces = Object.keys(context.i18n.resources) as Namespace[]
    return i18next.cloneInstance({
      ...getServerConfig(locale as Locale),
      lng: locale,
      ns: namespaces.length > 0 ? namespaces : ['common'],
      resources: { [locale]: context.i18n.resources },
    })
  }, [locale, context.i18n.resources])

  return (
    <I18nextProvider i18n={i18nInstance}>
      <Outlet />
    </I18nextProvider>
  )
}
