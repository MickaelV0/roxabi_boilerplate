import { Link } from '@tanstack/react-router'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { baseOptions } from '@/lib/layout.shared'
import { m } from '@/paraglide/messages'

type DocsErrorFallbackProps = {
  error: unknown
  resetErrorBoundary: () => void
}

function DocsErrorFallback({ error, resetErrorBoundary }: DocsErrorFallbackProps) {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred'

  return (
    <HomeLayout {...baseOptions()} className="text-center py-32 justify-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-6xl font-bold text-fd-muted-foreground">{m.docs_error_title()}</h1>
        <h2 className="text-2xl font-semibold">{m.docs_error_something_went_wrong()}</h2>
        <p className="text-fd-muted-foreground max-w-md">{m.docs_error_loading_page()}</p>
        <pre className="text-sm text-fd-muted-foreground bg-fd-muted p-4 rounded-lg max-w-lg overflow-auto">
          {message}
        </pre>
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={resetErrorBoundary}
            className="px-4 py-2 rounded-lg bg-fd-primary text-fd-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
          >
            {m.docs_error_try_again()}
          </button>
          <Link
            to="/docs/$"
            params={{ _splat: '' }}
            className="px-4 py-2 rounded-lg bg-fd-primary text-fd-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
          >
            {m.docs_error_back_to_docs()}
          </Link>
        </div>
      </div>
    </HomeLayout>
  )
}

type DocsErrorBoundaryProps = {
  children: ReactNode
}

export function DocsErrorBoundary({ children }: DocsErrorBoundaryProps) {
  return <ErrorBoundary FallbackComponent={DocsErrorFallback}>{children}</ErrorBoundary>
}
