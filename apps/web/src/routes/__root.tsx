import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  redirect,
  Scripts,
  useMatches,
} from '@tanstack/react-router'
import { RootProvider } from 'fumadocs-ui/provider/tanstack'
import type * as React from 'react'
import { createI18nContext, detectLanguage } from '@/lib/i18n'
import { getInvalidLocaleRedirect } from '@/lib/i18n/server'
import type { RouterContext } from '@/router'
import appCss from '@/styles/app.css?url'

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: ({ context, location, preload }) => {
    // Skip heavy work during preload to avoid infinite pending
    if (preload) {
      return { i18n: context.i18n }
    }

    // Redirect invalid locales (e.g., /de/dashboard → /en/dashboard)
    const redirectPath = getInvalidLocaleRedirect(location.pathname)
    if (redirectPath) {
      const search = location.searchStr ? `?${location.searchStr}` : ''
      throw redirect({ to: `${redirectPath}${search}` })
    }

    // Initialize i18n context if not already set
    if (!context.i18n) {
      const cookieHeader = typeof document !== 'undefined' ? document.cookie : null
      const detected = detectLanguage(location.pathname, cookieHeader, null)
      return { i18n: createI18nContext(detected.locale) }
    }
    // Return existing context to satisfy TypeScript
    return { i18n: context.i18n }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Roxabi Boilerplate',
      },
      {
        name: 'description',
        content: 'SaaS framework with integrated AI team',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const matches = useMatches()
  const localeMatch = matches.find((m) => 'locale' in m.params)
  const lang = localeMatch ? (localeMatch.params as { locale: string }).locale : 'en'
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
        <Scripts />
      </body>
    </html>
  )
}
