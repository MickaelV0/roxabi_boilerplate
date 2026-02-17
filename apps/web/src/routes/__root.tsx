import type { ConsentCookiePayload } from '@repo/types'
import { Toaster } from '@repo/ui'
import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Scripts,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { RootProvider } from 'fumadocs-ui/provider/tanstack'
import { ErrorBoundary } from 'react-error-boundary'
import { m } from '@/paraglide/messages'
import { getLocale } from '@/paraglide/runtime'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { TanStackQueryDevtools } from '../integrations/tanstack-query/devtools'
import { ConsentProvider } from '../lib/consent/ConsentProvider'
import { getServerConsent } from '../lib/consent/server'
import { demoStoreDevtools } from '../lib/demo-store-devtools'
import appCss from '../styles.css?url'

export type MyRouterContext = {
  queryClient: QueryClient
  serverConsent?: ConsentCookiePayload | null
}

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: unknown
  resetErrorBoundary: () => void
}) {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred'
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md p-8 bg-card rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold text-destructive mb-4">
          {m.error_something_went_wrong()}
        </h2>
        <p className="text-muted-foreground mb-4">{message}</p>
        <button
          type="button"
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        >
          {m.error_try_again()}
        </button>
      </div>
    </div>
  )
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', getLocale())
    }
  },

  loader: async () => {
    const serverConsent = await getServerConsent()
    return { serverConsent }
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
        title: 'Roxabi',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">{m.error_page_not_found_title()}</h1>
      <p className="mt-4 text-xl text-muted-foreground">{m.error_page_not_found_description()}</p>
      <Link to="/" className="mt-6 text-primary underline underline-offset-4 hover:text-primary/80">
        {m.error_go_home()}
      </Link>
    </div>
  )
}

const CHROMELESS_PREFIXES = ['/docs', '/talks'] as const

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isChromeless = CHROMELESS_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  const loaderData = Route.useLoaderData() as
    | { serverConsent: ConsentCookiePayload | null }
    | undefined
  const serverConsent = loaderData?.serverConsent ?? null

  return (
    <RootProvider>
      <ConsentProvider initialConsent={serverConsent}>
        <div className="flex min-h-screen flex-col">
          {!isChromeless && <Header />}
          <div className="flex-1">
            <ErrorBoundary FallbackComponent={ErrorFallback}>{children}</ErrorBoundary>
          </div>
          {!isChromeless && <Footer />}
        </div>
        <Toaster richColors position="top-right" offset="4rem" />
      </ConsentProvider>
    </RootProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang={getLocale()} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <AppShell>{children}</AppShell>
        {import.meta.env.DEV && (
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
              demoStoreDevtools,
              TanStackQueryDevtools,
            ]}
          />
        )}
        <Scripts />
      </body>
    </html>
  )
}
