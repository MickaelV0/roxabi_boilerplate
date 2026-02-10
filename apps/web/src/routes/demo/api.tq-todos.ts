import { createFileRoute } from '@tanstack/react-router'

const todos = [
  {
    id: 1,
    name: 'Buy groceries',
  },
  {
    id: 2,
    name: 'Buy mobile phone',
  },
  {
    id: 3,
    name: 'Buy laptop',
  },
]

export const Route = createFileRoute('/demo/api/tq-todos')({
  server: {
    handlers: {
      GET: () => {
        if (import.meta.env.VITE_ENABLE_DEMO !== 'true') {
          return Response.json({ error: 'Not Found' }, { status: 404 })
        }
        return Response.json(todos)
      },
      POST: async ({ request }) => {
        if (import.meta.env.VITE_ENABLE_DEMO !== 'true') {
          return Response.json({ error: 'Not Found' }, { status: 404 })
        }
        const name = await request.json()
        const todo = {
          id: todos.length + 1,
          name,
        }
        todos.push(todo)
        return Response.json(todo)
      },
    },
  },
})
