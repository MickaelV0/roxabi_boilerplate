import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getPunkSongs } from '@/data/demo.punk-songs'

export const Route = createFileRoute('/demo/start/ssr/spa-mode')({
  ssr: false,
  component: RouteComponent,
})

function RouteComponent() {
  const [punkSongs, setPunkSongs] = useState<Array<{ id: number; name: string; artist: string }>>(
    []
  )

  useEffect(() => {
    getPunkSongs().then(setPunkSongs)
  }, [])

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">SPA Mode</h1>
          <p className="mt-2 text-muted-foreground">Client-side rendered punk songs list</p>
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
