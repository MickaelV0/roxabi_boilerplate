import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'
import { getPunkSongs } from '@/data/demo.punk-songs'

export const Route = createFileRoute('/demo/start/ssr/full-ssr')({
  component: RouteComponent,
  loader: async () => await getPunkSongs(),
})

function RouteComponent() {
  const punkSongs = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Full SSR</h1>
          <p className="mt-2 text-muted-foreground">Server-side rendered punk songs list</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Punk Songs</CardTitle>
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
