import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/$')({
  component: NotFound,
})

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="mt-4 text-xl text-muted-foreground">Page not found</p>
      <Link to="/" className="mt-6 text-primary underline underline-offset-4 hover:text-primary/80">
        Go back home
      </Link>
    </div>
  )
}
