import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@repo/ui'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useState } from 'react'

import { m } from '@/paraglide/messages'

export const Route = createFileRoute('/demo/tanstack-query')({
  component: TanStackQueryDemo,
  head: () => ({
    meta: [{ title: `${m.demo_query_heading()} | Roxabi` }],
  }),
})

type Todo = {
  id: number
  name: string
}

function TanStackQueryDemo() {
  const { data, refetch } = useQuery<Todo[]>({
    queryKey: ['todos'],
    queryFn: () =>
      fetch('/demo/api/tq-todos').then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json()
      }),
    initialData: [],
  })

  const { mutate: addTodo } = useMutation({
    mutationFn: (todo: string) =>
      fetch('/demo/api/tq-todos', {
        method: 'POST',
        body: JSON.stringify(todo),
      }).then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json()
      }),
    onSuccess: () => refetch(),
  })

  const [todo, setTodo] = useState('')

  const submitTodo = useCallback(async () => {
    await addTodo(todo)
    setTodo('')
  }, [addTodo, todo])

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">{m.demo_query_heading()}</h1>
          <p className="mt-2 text-muted-foreground">{m.demo_query_subtitle()}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{m.demo_query_todos()}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="mb-4 space-y-2">
              {data?.map((t) => (
                <li key={t.id} className="rounded-lg bg-muted p-3">
                  <span className="text-lg">{t.name}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2">
              <Input
                type="text"
                value={todo}
                onChange={(e) => setTodo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    submitTodo()
                  }
                }}
                placeholder={m.demo_query_placeholder()}
              />
              <Button type="button" disabled={todo.trim().length === 0} onClick={submitTodo}>
                {m.demo_query_add()}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
