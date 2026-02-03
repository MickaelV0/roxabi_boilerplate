import {
  DEFAULT_LOCALE,
  type Locale,
  type Namespace,
  createServerI18n,
  isValidLocale,
  loadI18nNamespaces,
} from '@/lib/i18n'
import type { RouterContext } from '@/router'
import { Outlet, createFileRoute, redirect, useRouteContext } from '@tanstack/react-router'
import { use, useMemo } from 'react'
import { I18nextProvider } from 'react-i18next'

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

  // Create i18next instance with loaded resources
  const i18nInstance = useMemo(() => {
    const namespaces = Object.keys(context.i18n.resources) as Namespace[]
    return createServerI18n(
      locale as Locale,
      namespaces.length > 0 ? namespaces : ['common'],
      context.i18n.resources as Record<Namespace, Record<string, unknown>>
    )
  }, [locale, context.i18n.resources])

  // Use React's use() hook to handle the promise
  const resolvedI18n = use(i18nInstance)

  return (
    <I18nextProvider i18n={resolvedI18n}>
      <Outlet />
    </I18nextProvider>
  )
}
