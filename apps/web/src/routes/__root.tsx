import { Button, Toaster } from '@repo/ui'
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
import { Header } from '../components/Header'
import { TanStackQueryDevtools } from '../integrations/tanstack-query/devtools'
import { demoStoreDevtools } from '../lib/demo-store-devtools'
import appCss from '../styles.css?url'

export type MyRouterContext = {
  queryClient: QueryClient
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: unknown
  resetErrorBoundary: () => void
}) {
  const message = error instanceof Error ? error.message : m.error_unexpected()
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md p-8 bg-card rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold text-destructive mb-4">{m.error_title()}</h2>
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
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

export function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <p className="text-7xl font-bold text-muted-foreground/50" aria-hidden="true">
        {'404'}
      </p>
      <h1 className="mt-4 text-2xl font-semibold">{m.not_found_title()}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">{m.not_found_description()}</p>
      <Button asChild className="mt-8">
        <Link to="/">{m.not_found_go_home()}</Link>
      </Button>
    </div>
  )
}

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isDocsPage = pathname.startsWith('/docs')

  return (
    <RootProvider>
      {!isDocsPage && <Header />}
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
