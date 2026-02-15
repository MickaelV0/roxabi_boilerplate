import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { getPunkSongs } from '@/data/demo.punk-songs'
import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/demo/start/ssr/full-ssr')({
  component: RouteComponent,
  loader: async () => await getPunkSongs(),
  head: () => ({
    meta: [{ title: `${m.demo_ssr_full_heading()} | Roxabi` }],
  }),
})

function RouteComponent() {
  const punkSongs = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-2xl px-6">
        <Link
          to="/demo"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          {m.demo_back_to_demos()}
        </Link>
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">{m.demo_ssr_full_heading()}</h1>
          <p className="mt-2 text-muted-foreground">{m.demo_ssr_full_subtitle()}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{m.demo_ssr_punk_songs()}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {punkSongs.map((song) => (
                <li key={song.id} className="rounded-lg bg-muted p-4">
                  <span className="text-lg font-medium">{song.name}</span>
                  <span className="text-muted-foreground"> - {song.artist}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
