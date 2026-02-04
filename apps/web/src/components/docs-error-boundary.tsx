import { baseOptions } from '@/lib/layout.shared'
import { Link } from '@tanstack/react-router'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class DocsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <HomeLayout {...baseOptions()} className="text-center py-32 justify-center">
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-6xl font-bold text-fd-muted-foreground">Error</h1>
            <h2 className="text-2xl font-semibold">Something went wrong</h2>
            <p className="text-fd-muted-foreground max-w-md">
              An error occurred while loading this documentation page.
            </p>
            {this.state.error && (
              <pre className="text-sm text-fd-muted-foreground bg-fd-muted p-4 rounded-lg max-w-lg overflow-auto">
                {this.state.error.message}
              </pre>
            )}
            <Link
              to="/docs/$"
              params={{ _splat: '' }}
              className="mt-4 px-4 py-2 rounded-lg bg-fd-primary text-fd-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Back to Documentation
            </Link>
          </div>
        </HomeLayout>
      )
    }

    return this.props.children
  }
}
