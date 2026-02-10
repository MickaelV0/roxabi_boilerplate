import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

export const Route = createFileRoute('/demo/api/names')({
  server: {
    handlers: {
      GET: () => {
        if (import.meta.env.VITE_ENABLE_DEMO !== 'true') {
          return new Response('Not Found', { status: 404 })
        }
        return json(['Alice', 'Bob', 'Charlie'])
      },
    },
  },
})
