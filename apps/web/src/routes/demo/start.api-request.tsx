import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { m } from '@/paraglide/messages'

function getNames() {
  return fetch('/demo/api/names').then((res) => {
    if (!res.ok) throw new Error(`Request failed: ${res.status}`)
    return res.json() as Promise<string[]>
  })
}

export const Route = createFileRoute('/demo/start/api-request')({
  component: Home,
  head: () => ({
    meta: [{ title: `${m.demo_api_heading()} | Roxabi` }],
  }),
})

function Home() {
  const { data: names = [] } = useQuery({
    queryKey: ['names'],
    queryFn: getNames,
  })

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">{m.demo_api_heading()}</h1>
          <p className="mt-2 text-muted-foreground">{m.demo_api_subtitle()}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{m.demo_api_names_list()}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {names.map((name) => (
                <li key={name} className="rounded-lg bg-muted p-3">
                  <span className="text-lg">{name}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
