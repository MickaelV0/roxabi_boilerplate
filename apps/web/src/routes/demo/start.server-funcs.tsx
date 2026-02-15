import fs from 'node:fs'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@repo/ui'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { ChevronLeft } from 'lucide-react'
import { useCallback, useState } from 'react'
import { clientEnv } from '@/lib/env.client.js'
import { m } from '@/paraglide/messages'

/*
const loggingMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    console.log("Request:", request.url);
    return next();
  }
);
const loggedServerFunction = createServerFn({ method: "GET" }).middleware([
  loggingMiddleware,
]);
*/

const TODOS_FILE = 'todos.json'

async function readTodos() {
  return JSON.parse(
    await fs.promises.readFile(TODOS_FILE, 'utf-8').catch(() =>
      JSON.stringify(
        [
          { id: 1, name: 'Get groceries' },
          { id: 2, name: 'Buy a new phone' },
        ],
        null,
        2
      )
    )
  )
}

const getTodos = createServerFn({
  method: 'GET',
}).handler(async () => {
  if (clientEnv.VITE_ENABLE_DEMO !== 'true') {
    throw new Error('Not Found')
  }
  return await readTodos()
})

const addTodo = createServerFn({ method: 'POST' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    if (clientEnv.VITE_ENABLE_DEMO !== 'true') {
      throw new Error('Not Found')
    }
    const todos = await readTodos()
    todos.push({ id: todos.length + 1, name: data })
    await fs.promises.writeFile(TODOS_FILE, JSON.stringify(todos, null, 2))
    return todos
  })

export const Route = createFileRoute('/demo/start/server-funcs')({
  component: Home,
  loader: async () => await getTodos(),
  head: () => ({
    meta: [{ title: `${m.demo_server_heading()} | Roxabi` }],
  }),
})

function Home() {
  const router = useRouter()
  const todos = Route.useLoaderData()

  const [todo, setTodo] = useState('')

  const submitTodo = useCallback(async () => {
    await addTodo({ data: todo })
    setTodo('')
    router.invalidate()
  }, [todo, router])

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
          <h1 className="text-3xl font-bold">{m.demo_server_heading()}</h1>
          <p className="mt-2 text-muted-foreground">{m.demo_server_subtitle()}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{m.demo_server_todos()}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="mb-4 space-y-2">
              {todos?.map((t: { id: number; name: string }) => (
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
                placeholder={m.demo_server_placeholder()}
              />
              <Button type="button" disabled={todo.trim().length === 0} onClick={submitTodo}>
                {m.demo_server_add()}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
