import { NotFound } from '@/components/not-found'
import { type I18nRouterContext, initClientI18n } from '@/lib/i18n'
import { type AnyRouter, createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export type RouterContext = {
  i18n: I18nRouterContext
}

type DehydratedState = {
  i18nResources: Record<string, Record<string, object>>
  i18nLocale: string
}

let router: AnyRouter | null = null

export function createAppRouter() {
  const r = createTanStackRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultNotFoundComponent: NotFound,
    context: {
      // biome-ignore lint/style/noNonNullAssertion: Context is set via updateRouterContext before first render
      i18n: undefined!,
    } as RouterContext,
    dehydrate: () => {
      const ctx = r.options.context as RouterContext | undefined
      return {
        i18nResources: (ctx?.i18n?.resources ?? {}) as Record<string, Record<string, object>>,
        i18nLocale: ctx?.i18n?.locale ?? 'en',
      }
    },
    hydrate: async (dehydrated: DehydratedState) => {
      const { i18nResources, i18nLocale } = dehydrated
      await initClientI18n(i18nLocale as 'en' | 'fr', {
        [i18nLocale]: i18nResources,
      })
    },
  })
  return r
}

export function getRouter() {
  if (!router) {
    router = createAppRouter()
  }
  return router
}

export function updateRouterContext(i18n: I18nRouterContext) {
  const r = getRouter()
  r.update({
    context: { i18n } as RouterContext,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
