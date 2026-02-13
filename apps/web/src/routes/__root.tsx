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
import { getLocale } from '@/paraglide/runtime'
import { Header } from '../components/Header'
import { TanStackQueryDevtools } from '../integrations/tanstack-query/devtools'
import { demoStoreDevtools } from '../lib/demo-store-devtools'
import appCss from '../styles.css?url'

export type MyRouterContext = {
  queryClient: QueryClient
}

const LABELS = {
  errorTitle: 'Something went wrong',
  notFoundCode: '404',
  notFoundTitle: 'Page not found',
} as const

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
        <h2 className="text-2xl font-bold text-destructive mb-4">{LABELS.errorTitle}</h2>
        <p className="text-muted-foreground mb-4">{message}</p>
        <button
          type="button"
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => {
    // Other redirect strategies are possible; see
    // https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#offline-redirect
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', getLocale())
    }
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
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap',
      },
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
      <h1 className="text-6xl font-bold text-muted-foreground">{LABELS.notFoundCode}</h1>
      <p className="mt-4 text-xl text-muted-foreground">{LABELS.notFoundTitle}</p>
      <Link to="/" className="mt-6 text-primary underline underline-offset-4 hover:text-primary/80">
        Go back home
      </Link>
    </div>
  )
}

const CHROMELESS_PREFIXES = ['/docs', '/talks'] as const

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isChromeless = CHROMELESS_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  return (
    <RootProvider>
      {!isChromeless && <Header />}
      <ErrorBoundary FallbackComponent={ErrorFallback}>{children}</ErrorBoundary>
      <Toaster richColors />
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
